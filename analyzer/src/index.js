// src/index.js

import cron from 'node-cron';
import app from './server.js';
import { port, cronSchedule, timezone } from './config/index.js';
import { connectToDatabase, closeDatabaseConnection } from './database/connection.js';
import { runAnalysisJob } from './jobs/analysisJob.js';

async function startServer() {
    try {
        // 1. Conectar ao banco de dados
        await connectToDatabase();

        // 2. Agendar o job recorrente
        console.log(`[Cron] Agendando job de análise para rodar com a expressão: ${cronSchedule}`);
        cron.schedule(cronSchedule, runAnalysisJob, {
            timezone: timezone
        });

        // 3. Iniciar o servidor Express
        const server = app.listen(port, () => {
            console.log(`[Server] Analyzer server em execução na porta ${port}`);
            console.log(`[Server] Health check: http://localhost:${port}/health`);
            console.log(`[Server] UI disponível em: http://localhost:${port}/`);
            console.log(`[Server] API de relatórios: http://localhost:${port}/api/reports`);
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
        console.error('[Server] Falha ao iniciar o analyzer:', error);
        process.exit(1);
    }
}

startServer();
