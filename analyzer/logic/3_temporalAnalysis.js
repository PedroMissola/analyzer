import { mean, std } from 'mathjs';
import { format, addDays, parseISO } from 'date-fns';

const WINDOW_DAYS = 3;
const MIN_SCORES_FOR_ANALYSIS = 3;
const TREND_THRESHOLD = 1;
const VOLATILITY_HIGH_THRESHOLD = 1.5;
const VOLATILITY_MODERATE_THRESHOLD = 1.0;
const DETERIORATING_TREND_PENALTY = -0.5;
const FUTURE_RISK_SCORE_THRESHOLD = 2;

function getScoreWindow(centerDate, scoreType, dataMap) {
    const centerDateObj = parseISO(`${centerDate}T12:00:00Z`);
    const scores = [];
    for (let i = -WINDOW_DAYS; i <= WINDOW_DAYS; i++) {
        const date = format(addDays(centerDateObj, i), 'yyyy-MM-dd');
        const dayData = dataMap.get(date);
        const score = dayData ? dayData.scores[scoreType].score : null;
        scores.push({ date, score, isFuture: i > 0, isPast: i < 0 });
    }
    return scores;
}

function calculateTrend(pastScores, nextScores) {
    if (pastScores.length === 0 || nextScores.length === 0) {
        return { trend: "stable", avg_previous: null, avg_next: null };
    }

    const avg_previous = parseFloat(mean(pastScores).toFixed(1));
    const avg_next = parseFloat(mean(nextScores).toFixed(1));
    const difference = avg_next - avg_previous;

    let trend = "stable";
    if (difference > TREND_THRESHOLD) trend = "improving";
    if (difference < -TREND_THRESHOLD) trend = "deteriorating";

    return { trend, avg_previous, avg_next };
}

function calculateVolatility(scores) {
    const value = parseFloat(std(scores).toFixed(2));
    let label = "estável";
    if (value > VOLATILITY_HIGH_THRESHOLD) label = "alta";
    else if (value > VOLATILITY_MODERATE_THRESHOLD) label = "moderada";
    return { value, label };
}

export function analyzeTemporalContext(scoredDataMap) {
  console.log('[TemporalAnalysis] Iniciando Etapa 3: Análise de Contexto Temporal...');
  const contextualDataMap = new Map();

    for (const [dateStr, data] of scoredDataMap.entries()) {
        const temporal_context = { pool: {}, work: {}, risk: {} };
        const warnings = new Set(data.warnings || []);

        for (const scoreType of ['pool', 'work', 'risk']) {
            const scoreWindow = getScoreWindow(dateStr, scoreType, scoredDataMap);
            const validScores = scoreWindow.filter(s => s.score !== null).map(s => s.score);

            if (validScores.length < MIN_SCORES_FOR_ANALYSIS) continue;

            const pastScores = scoreWindow.filter(s => s.isPast && s.score !== null).map(s => s.score);
            const nextScores = scoreWindow.filter(s => s.isFuture && s.score !== null).map(s => s.score);

            const { trend, avg_previous, avg_next } = calculateTrend(pastScores, nextScores);
            const { value: volatility_val, label: volatility_label } = calculateVolatility(validScores);

            let currentScore = data.scores[scoreType].score;

            if (trend === "deteriorating" && volatility_val > VOLATILITY_MODERATE_THRESHOLD) {
                currentScore += DETERIORATING_TREND_PENALTY;
                warnings.add("Condições devem piorar nos próximos dias.");
            }
            if (volatility_val > VOLATILITY_HIGH_THRESHOLD) {
                warnings.add("Condições instáveis, verifique previsão horária.");
            }
            if (scoreType === 'risk' && nextScores.some(s => s <= FUTURE_RISK_SCORE_THRESHOLD)) {
                warnings.add("Condições adversas esperadas nos próximos 3 dias.");
            }

            data.scores[scoreType].score = Math.max(0, Math.round(currentScore * 2) / 2);

            temporal_context[scoreType] = {
                trend,
                volatility_val,
                volatility_label,
                avg_previous,
                avg_next
            };
        }

        const contextualData = {
            ...data,
            temporal_context,
            warnings: Array.from(warnings)
        };
        contextualDataMap.set(dateStr, contextualData);
    }

    console.log(`[TemporalAnalysis] Etapa 3 concluída. ${contextualDataMap.size} dias analisados (contexto).`);
    return contextualDataMap;
}