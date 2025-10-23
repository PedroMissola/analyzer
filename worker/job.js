import pb from './pbClient.js';
import { analysisHookUrl } from './config.js';
import { fetchWeatherData, triggerAnalysisHook } from './services/apiService.js';
import { processApiData } from './utils/dataProcessor.js';
import { authenticate, syncData } from './services/databaseService.js';

export async function runWeatherJob() {
    console.log(`[${new Date().toISOString()}] Iniciando job de coleta de dados...`);
    
    try {
        // --- 4. Autenticar ---
        await authenticate();
        
        // --- 5. Buscar Dados ---
        const { forecastData, airQualityData } = await fetchWeatherData();
        
        // --- 6. Processar Dados ---
        const { hourlyRecords, dailyRecords } = processApiData(forecastData, airQualityData);
        
        // --- 7. Salvar Dados ---
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