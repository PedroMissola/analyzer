import pb from './configs/pbClient.js';
import { fetchWeatherData } from './services/apiService.js';
import { processApiData } from './utils/dataProcessor.js';
import { authenticate, syncData } from './services/databaseService.js';

export async function runWeatherJob() {
    console.log(`[${new Date().toISOString()}] Iniciando job de coleta de dados...`);
    
    try {
        await authenticate();
        
        const { forecastData, airQualityData } = await fetchWeatherData();
        
        const { hourlyRecords, dailyRecords } = processApiData(forecastData, airQualityData);
        
        await syncData(hourlyRecords, dailyRecords);
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro grave durante a execução do job:`, error.message);
        if (error.response?.data) {
            console.error("Dados do Erro:", JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        pb.authStore.clear();
        console.log(`[${new Date().toISOString()}] Job finalizado.`);
    }
}