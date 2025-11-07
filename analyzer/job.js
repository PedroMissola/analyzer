// analyzer/job.js

import { connectToDatabase, fetchRawData, saveAnalysisReport, getLatestAnalysis } from './services/databaseService.js';
import { runAnalysisEngine } from './logic/analysisEngine.js';

export async function runAnalyzerJob() {
    const jobTimestamp = new Date().toISOString();
    console.log(`[AnalyzerJob] [${jobTimestamp}] Iniciando job de análise...`);

    try {
        await connectToDatabase();

        const { hourlyData, dailyData } = await fetchRawData();

        const analysisResults = await runAnalysisEngine(hourlyData, dailyData);

        await saveAnalysisReport(analysisResults);

    } catch (error) {
        console.error(`[AnalyzerJob] [${jobTimestamp}] Erro grave no job de análise:`, error.message);
        if (error.data) {
            console.error("[AnalyzerJob] Dados do erro:", JSON.stringify(error.data, null, 2));
        }
        console.error("[AnalyzerJob] Stack trace:", error.stack || "N/A");
    }
}

export async function getAnalysisFromDb() {
    await connectToDatabase();
    const analysis = await getLatestAnalysis();
    return analysis;
}
