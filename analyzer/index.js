import cron from 'node-cron';
import { cronSchedule, timezone } from './config.js';
import { runAnalyzerJob } from './job.js';

let isJobRunning = false;

async function scheduledJob() {
    if (isJobRunning) {
        console.log('[Analyzer] Job anterior ainda em execução. Pulando esta execução.');
        return;
    }
    
    isJobRunning = true;
    try {
        await runAnalyzerJob();
    } catch (error) {
        console.error('[Analyzer] Erro não capturado na execução do job:', error);
    } finally {
        isJobRunning = false;
    }
}

console.log(`[Analyzer] Agendando job para rodar com o padrão cron: "${cronSchedule}" no timezone "${timezone}"`);
cron.schedule(cronSchedule, scheduledJob, {
    scheduled: true,
    timezone: timezone
});

console.log('[Analyzer] Executando o job imediatamente ao iniciar...');
scheduledJob();