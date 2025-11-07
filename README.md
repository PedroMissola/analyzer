# Weather Analysis Engine

O **Weather Analysis Engine** é um sistema de microsserviços projetado para coletar, armazenar e analisar dados meteorológicos. Ele gera relatórios diários com pontuações (scores) para atividades específicas (como lazer e trabalho) e avalia riscos, fornecendo recomendações e classificações sobre a qualidade do dia.

## Visão Geral da Arquitetura

O projeto é composto por dois serviços principais (`Worker` e `Analyzer`), um banco de dados (`MongoDB`) e um proxy reverso (`Nginx`), todos orquestrados com `Docker Compose`.

### Componentes

1.  **`Worker` (Serviço de Coleta)**

      * **Responsabilidade:** Coletar dados meteorológicos brutos.
      * **Funcionamento:** Um job agendado (cron) é executado em intervalos definidos (ex: `0 5 * * *` - às 5h da manhã).
      * Ele busca dados de previsão do tempo e qualidade do ar da API Open-Meteo.
      * Os dados são processados e transformados em registros horários e diários.
      * Os registros são salvos (com `upsert`) no MongoDB nas coleções `hourly_data` e `daily_data`.
      * Expõe um endpoint para acionamento manual: `POST /worker/jobs/weather/run` (acessível via Nginx).

2.  **`Analyzer` (Serviço de Análise)**

      * **Responsabilidade:** Analisar os dados brutos e gerar relatórios.
      * **Funcionamento:** Também possui um job agendado (cron) que roda *após* o worker (ex: `10 5 * * *` - às 5h10).
      * Ele lê os dados brutos (`hourly_data`, `daily_data`) do MongoDB.
      * Executa uma **pipeline de análise** de 4 estágios:
        1.  **Enriquecimento:** Agrega dados horários em períodos de interesse (lazer, trabalho, risco).
        2.  **Cálculo de Score:** Pontua (0-5) três categorias (`pool`, `work`, `risk`) com base em regras de pontuação complexas.
        3.  **Análise Temporal:** Analisa a tendência (melhorando/piorando) e a volatilidade dos scores em uma janela de 7 dias.
        4.  **Geração de Relatório:** Cria um relatório final com classificação ("Excelente dia para lazer"), recomendações e alertas.
      * Salva os relatórios na coleção `analysis_reports` no MongoDB.
      * Serve uma **interface de usuário (UI)** estática e endpoints de API para consultar os relatórios (`GET /api/reports`) e acionar a análise (`POST /api/jobs/analysis/run`).

3.  **`Nginx` (API Gateway / Proxy Reverso)**

      * Unifica os serviços sob a porta `80`.
      * Roteia requisições `locahost/` para o `Analyzer` (UI e API de relatórios).
      * Roteia requisições `localhost/worker/` para a API do `Worker` (ex: `localhost/worker/health`).

4.  **`Mongo` e `Mongo-Express`**

      * `mongo`: Instância do banco de dados MongoDB para persistência dos dados.
      * `mongo-express`: Uma interface web para visualização e gerenciamento do banco, disponível em `http://localhost:8081`.

-----

## Estrutura do Projeto

```
/
├── analyzer/         # Serviço de análise e UI
│   ├── public/         # UI (index.html)
│   ├── src/
│   │   ├── analysis/   # Lógica central (pipeline, rules, utils)
│   │   ├── database/   # Conexão com DB
│   │   ├── jobs/       # Job de análise (cron)
│   │   ├── repositories/ # Acesso aos dados (reports, weather)
│   │   ├── config/     # Configurações (portas, cron)
│   │   ├── index.js    # Ponto de entrada (inicia cron e server)
│   │   └── server.js   # API Express (health, reports, run job)
│   ├── Dockerfile
│   └── package.json
├── worker/           # Serviço de coleta de dados
│   ├── src/
│   │   ├── database/   # Conexão e schema do DB
│   │   ├── jobs/       # Job de coleta (cron)
│   │   ├── repositories/ # Acesso aos dados (weather)
│   │   ├── services/   # Cliente da API Open-Meteo
│   │   ├── utils/      # Processador dos dados da API
│   │   ├── config/     # Configurações (API, cron)
│   │   ├── index.js    # Ponto de entrada (inicia cron e server)
│   │   └── server.js   # API Express (health, run job)
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf      # Proxy reverso e roteamento
├── .gitignore
├── docker-compose.yml  # Orquestração dos serviços
└── .env.example        # (Arquivo de exemplo de variáveis de ambiente)
```

