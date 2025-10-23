import cron from 'node-cron';
import { cronSchedule, timezone } from './config.js';
import { runAnalyzerJob } from './job.js'; // Importa o job de análise

let isJobRunning = false;

// Função wrapper para controlar execuções simultâneas
async function scheduledJob() {
    if (isJobRunning) {
        console.log('Job de ANÁLISE anterior ainda em execução. Pulando.');
        return;
    }
    
    isJobRunning = true;
    await runAnalyzerJob(); // Chama o job de análise
    isJobRunning = false;
}

// --- 9. Agendar a Tarefa ---
console.log(`[Analyzer] Agendando job para rodar com o padrão cron: "${cronSchedule}" no timezone "${timezone}"`);
cron.schedule(cronSchedule, scheduledJob, {
    scheduled: true,
    timezone: timezone
});

// --- 10. Executar Imediatamente ao Iniciar (para teste) ---
console.log('[Analyzer] Executando o job imediatamente ao iniciar...');
scheduledJob();