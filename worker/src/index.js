// src/index.js

import cron from 'node-cron';
import app from './server.js';
import { port, cronSchedule, timezone } from './config/index.js';
import { connectToDatabase, closeDatabaseConnection } from './database/connection.js';
import { ensureSchema } from './database/schema.js';
import { runWeatherJob } from './jobs/weatherJob.js';

async function startServer() {
    try {
        // 1. Conectar ao banco de dados e garantir o schema
        await connectToDatabase();
        await ensureSchema();

        // 2. Agendar o job recorrente
        console.log(`[Cron] Agendando job para rodar com a expressão: ${cronSchedule}`);
        cron.schedule(cronSchedule, runWeatherJob, {
            timezone: timezone
        });

        // 3. Iniciar o servidor Express
        const server = app.listen(port, () => {
            console.log(`[Server] Worker server em execução na porta ${port}`);
            console.log(`[Server] Health check disponível em http://localhost:${port}/health`);
            console.log(`[Server] Para acionamento manual, use: POST http://localhost:${port}/jobs/weather/run`);
        });
        
        // 4. Lidar com o desligamento gracioso
        process.on('SIGINT', async () => {
            console.log('[Server] Recebido SIGINT. Desligando graciosamente...');
            server.close(async () => {
                console.log('[Server] Servidor HTTP fechado.');
                await closeDatabaseConnection();
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('[Server] Falha ao iniciar o worker:', error);
        process.exit(1);
    }
}

startServer();
