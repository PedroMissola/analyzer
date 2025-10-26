# Motor de Análise Meteorológica

Este projeto é um sistema de análise meteorológica automatizado, projetado para transformar dados brutos de previsão do tempo em relatórios acionáveis e pontuações de "qualidade do dia".

O sistema é dividido em microsserviços (um `worker` para coleta e um `analyzer` para análise) e orquestrado via Docker Compose. Ele utiliza o [PocketBase](https://pocketbase.io/) como um backend (BaaS) leve para armazenamento de dados e o Nginx como reverse proxy.

## Funcionalidades Principais

* **Coleta Automatizada:** Um serviço `worker` busca dados de previsão do tempo (incluindo qualidade do ar) da API Open-Meteo em intervalos definidos (via cron job).
* **Motor de Análise Multi-etapa:** O serviço `analyzer` processa os dados brutos em um pipeline de 4 etapas:
    1.  **Enriquecimento:** Agrega dados horários em períodos relevantes (lazer, trabalho, riscos).
    2.  **Pontuação (Scoring):** Aplica regras de negócios e pesos complexos para calcular scores para "Piscina/Lazer" (`pool`), "Trabalho/Produtividade" (`work`) e "Riscos" (`risk`).
    3.  **Análise Temporal:** Avalia tendências (melhora/piora) e volatilidade (estabilidade) em uma janela de 7 dias.
    4.  **Geração de Relatório:** Cria uma classificação final (ex: "Excelente dia para lazer") e recomendações acionáveis (ex: "Use protetor solar").
* **Containerizado:** Todos os serviços (PocketBase, Worker, Analyzer, Nginx) são definidos no `docker-compose.yml` para fácil implantação.
* **Persistência de Dados:** O PocketBase armazena os dados brutos coletados e os relatórios finais gerados pela análise.

## Arquitetura e Fluxo de Dados

O sistema é composto por quatro serviços principais orquestrados pelo `docker-compose.yml`:

1.  **`pocketbase`**:
    * O banco de dados e backend (BaaS).
    * Armazena os dados brutos em coleções (`hourly_data`, `daily_data`).
    * Armazena os relatórios finais na coleção `full_analysis_report`.

2.  **`nginx`**:
    * Atua como reverse proxy para o serviço `pocketbase`.
    * Expõe a interface de administração e a API do PocketBase na porta `80`.

3.  **`worker` (O Coletor):**
    * É um serviço Node.js que roda em um agendamento `cron` (definido por `WORKER_CRON_SCHEDULE`).
    * **Função:** Busca dados das APIs do Open-Meteo (previsão e qualidade do ar).
    * Processa e formata os dados (`dataProcessor.js`).
    * Limpa os dados antigos e salva os novos dados brutos no PocketBase (`databaseService.js`).

4.  **`analyzer` (O Cérebro):**
    * É um serviço Node.js que também roda em um agendamento `cron` (definido por `ANALYZER_CRON_SCHEDULE`). Idealmente, ele deve rodar *após* o `worker`.
    * **Função:** Executa o motor de análise (`analysisEngine.js`).
    * Busca os dados brutos que o `worker` salvou no PocketBase.
    * Executa o pipeline de análise (Enriquecimento -> Pontuação -> Análise Temporal -> Geração de Relatório).
    * Salva o relatório final (com scores, classificação e recomendações) de volta no PocketBase, utilizando uma lógica "upsert" (atualiza se existe, cria se não).

## O Motor de Análise (`analyzer/logic/`)

O núcleo do projeto reside na lógica do `analyzer`, que é dividida em etapas claras:

1.  **`1_dataEnrichment.js`**:
    * Define os períodos de tempo de interesse (ex: `POOL_DEFAULT_START_HOUR`, `WORK_START_HOUR`).
    * Agrega os dados horários brutos (ex: média de temperatura, rajada máxima de vento) dentro dessas janelas (`pool_period`, `work_period`, `risk_period`).

2.  **`2_scoreCalculator.js`**:
    * Contém as regras de negócio e pesos (`scoreConfigs`) para pontuar cada período.
    * **`pool` (Lazer):** Leva em conta temperatura, sensação térmica, vento, ponto de orvalho, UV, nuvens, etc.
    * **`work` (Trabalho):** Focado em conforto térmico, vento, pressão atmosférica, qualidade do ar (AQI).
    * **`risk` (Risco):** Aplica penalidades severas para condições extremas (vento > 50km/h, raios, AQI > 150, temperaturas extremas).

3.  **`3_temporalAnalysis.js`**:
    * Analisa os scores em uma janela móvel (ex: 3 dias antes e 3 dias depois) para determinar tendências.
    * Calcula a `trend` (tendência: "improving", "deteriorating", "stable") e a `volatility_label` (volatilidade: "estável", "moderada", "alta").
    * Pode aplicar pequenas penalidades ao score do dia se a tendência for de piora.

4.  **`4_reportGenerator.js`**:
    * Utiliza os scores finais para atribuir uma classificação geral (`getOverallClassification`), como "Excelente dia para lazer ao ar livre" ou "Dia com condições adversas - cuidado".
    * Gera recomendações contextuais (`getRecommendations`) com base em gatilhos específicos (ex: se `max_uv > 8`, recomenda protetor solar).

## Como Executar

1.  **Clonar o Repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd <nome-do-repositorio>
    ```

2.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto. Ele é necessário para alimentar os serviços no `docker-compose.yml`.

    ```.env
    # Fuso horário para os cron jobs e logs
    TZ=America/Sao_Paulo

    # Credenciais de admin para o PocketBase (criação automática)
    PB_ADMIN_EMAIL=admin@example.com
    PB_ADMIN_PASSWORD=seu_password_seguro_aqui

    # Agendamento dos serviços (formato cron)
    # Ex: '5 * * * *' = Aos 5 minutos de toda hora
    WORKER_CRON_SCHEDULE=0 5 * * *
    # Ex: '10 * * * *' = Aos 10 minutos de toda hora (deve ser DEPOIS do worker)
    ANALYZER_CRON_SCHEDULE=10 5 * * *

    # Coordenadas para a API de previsão do tempo
    LOCATION_LATITUDE=-22.9056
    LOCATION_LONGITUDE=-47.0608
    ```

3.  **Iniciar os Serviços:**
    ```bash
    docker-compose up -d --build
    ```

4.  **Acessar:**
    * **PocketBase Admin UI:** `http://localhost:80` (ou o IP do seu servidor)
    * Use as credenciais `PB_ADMIN_EMAIL` e `PB_ADMIN_PASSWORD` para logar.
    * Você precisará criar as coleções (`hourly_data`, `daily_data`, `full_analysis_report`) no PocketBase Admin UI para que os serviços possam salvar os dados.

5.  **Verificar os Logs:**
    ```bash
    docker-compose logs -f worker
    docker-compose logs -f analyzer
    ```
