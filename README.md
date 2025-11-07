# Motor de Análise Meteorológica

Este projeto é um sistema de análise meteorológica automatizado, projetado para transformar dados brutos de previsão do tempo em relatórios acionáveis e pontuações de "qualidade do dia".

O sistema é dividido em microsserviços (um `worker` para coleta e um `analyzer` para análise) e orquestrado via Docker Compose. Ele utiliza o **MongoDB** como banco de dados e o **Mongo Express** para gerenciamento via interface web.

## Funcionalidades Principais

*   **Coleta Automatizada:** Um serviço `worker` busca dados de previsão do tempo (incluindo qualidade do ar) da API Open-Meteo em intervalos definidos (via cron job).
*   **Motor de Análise em Pipeline:** O serviço `analyzer` processa os dados brutos em um pipeline de 4 estágios:
    1.  **Enriquecimento:** Agrega dados horários em períodos relevantes (lazer, trabalho, riscos).
    2.  **Pontuação (Scoring):** Aplica regras de negócios e pesos complexos para calcular scores para "Piscina/Lazer" (`pool`), "Trabalho/Produtividade" (`work`) e "Riscos" (`risk`).
    3.  **Análise Temporal:** Avalia tendências (melhora/piora) e volatilidade (estabilidade) em uma janela de 7 dias.
    4.  **Geração de Relatório:** Cria uma classificação final (ex: "Excelente dia para lazer") e recomendações acionáveis (ex: "Use protetor solar").
*   **API de Relatórios:** O `analyzer` expõe uma API REST (`GET /api/reports`) para que sistemas externos (como interfaces gráficas) possam consumir os relatórios de análise em formato JSON.
*   **Containerizado:** Todos os serviços (MongoDB, Mongo Express, Worker, Analyzer) são definidos no `docker-compose.yml` para fácil implantação e escalabilidade.

## Arquitetura e Fluxo de Dados

O sistema é composto por quatro serviços principais orquestrados pelo `docker-compose.yml`:

1.  **`mongo`**:
    *   O banco de dados principal do sistema.
    *   Armazena os dados brutos nas coleções `hourly_data` e `daily_data`.
    *   Armazena os relatórios finais na coleção `analysis_reports`.

2.  **`mongo-express`**:
    *   Uma interface de administração baseada na web para o MongoDB.
    *   Permite visualizar e gerenciar os dados diretamente nas coleções.

3.  **`worker` (O Coletor):**
    *   Serviço Node.js que roda em um agendamento `cron` (definido por `WORKER_CRON_SCHEDULE`).
    *   **Função:** Busca dados das APIs do Open-Meteo.
    *   Processa e formata os dados brutos.
    *   Sincroniza os dados no MongoDB usando uma estratégia **"upsert"**, que insere novos registros e atualiza os existentes, garantindo a integridade e evitando duplicatas.

4.  **`analyzer` (O Cérebro):**
    *   Serviço Node.js que também roda em um agendamento `cron` (definido por `ANALYZER_CRON_SCHEDULE`). Idealmente, ele deve rodar *após* o `worker`.
    *   **Função:** Executa o `AnalysisPipeline`.
    *   Busca os dados brutos que o `worker` salvou no MongoDB.
    *   Executa o pipeline de análise (Enriquecimento -> Pontuação -> Análise Temporal -> Geração de Relatório).
    *   Salva o relatório final na coleção `analysis_reports`, também com uma lógica "upsert".

## O Pipeline de Análise (`analyzer/src/analysis/`)

O núcleo do projeto reside na lógica do `analyzer`, que foi refatorada em um pipeline coeso e modular:

1.  **`pipeline.js`**: Orquestra a execução sequencial de cada estágio da análise.
    *   **Estágio 1: Enriquecimento de Dados:** Agrega os dados horários brutos (ex: média de temperatura, rajada máxima de vento) dentro de janelas de tempo relevantes (`pool_period`, `work_period`, `risk_period`).
    *   **Estágio 2: Cálculo de Score:** Utiliza as regras e pesos definidos em `rules/scoreRules.js` para pontuar cada período.
    *   **Estágio 3: Análise Temporal:** Analisa os scores em uma janela móvel de 7 dias para determinar tendências (`trend`) e volatilidade (`volatility_label`).
    *   **Estágio 4: Geração de Relatório:** Usa os scores finais para atribuir uma classificação geral e gerar recomendações contextuais.

2.  **`rules/scoreRules.js`**: Isola as complexas regras de negócio e pesos, facilitando a manutenção e o ajuste fino dos cálculos de pontuação.

## Como Executar

1.  **Clonar o Repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd <nome-do-repositorio>
    ```

2.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto, baseado no exemplo abaixo. Ele é essencial para alimentar os serviços no `docker-compose.yml`.

    ```.env
    # Fuso horário para os cron jobs e logs
    TZ=America/Sao_Paulo

    # --- Credenciais do Banco de Dados ---
    MONGO_ROOT_USER=admin
    MONGO_ROOT_PASSWORD=password

    # --- Agendamento dos Serviços (formato cron) ---
    WORKER_CRON_SCHEDULE='0 5 * * *'
    ANALYZER_CRON_SCHEDULE='10 5 * * *'

    # --- Configurações de Localização ---
    LOCATION_LATITUDE=-22.9056
    LOCATION_LONGITUDE=-47.0608

    # --- Endpoints de API (padrões) ---
    OPEN_METEO_FORECAST_URL=https://api.open-meteo.com/v1/forecast
    OPEN_METEO_AIR_QUALITY_URL=https://air-quality-api.open-meteo.com/v1/air-quality

    # --- Portas dos Serviços ---
    WORKER_PORT=3001
    ```

3.  **Iniciar os Serviços:**
    Execute o Docker Compose para construir as imagens e iniciar os contêineres em modo detached.
    ```bash
    docker-compose up -d --build
    ```

4.  **Acessar os Serviços:**
    *   **Mongo Express UI:** `http://localhost:8081`
        *   Use as credenciais `MONGO_ROOT_USER` e `MONGO_ROOT_PASSWORD` para logar e visualizar os dados.
    *   **Analyzer API:** `http://localhost:3000/api/reports`
        *   Acesse este endpoint para obter os últimos relatórios de análise em JSON.
    *   **Analyzer UI (Simples):** `http://localhost:3000/`
        *   Uma página simples para acionar a análise manualmente.
    *   **Health Checks:**
        *   Worker: `http://localhost:3001/health`
        *   Analyzer: `http://localhost:3000/health`

5.  **Verificar os Logs:**
    Para acompanhar a execução dos jobs e possíveis erros, use os comandos:
    ```bash
    docker-compose logs -f worker
    docker-compose logs -f analyzer
    ```