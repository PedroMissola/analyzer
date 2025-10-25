import { getHours } from 'date-fns';
import { aggregateHourlyData } from './utils.js';

const POOL_DEFAULT_START_HOUR = 10;
const POOL_DEFAULT_END_HOUR = 18;
const WORK_START_HOUR = 7;
const WORK_END_HOUR = 18;
const FULL_DAY_START_HOUR = 0;
const FULL_DAY_END_HOUR = 23;

export function enrichData(hourlyData, dailyData) {
    console.log('[Enrichment] Iniciando Etapa 1: Pré-processamento e Enriquecimento...');
    
    const enrichedDataMap = new Map();

    const hourlyDataByDay = new Map();
    for (const record of hourlyData) {
        const day = record.timestamp.substring(0, 10);
        if (!hourlyDataByDay.has(day)) {
            hourlyDataByDay.set(day, []);
        }
        hourlyDataByDay.get(day).push(record);
    }

    for (const daily of dailyData) {
        const dateStr = daily.date.substring(0, 10);
        const dayHourlyData = hourlyDataByDay.get(dateStr);

        if (!dayHourlyData || dayHourlyData.length === 0) {
            console.warn(`[Enrichment] Faltando dados horários para ${dateStr}. Pulando...`);
            continue;
        }

        const { sunrise_ts, sunset_ts, temp_max, temp_min } = daily;

        const day_length_hours = parseFloat(((sunset_ts - sunrise_ts) / 3600).toFixed(2));
        
        const sunrise_hour = getHours(new Date(sunrise_ts * 1000));
        const sunset_hour = getHours(new Date(sunset_ts * 1000));
        
        const pool_start = Math.max(POOL_DEFAULT_START_HOUR, sunrise_hour + 1);
        const pool_end = Math.min(POOL_DEFAULT_END_HOUR, sunset_hour - 1);

        const aggregates = {
            pool_period: aggregateHourlyData(dayHourlyData, pool_start, pool_end),
            work_period: aggregateHourlyData(dayHourlyData, WORK_START_HOUR, WORK_END_HOUR),
            risk_period: aggregateHourlyData(dayHourlyData, FULL_DAY_START_HOUR, FULL_DAY_END_HOUR),
        };

        const amplitude = temp_max - temp_min;

        enrichedDataMap.set(dateStr, {
            date: dateStr,
            daily_summary: {
                temp_max: temp_max,
                temp_min: temp_min,
                amplitude: amplitude,
                day_length_hours: day_length_hours,
                useful_hours_pool: `${pool_start}h-${pool_end}h`,
                useful_hours_work: `${WORK_START_HOUR}h-${WORK_END_HOUR}h`,
            },
            aggregates: aggregates
        });
    }

    console.log(`[Enrichment] Etapa 1 concluída. ${enrichedDataMap.size} dias enriquecidos.`);
    return enrichedDataMap;
}