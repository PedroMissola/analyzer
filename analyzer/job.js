// analyzer/job.js

import pb from './pbClient.js';
import { authenticate, fetchRawData, saveAnalysisReport } from './services/databaseService.js';
import { runAnalysisEngine } from './logic/analysisEngine.js';

export async function runAnalyzerJob() {
    console.log(`[${new Date().toISOString()}] Iniciando job de ANÁLISE...`);
    
    try {
        // --- 1. Autenticar ---
        await authenticate();
        
        // --- 2. Buscar Dados Brutos ---
        // SUBSTITUÍDO: Agora chama a função real
        const { hourlyData, dailyData } = await fetchRawData();

        // --- 3. Rodar Motor de Análise ---
        // (Por enquanto, vamos apenas simular essa etapa)
        // Passamos os dados reais para o motor de análise
        const analysisResults = await runAnalysisEngine(hourlyData, dailyData);
        console.log('[Job] Etapa 2: Motor de análise (Simulado)');

        // --- 4. Salvar Relatórios ---
        // (Por enquanto, vamos apenas simular essa etapa)
        await saveAnalysisReport(analysisResults);
        console.log('[Job] Etapa 3: Salvamento de relatórios (Simulado)');
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro grave no job de ANÁLISE:`, error.message);
        if (error.data) {
            console.error("Dados do Erro:", JSON.stringify(error.data, null, 2));
        }
    } finally {
        pb.authStore.clear();
        console.log(`[${new Date().toISOString()}] Job de ANÁLISE finalizado.`);
    }
}