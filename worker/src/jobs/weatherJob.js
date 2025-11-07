// src/jobs/weatherJob.js

import { fetchWeatherData } from '../services/openMeteoApi.js';
import { processApiData } from '../utils/dataProcessor.js';
import { syncWeatherData } from '../repositories/weatherRepository.js';

let isJobRunning = false;

/**
 * Executa o job completo de coleta e armazenamento de dados meteorológicos.
 */
export async function runWeatherJob() {
    if (isJobRunning) {
        console.log(`[Job] Tentativa de iniciar o job, mas ele já está em execução.`);
        return;
    }

    isJobRunning = true;
    console.log(`[Job] [${new Date().toISOString()}] Iniciando job de coleta de dados...`);
    
    try {
        // 1. Buscar dados da API
        const { forecastData, airQualityData } = await fetchWeatherData();
        
        // 2. Processar e transformar os dados
        const { hourlyRecords, dailyRecords } = processApiData(forecastData, airQualityData);
        
        // 3. Sincronizar com o banco de dados
        await syncWeatherData(hourlyRecords, dailyRecords);
        
        console.log(`[Job] [${new Date().toISOString()}] Job finalizado com sucesso.`);
        
    } catch (error) {
        console.error(`[Job] [${new Date().toISOString()}] Erro grave durante a execução do job:`, error.message);
    } finally {
        isJobRunning = false;
    }
}