-----

## Tecnologias Utilizadas

  * **Backend:** Node.js (JavaScript ESM)
  * **Framework Web:** Express.js
  * **Banco de Dados:** MongoDB
  * **Agendamento de Tarefas:** `node-cron`
  * **Cliente HTTP:** `axios` (no Worker)
  * **Manipulação de Datas:** `date-fns`
  * **Cálculos Estatísticos:** `mathjs` (no Analyzer)
  * **Infraestrutura:** Docker, Docker Compose
  * **Servidor/Proxy:** Nginx
  * **Desenvolvimento:** Nodemon (para hot-reload)

-----

## Como Rodar o Projeto

### 1\. Pré-requisitos

  * [Docker](https://www.docker.com/get-started)
  * [Docker Compose](https://docs.docker.com/compose/install/)

### 2\. Configuração

Antes de iniciar, crie um arquivo `.env` na raiz do projeto (você pode copiar o conteúdo abaixo).

**Atenção:** É crucial atualizar `LOCATION_LATITUDE` e `LOCATION_LONGITUDE` para a localidade que você deseja analisar.

```ini
# Fuso horário para os cron jobs e logs
TZ=America/Sao_Paulo

# --- Credenciais do Banco de Dados ---
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password

# --- Agendamento dos Serviços (formato cron) ---
# Ex: '5 * * * *' = Aos 5 minutos de toda hora
WORKER_CRON_SCHEDULE='0 5 * * *'
# Ex: '10 * * * *' = Aos 10 minutos de toda hora (deve ser DEPOIS do worker)
ANALYZER_CRON_SCHEDULE='10 5 * * *'

# --- Configurações de Localização ---
LOCATION_LATITUDE=-22.9056
LOCATION_LONGITUDE=-47.0608

# --- Endpoints de API ---
OPEN_METEO_FORECAST_URL=https://api.open-mexeo.com/v1/forecast
OPEN_METEO_AIR_QUALITY_URL=https://air-quality-api.open-meteo.com/v1/air-quality

# --- Portas dos Serviços ---
WORKER_PORT=3001
```

### 3\. Execução

Com o Docker Desktop em execução, rode o seguinte comando na raiz do projeto:

```bash
# Constrói as imagens e inicia todos os contêineres em modo "detached" (background)
docker-compose up -d --build
```

### 4\. Acessando os Serviços

Após os contêineres iniciarem (pode levar alguns segundos), os serviços estarão disponíveis:

  * **Painel de Controle (UI):**

      * `http://localhost:80`
      * (Mapeado pelo Nginx para o serviço `analyzer` na porta 3000)

  * **Mongo Express (UI do DB):**

      * `http://localhost:8081`
      * (Use as credenciais `MONGO_ROOT_USER` e `MONGO_ROOT_PASSWORD` do `.env` para logar)

  * **Health Checks (via Nginx):**

      * **Analyzer:** `http://localhost:80/health`
      * **Worker:** `http://localhost:80/worker/health`

### 5\. Acionando Jobs Manualmente

Os jobs rodam automaticamente com base no `CRON_SCHEDULE`. Se quiser testar imediatamente, você pode acioná-los:

1.  **Acionar o Worker (Coleta):**

      * Acesse o Painel (`http://localhost:80`), abra o console do navegador e rode:
        ```javascript
        fetch('http://localhost:80/worker/jobs/weather/run', { method: 'POST' })
            .then(res => res.json())
            .then(console.log);
        ```
      * *Nota: O painel principal não tem um botão para o worker, apenas para o analyzer.*

2.  **Acionar o Analyzer (Análise):**

      * Aguarde alguns segundos após acionar o worker.
      * Acesse o Painel (`http://localhost:80`) e clique no botão **"Run Analysis Job"**.
      * Após a conclusão, clique em **"Fetch Latest Reports"** para ver os resultados.