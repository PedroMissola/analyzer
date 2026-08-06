# Weather Analysis Engine 🌦️

O **Weather Analysis Engine** é um sistema de microsserviços projetado para coletar, armazenar e analisar dados meteorológicos de forma automatizada, transformando dados brutos de previsão do tempo em relatórios climáticos detalhados. Ele gera pontuações e avaliações para atividades diárias, como lazer e trabalho, além de identificar riscos potenciais.

[![Node.js Version](https://img.shields.io/badge/Node.js-v18-blue.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## 📜 Table of Contents

- [Project Description](#description)
- [Key Features](#key-features-✨)
- [Tech Stack](#tech-stack-🚀)
- [Project Structure](#project-structure-📂)
- [Installation](#installation--getting-started-⚙️)
- [Usage](#usage--how-to-run-▶️)
- [API Endpoints](#api-reference-api-doc)
- [Contributing](#contributing-🤝)
- [License](#license-⚖️)
- [Footer](#footer-made-with-❤️)

## Description 📝

This project is an automated weather analysis engine designed to process raw weather forecast data into actionable climate reports. It utilizes a microservices architecture with a `Worker` service for data collection and an `Analyzer` service for data processing and report generation. The system is orchestrated using Docker Compose, with a MongoDB instance for data storage and Nginx as a reverse proxy.

## Key Features ✨

- **Automated Data Collection:** Gathers hourly and daily weather data, including forecast and air quality, from the Open-Meteo API.
- **Intelligent Analysis Pipeline:** Processes raw data through a multi-stage pipeline: data enrichment, score calculation (for pool, work, risk), temporal context analysis (trend, volatility), and final report generation.
- **Scoring System:** Assigns scores (0-5) and labels to different activity categories based on complex rules.
- **Risk Assessment:** Identifies and reports potential weather-related risks.
- **Temporal Context:** Analyzes trends and volatility of weather conditions over a 7-day window.
- **Microservices Architecture:** Composed of distinct `Worker` and `Analyzer` services for modularity and scalability.
- **Dockerized Deployment:** Easy setup and management using Docker and Docker Compose.
- **Scheduled Jobs:** Utilizes `node-cron` for automated data fetching and analysis at defined intervals.
- **User Interface:** Provides a simple HTML interface for triggering analysis jobs and viewing reports.

## Tech Stack 🚀

- **Backend:** Node.js (JavaScript ESM)
- **Framework:** Express.js
- **Database:** MongoDB
- **API Client:** Axios
- **Scheduling:** `node-cron`
- **Date Utilities:** `date-fns`
- **Math Utilities:** `mathjs`
- **Containerization:** Docker, Docker Compose
- **Reverse Proxy:** Nginx
- **Development:** Nodemon

## Project Structure 📂

```
/ 
├── .env.example          # Environment variables example
├── .gitignore
├── docker-compose.yml    # Docker orchestration
├── nginx/                # Nginx configuration
│   └── nginx.conf
├── analyzer/             # Analysis service and UI
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   └── index.html      # Simple User Interface
│   └── src/
│       ├── analysis/       # Core analysis logic
│       │   ├── rules/
│       │   │   └── scoreRules.js
│       │   ├── utils.js
│       │   ├── pipeline.js
│       ├── config/         # Service configuration
│       │   └── index.js
│       ├── database/
│       │   └── connection.js # DB connection module
│       ├── jobs/
│       │   └── analysisJob.js
│       ├── repositories/
│       │   ├── analysisRepository.js
│       │   └── weatherDataRepository.js
│       ├── index.js        # Service entry point
│       └── server.js       # Express server setup
└── worker/               # Data collection service
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── config/         # Service configuration
        │   └── index.js
        ├── database/
        │   ├── connection.js # DB connection module
        │   └── schema.js     # DB schema and index management
        ├── jobs/
        │   └── weatherJob.js
        ├── repositories/
        │   └── weatherRepository.js
        ├── services/
        │   └── openMeteoApi.js # API client for weather data
        ├── utils/
        │   └── dataProcessor.js
        ├── index.js        # Service entry point
        └── server.js       # Express server setup
```

## Installation & Getting Started ⚙️

### 1. Prerequisites

- [Docker](https://www.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Configuration

1.  Create a `.env` file in the root of the project by copying the contents of `.env.example`:
    ```bash
    cp .env.example .env
    ```
2.  **Crucially**, update the `LOCATION_LATITUDE` and `LOCATION_LONGITUDE` in your `.env` file to the desired location for weather analysis.

    ```ini
    # .env file example
    TZ=America/Sao_Paulo
    MONGO_ROOT_USER=admin
    MONGO_ROOT_PASSWORD=password
    WORKER_CRON_SCHEDULE='0 5 * * *'
    ANALYZER_CRON_SCHEDULE='10 5 * * *'
    LOCATION_LATITUDE=-22.9056
    LOCATION_LONGITUDE=-47.0608
    OPEN_METEO_FORECAST_URL=https://api.open-meteo.com/v1/forecast
    OPEN_METEO_AIR_QUALITY_URL=https://air-quality-api.open-meteo.com/v1/air-quality
    WORKER_PORT=3001
    ```

### 3. Running the Application

Ensure Docker Desktop is running, then execute the following command in the root directory of the project:

```bash
docker-compose up -d --build
```

This command will build the Docker images for the `worker` and `analyzer` services and start all containers (Nginx, MongoDB, Worker, Analyzer) in detached mode.

## Usage / How to Run ▶️

Once the Docker containers are up and running, the services will be accessible:

- **Control Panel (UI & API):**
  - Access the main interface at: `http://localhost:80` 
  - This route is handled by Nginx and forwards requests to the Analyzer service (port 3000).

- **Health Checks (via Nginx):**
  - Analyzer Service: `http://localhost:80/health`
  - Worker Service: `http://localhost:80/worker/health`

### Triggering Jobs Manually ⚙️

While jobs are scheduled to run automatically based on the `*_CRON_SCHEDULE` in your `.env` file, you can manually trigger them for testing or immediate analysis:

1.  **Trigger Worker (Data Collection):**
    - Open your browser's developer console.
    - Navigate to `http://localhost:80` (the main control panel).
    - Execute the following JavaScript code:
      ```javascript
      fetch('http://localhost:80/worker/jobs/weather/run', { method: 'POST' })
          .then(res => res.json())
          .then(console.log);
      ```
    - *Note: The main UI does not have a dedicated button for the worker job.* 

2.  **Trigger Analyzer (Analysis Job):**
    - After triggering the worker job (or waiting for its scheduled run), allow a few moments for data processing.
    - Go to the main control panel (`http://localhost:80`).
    - Click the **"Run Analysis Job"** button.
    - After the analysis job completes, click the **"Fetch Latest Reports"** button to view the generated reports.

## API Reference 📄

### Analyzer Service API

- **`POST /api/jobs/analysis/run`**: Manually triggers the analysis job. Returns `202 Accepted`.
- **`GET /api/reports`**: Fetches the latest analysis reports. Returns an array of report objects.

### Worker Service API (via Nginx Proxy)

- **`POST /worker/jobs/weather/run`**: Manually triggers the data collection job. Returns `202 Accepted`.
- **`GET /worker/health`**: Health check endpoint for the worker service.

## Contributing 🤝

Contributions are welcome! Please feel free to:

- **Fork** the repository.
- **Create** a new branch (`git checkout -b feature/your-feature-name`).
- **Commit** your changes (`git commit -m 'Add some feature'`).
- **Push** to the branch (`git push origin feature/your-feature-name`).
- **Open** a Pull Request.

Please ensure your code adheres to the existing style and includes relevant tests if applicable. Report any issues through the Issues tab.

## License ⚖️

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Footer Made with ❤️

**Weather Analysis Engine**

- **URL:** [https://github.com/PedroMissola/Weather-analysis-engine](https://github.com/PedroMissola/Weather-analysis-engine)
- **Author:** PedroMissola

Give a ⭐️ to show your support!

[![GitHub Stars](https://img.shields.io/github/stars/PedroMissola/Weather-analysis-engine?style=social)](https://github.com/PedroMissola/Weather-analysis-engine/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/PedroMissola/Weather-analysis-engine?style=social)](https://github.com/PedroMissola/Weather-analysis-engine/forks)
