// analyzer/logic/analysisEngine.js
import { enrichData } from './1_dataEnrichment.js';
import { calculateScores } from './2_scoreCalculator.js';
import { analyzeTemporalContext } from './3_temporalAnalysis.js';
import { generateReports } from './4_reportGenerator.js';

export function runAnalysisEngine(hourlyData, dailyData) {
    console.log('[AnalysisEngine] Iniciado.');
    
    try {
        const enrichedDataMap = enrichData(hourlyData, dailyData);
        const scoredDataMap = calculateScores(enrichedDataMap);
        const contextualDataMap = analyzeTemporalContext(scoredDataMap);
        const finalReports = generateReports(contextualDataMap);

        console.log('[AnalysisEngine] Finalizado com sucesso.');
        return finalReports;
    } catch (error) {
        console.error('[AnalysisEngine] Falha durante a execução do motor de análise:', error);
        throw error;
    }
}