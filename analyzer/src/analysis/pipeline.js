// src/analysis/pipeline.js

import { getHours, parseISO, addDays, format } from 'date-fns';
import { mean, std } from 'mathjs';
import { aggregateHourlyData } from './utils.js';
import { scoreConfigs } from './rules/scoreRules.js';

// --- Stage 1: Data Enrichment ---

function enrichData(hourlyData, dailyData) {
    console.log('[Pipeline-1] Enriquecendo dados brutos...');
    const enrichedDataMap = new Map();
    const hourlyDataByDay = new Map();
    hourlyData.forEach(record => {
        const day = record.timestamp.substring(0, 10);
        if (!hourlyDataByDay.has(day)) hourlyDataByDay.set(day, []);
        hourlyDataByDay.get(day).push(record);
    });

    dailyData.forEach(daily => {
        const dateStr = daily.date.substring(0, 10);
        const dayHourlyData = hourlyDataByDay.get(dateStr);
        if (!dayHourlyData || dayHourlyData.length === 0) return;

        const { sunrise_ts, sunset_ts, temp_max, temp_min } = daily;
        const day_length_hours = parseFloat(((sunset_ts - sunrise_ts) / 3600).toFixed(2));
        const sunrise_hour = getHours(new Date(sunrise_ts * 1000));
        const sunset_hour = getHours(new Date(sunset_ts * 1000));

        const pool_start = Math.max(10, sunrise_hour + 1);
        const pool_end = Math.min(18, sunset_hour - 1);

        enrichedDataMap.set(dateStr, {
            date: dateStr,
            daily_summary: { temp_max, temp_min, amplitude: temp_max - temp_min, day_length_hours, useful_hours_pool: `${pool_start}h-${pool_end}h`, useful_hours_work: `7h-18h` },
            aggregates: {
                pool_period: aggregateHourlyData(dayHourlyData, pool_start, pool_end),
                work_period: aggregateHourlyData(dayHourlyData, 7, 18),
                risk_period: aggregateHourlyData(dayHourlyData, 0, 23),
            }
        });
    });
    console.log(`[Pipeline-1] ${enrichedDataMap.size} dias enriquecidos.`);
    return enrichedDataMap;
}

// --- Stage 2: Score Calculation ---

function getScoreLabel(score, type = 'default') {
    if (type === 'risk') {
        if (score <= 2) return "Alto Risco";
        if (score === 3) return "Risco Moderado";
        return "Sem riscos";
    }
    const labels = ["Péssimo", "Ruim", "Tolerável", "Bom/Adequado", "Muito bom", "Excepcional"];
    return labels[score] || "Péssimo";
}

