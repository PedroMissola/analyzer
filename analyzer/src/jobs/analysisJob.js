// src/jobs/analysisJob.js

import { fetchRawData } from '../repositories/weatherDataRepository.js';
import { saveReports } from '../repositories/analysisRepository.js';
import { runAnalysisPipeline } from '../analysis/pipeline.js';

let isJobRunning = false;

/**
 * Executa o job completo de análise de dados meteorológicos.
 */
export async function runAnalysisJob() {
    if (isJobRunning) {
        console.log(`[Job] Tentativa de iniciar o job de análise, mas ele já está em execução.`);
        return;
    }

    isJobRunning = true;
    const jobTimestamp = new Date().toISOString();
    console.log(`[Job] [${jobTimestamp}] Iniciando job de análise...`);
    
    try {
        // 1. Buscar dados brutos do banco de dados
        const { hourlyData, dailyData } = await fetchRawData();
        
        // 2. Executar a pipeline de análise
        const analysisReports = runAnalysisPipeline(hourlyData, dailyData);
        
        // 3. Salvar os relatórios gerados
        await saveReports(analysisReports);
        
        console.log(`[Job] [${jobTimestamp}] Job de análise finalizado com sucesso.`);
        
    } catch (error) {
        console.error(`[Job] [${jobTimestamp}] Erro grave durante a execução do job de análise:`, error.message);
        // O erro já é logado nos níveis mais baixos, aqui apenas registramos o fracasso do job.
    } finally {
        isJobRunning = false;
    }
}
