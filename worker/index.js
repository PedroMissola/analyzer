import cron from 'node-cron';
import { cronSchedule, timezone } from './config.js';
import { runWeatherJob } from './job.js';

let isJobRunning = false;

// Função wrapper para controlar execuções simultâneas
async function scheduledJob() {
    if (isJobRunning) {
        console.log('Job anterior ainda em execução. Pulando esta execução.');
        return;
    }
    
    isJobRunning = true;
    await runWeatherJob();
    isJobRunning = false;
}

// --- 9. Agendar a Tarefa ---
console.log(`Agendando job para rodar com o padrão cron: "${cronSchedule}" no timezone "${timezone}"`);
cron.schedule(cronSchedule, scheduledJob, {
    scheduled: true,
    timezone: timezone
});

// --- 10. Executar Imediatamente ao Iniciar (para teste) ---
console.log('Executando o job imediatamente ao iniciar...');
scheduledJob();