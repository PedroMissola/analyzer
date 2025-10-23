import cron from 'node-cron';
import { cronSchedule, timezone } from './configs/config.js';
import { runWeatherJob } from './job.js';

let isJobRunning = false;

async function scheduledJob() {
    if (isJobRunning) {
        console.log('Job anterior ainda em execução. Pulando esta execução.');
        return;
    }
    
    isJobRunning = true;
    await runWeatherJob();
    isJobRunning = false;
}

console.log(`Agendando job para rodar com o padrão cron: "${cronSchedule}" no timezone "${timezone}"`);
cron.schedule(cronSchedule, scheduledJob, {
    scheduled: true,
    timezone: timezone
});

console.log('Executando o job imediatamente ao iniciar...');
scheduledJob();