// analyzer/job.js

import pb from './pbClient.js';
import { authenticate, fetchRawData, saveAnalysisReport } from './services/databaseService.js';
import { runAnalysisEngine } from './logic/analysisEngine.js';

export async function runAnalyzerJob() {
    const jobTimestamp = new Date().toISOString();
    console.log(`[AnalyzerJob] [${jobTimestamp}] Iniciando job de análise...`);

    try {
        await authenticate();

        const { hourlyData, dailyData } = await fetchRawData();

        const analysisResults = await runAnalysisEngine(hourlyData, dailyData);

        await saveAnalysisReport(analysisResults);

    } catch (error) {
        console.error(`[AnalyzerJob] [${jobTimestamp}] Erro grave no job de análise:`, error.message);
        if (error.data) {
            console.error("[AnalyzerJob] Dados do erro:", JSON.stringify(error.data, null, 2));
        }
        console.error("[AnalyzerJob] Stack trace:", error.stack || "N/A");
    } finally {
        pb.authStore.clear();
        console.log(`[AnalyzerJob] [${jobTimestamp}] Job de análise finalizado.`);
    }
}