function calculateScores(enrichedDataMap) {
    console.log('[Pipeline-2] Calculando scores...');
    const scoredDataMap = new Map();

    enrichedDataMap.forEach((data, date) => {
        const scores = {};
        const warnings = new Set();

        ['pool', 'work', 'risk'].forEach(type => {
            const config = scoreConfigs[type];
            const metrics = data.aggregates[type === 'risk' ? 'risk_period' : `${type}_period`];
            if (!metrics) {
                scores[type] = { score: 0, label: "Péssimo", breakdown: {}, warnings: ["Sem dados no período"] };
                return;
            }

            let totalPoints = 0;
            const breakdown = {};
            const context = { temp: metrics.avg_temp, wind_speed: metrics.avg_wind, temp_max: data.daily_summary.temp_max };

            const ruleSet = type === 'risk' ? config.penalties : config.rules;

            for (const key in ruleSet) {
                const rule = ruleSet[key];
                const weight = config.weights ? config.weights[key] : 1;
                let value;
                switch (key) {
                    case 'amplitude': case 'day_length': value = data.daily_summary[key]; break;
                    case 'wind_direction': value = metrics.derived_wind_direction_effect; break;
                    case 'clouds': value = metrics.avg_cloud_cover * 100; break;
                    case 'wind': value = type === 'risk' ? metrics.max_wind_gust : metrics.avg_wind; break;
                    case 'precipitation': value = type === 'risk' ? metrics.max_precip_hourly : metrics.avg_precip; break;
                    case 'lightning': value = metrics.max_lightning_potential; break;
                    case 'extreme_temp': value = data.daily_summary.temp_min; break;
                    case 'uv': value = metrics.max_uv; break;
                    default: value = metrics[`avg_${key}`];
                }

                const result = rule(value, context);
                const point = weight * result;
                breakdown[key] = point;
                totalPoints += point;

                if (type === 'risk' && result < 0) {
                    warnings.add(key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
                }
            }
            
            let finalScore100 = type === 'risk' ? Math.max(0, 100 + totalPoints) : Math.max(0, totalPoints);
            if (type === 'pool' && metrics.total_precipitation > 0) finalScore100 *= 0.3;

            const normalizedScore = Math.round((finalScore100 / 100) * 5);
            const finalScore = Math.max(0, Math.min(5, normalizedScore));
            
            scores[type] = { score: finalScore, label: getScoreLabel(finalScore, type), breakdown };
        });

        scoredDataMap.set(date, { ...data, scores, warnings: Array.from(warnings) });
    });
    console.log(`[Pipeline-2] ${scoredDataMap.size} dias pontuados.`);
    return scoredDataMap;
}

// --- Stage 3: Temporal Analysis ---

function analyzeTemporalContext(scoredDataMap) {
    console.log('[Pipeline-3] Analisando contexto temporal...');
    const contextualDataMap = new Map();
    const WINDOW_DAYS = 3;

    scoredDataMap.forEach((data, dateStr) => {
        const temporal_context = { pool: {}, work: {}, risk: {} };
        const warnings = new Set(data.warnings || []);
        const centerDateObj = parseISO(`${dateStr}T12:00:00Z`);

        ['pool', 'work', 'risk'].forEach(type => {
            const scoreWindow = Array.from({ length: 2 * WINDOW_DAYS + 1 }, (_, i) => {
                const date = format(addDays(centerDateObj, i - WINDOW_DAYS), 'yyyy-MM-dd');
                const dayData = scoredDataMap.get(date);
                return { score: dayData?.scores[type]?.score ?? null, isPast: i < WINDOW_DAYS, isFuture: i > WINDOW_DAYS };
            });

            const validScores = scoreWindow.filter(s => s.score !== null).map(s => s.score);
            if (validScores.length < 3) return;

            const pastScores = scoreWindow.filter(s => s.isPast && s.score !== null).map(s => s.score);
            const nextScores = scoreWindow.filter(s => s.isFuture && s.score !== null).map(s => s.score);
            
            const avg_previous = pastScores.length > 0 ? parseFloat(mean(pastScores).toFixed(1)) : null;
            const avg_next = nextScores.length > 0 ? parseFloat(mean(nextScores).toFixed(1)) : null;
            const difference = avg_next - avg_previous;

            let trend = "stable";
            if (difference > 1) trend = "improving";
            if (difference < -1) trend = "deteriorating";

            const volatility_val = parseFloat(std(validScores).toFixed(2));
            let volatility_label = "estável";
            if (volatility_val > 1.5) volatility_label = "alta";
            else if (volatility_val > 1.0) volatility_label = "moderada";

            if (trend === "deteriorating") warnings.add(`Condições de ${type} devem piorar nos próximos dias.`);
            if (volatility_label === "alta") warnings.add(`Condições de ${type} instáveis, verifique previsão horária.`);
            if (type === 'risk' && nextScores.some(s => s <= 2)) warnings.add("Condições adversas esperadas nos próximos 3 dias.");

            temporal_context[type] = { trend, volatility_val, volatility_label, avg_previous, avg_next };
        });

        contextualDataMap.set(dateStr, { ...data, temporal_context, warnings: Array.from(warnings) });
    });
    console.log(`[Pipeline-3] ${contextualDataMap.size} dias analisados (contexto).`);
    return contextualDataMap;
}

// --- Stage 4: Report Generation ---

function generateReports(contextualDataMap) {
    console.log('[Pipeline-4] Gerando relatórios finais...');
    const finalReports = [];
    const classificationRules = [
        { c: ({ risk }) => risk.score <= 2, cl: "Dia com condições adversas - cuidado", bf: "interno/cautela" },
        { c: ({ pool, risk }) => pool.score >= 4 && risk.score >= 4, cl: "Excelente dia para lazer ao ar livre", bf: "piscina/lazer" },
        { c: ({ work, risk }) => work.score >= 4 && risk.score >= 4, cl: "Ótimo dia para atividades produtivas", bf: "trabalho" },
        { c: ({ pool, work, risk }) => pool.score >= 3 && work.score >= 3 && risk.score >= 3, cl: "Dia equilibrado e confortável", bf: "equilibrado" },
        { c: ({ pool, work }) => pool.score <= 2 && work.score <= 2, cl: "Dia ruim - considere ficar em ambientes internos", bf: "interno/cautela" },
    ];
    const recommendationRules = [
        { c: (d) => d.aggregates.risk_period?.max_uv > 8, t: "Use protetor solar FPS 50+ e evite exposição entre 11h e 15h." },
        { c: (d) => d.aggregates.pool_period?.derived_dew_comfort.includes("abafado"), t: "Dia abafado - hidrate-se frequentemente." },
        { c: (d) => d.aggregates.risk_period?.max_wind_gust > 25, t: "Vento moderado a forte - fixe objetos soltos." },
        { c: (d) => d.aggregates.pool_period?.max_precip_prob > 0.5, t: "Alta chance de chuva - leve guarda-chuva." },
        { c: (d) => d.daily_summary.amplitude > 10, t: "Grande variação de temperatura - vista-se em camadas." },
        { c: (d) => d.aggregates.risk_period?.avg_aqi > 100, t: "Qualidade do ar ruim - evite exercícios intensos ao ar livre." },
        { c: (d) => d.aggregates.risk_period?.max_lightning_potential > 50, t: "Risco de raios - evite áreas abertas e piscina." }
    ];

    contextualDataMap.forEach(data => {
        const { classification, best_for } = classificationRules.find(r => r.c(data.scores)) || { cl: "Dia moderado", bf: "nenhum" };
        let recommendations = recommendationRules.filter(r => r.c(data)).map(r => r.t);
        if (recommendations.length === 0) recommendations.push("Condições agradáveis, sem recomendações especiais.");

        finalReports.push({
            date: data.date,
            daily_summary: data.daily_summary,
            scores: data.scores,
            temporal_context: data.temporal_context,
            overall_classification: classification,
            best_for: best_for,
            best_time_windows: { pool: data.daily_summary.useful_hours_pool, work: data.daily_summary.useful_hours_work },
            recommendations,
            warnings: data.warnings
        });
    });
    console.log(`[Pipeline-4] ${finalReports.length} relatórios gerados.`);
    return finalReports;
}

// --- Main Pipeline Executor ---

export function runAnalysisPipeline(hourlyData, dailyData) {
    console.log('[AnalysisEngine] Iniciando pipeline de análise completa...');
    try {
        const enrichedData = enrichData(hourlyData, dailyData);
        const scoredData = calculateScores(enrichedData);
        const contextualData = analyzeTemporalContext(scoredData);
        const finalReports = generateReports(contextualData);

        console.log('[AnalysisEngine] Pipeline finalizado com sucesso.');
        return finalReports;
    } catch (error) {
        console.error('[AnalysisEngine] Falha catastrófica durante a execução da pipeline:', error);
        throw error;
    }
}
