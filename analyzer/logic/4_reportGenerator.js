const classificationRules = [
    {
        condition: ({ risk }) => risk.score <= 2,
        classification: "Dia com condições adversas - cuidado",
        best_for: "interno/cautela"
    },
    {
        condition: ({ pool, risk }) => pool.score >= 4 && risk.score >= 4,
        classification: "Excelente dia para lazer ao ar livre",
        best_for: "piscina/lazer"
    },
    {
        condition: ({ work, risk }) => work.score >= 4 && risk.score >= 4,
        classification: "Ótimo dia para atividades produtivas",
        best_for: "trabalho"
    },
    {
        condition: ({ pool, work, risk }) => pool.score >= 3 && work.score >= 3 && risk.score >= 3,
        classification: "Dia equilibrado e confortável",
        best_for: "equilibrado"
    },
    {
        condition: ({ pool, work }) => pool.score <= 2 && work.score <= 2,
        classification: "Dia ruim - considere ficar em ambientes internos",
        best_for: "interno/cautela"
    },
];

const recommendationRules = [
    {
        condition: (data) => data.aggregates.risk_period?.max_uv > 8,
        text: "Use protetor solar FPS 50+ e evite exposição entre 11h e 15h."
    },
    {
        condition: (data) => data.aggregates.pool_period?.derived_dew_comfort.includes("abafado"),
        text: "Dia abafado - hidrate-se frequentemente."
    },
    {
        condition: (data) => data.aggregates.risk_period?.max_wind_gust > 25,
        text: "Vento moderado a forte - fixe objetos soltos."
    },
    {
        condition: (data) => data.aggregates.pool_period?.max_precip_prob > 0.5,
        text: "Alta chance de chuva - leve guarda-chuva."
    },
    {
        condition: (data) => data.aggregates.pool_period?.derived_cloud_effect === "sol escaldante",
        text: "Sol forte e calor - procure sombra."
    },
    {
        condition: (data) => data.daily_summary.amplitude > 10,
        text: "Grande variação de temperatura - vista-se em camadas."
    },
    {
        condition: (data) => data.aggregates.risk_period?.avg_aqi > 100,
        text: "Qualidade do ar ruim - evite exercícios intensos ao ar livre."
    },
    {
        condition: (data) => data.aggregates.risk_period?.max_lightning_potential > 50,
        text: "Risco de raios - evite áreas abertas e piscina."
    }
];

function getOverallClassification(scores) {
    for (const rule of classificationRules) {
        if (rule.condition(scores)) {
            return { classification: rule.classification, best_for: rule.best_for };
        }
    }
    return { classification: "Dia moderado", best_for: "nenhum" };
}

function getRecommendations(data) {
    const recommendations = recommendationRules
        .filter(rule => rule.condition(data))
        .map(rule => rule.text);

    if (recommendations.length === 0) {
        return ["Condições agradáveis, sem recomendações especiais."];
    }
    
    return recommendations;
}

export function generateReports(contextualDataMap) {
  console.log('[ReportGenerator] Iniciando Etapa 4/5: Geração de Relatórios Finais...');
  
  const finalReports = [];

    for (const [, data] of contextualDataMap.entries()) {
        const { classification, best_for } = getOverallClassification(data.scores);
        const recommendations = getRecommendations(data);

        const report = {
            date: data.date,
            daily_summary: data.daily_summary,
            scores: data.scores,
            temporal_context: data.temporal_context,
            overall_classification: classification,
            best_for: best_for,
            best_time_windows: {
                pool: data.daily_summary.useful_hours_pool,
                work: data.daily_summary.useful_hours_work
            },
            recommendations: recommendations,
            warnings: data.warnings
        };
        
        finalReports.push(report);
    }
  
  console.log(`[ReportGenerator] Etapa 4/5 concluída. ${finalReports.length} relatórios gerados.`);
  return finalReports;
}