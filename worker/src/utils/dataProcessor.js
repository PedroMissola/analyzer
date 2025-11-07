// src/utils/dataProcessor.js

import { parseISO, getUnixTime } from 'date-fns';

/**
 * Processa os dados brutos da API e os transforma em registros para o banco de dados.
 */
export function processApiData(forecastData, airQualityData) {
    console.log('[Processor] Processando dados recebidos das APIs...');

    if (!forecastData?.hourly?.time || !forecastData?.daily?.time || !airQualityData?.hourly?.time) {
        throw new Error('[Processor] Formato inesperado ou dados ausentes na resposta da API.');
    }

    const timeIndexMap = new Map(forecastData.hourly.time.map((ts, index) => [ts, index]));
    const airQualityTimeIndexMap = new Map(airQualityData.hourly.time.map((ts, index) => [ts, index]));

    const hourlyRecords = forecastData.hourly.time.map(timestampStr => {
        const index = timeIndexMap.get(timestampStr);
        const aqIndex = airQualityTimeIndexMap.get(timestampStr);
        const timestamp = parseISO(timestampStr);

        let precipitation_type = 'none';
        if (forecastData.hourly.rain[index] > 0 || forecastData.hourly.showers[index] > 0) {
            precipitation_type = 'rain';
        } else if (forecastData.hourly.snowfall[index] > 0) {
            precipitation_type = 'snow';
        }

        return {
            timestamp: timestamp.toISOString(),
            temperature: forecastData.hourly.temperature_2m[index],
            apparent_temperature: forecastData.hourly.apparent_temperature[index],
            humidity: forecastData.hourly.relative_humidity_2m[index] / 100.0,
            dew_point: forecastData.hourly.dew_point_2m[index],
            precipitation_probability: forecastData.hourly.precipitation_probability[index] / 100.0,
            precipitation: forecastData.hourly.precipitation[index],
            precipitation_type: precipitation_type,
            wind_speed: forecastData.hourly.wind_speed_10m[index],
            wind_gusts: forecastData.hourly.wind_gusts_10m[index],
            wind_direction: forecastData.hourly.wind_direction_10m[index],
            surface_pressure: forecastData.hourly.surface_pressure[index],
            cloud_cover: forecastData.hourly.cloud_cover[index] / 100.0,
            uv_index: forecastData.hourly.uv_index[index],
            lightning_potential: forecastData.hourly.lightning_potential[index],
            aqi: (aqIndex !== undefined && airQualityData.hourly.european_aqi[aqIndex] !== null)
                ? airQualityData.hourly.european_aqi[aqIndex]
                : null
        };
    });

    const dailyRecords = forecastData.daily.time.map((dateStr, i) => ({
        date: dateStr,
        temp_max: forecastData.daily.temperature_2m_max[i],
        temp_min: forecastData.daily.temperature_2m_min[i],
        sunrise_ts: getUnixTime(parseISO(forecastData.daily.sunrise[i])),
        sunset_ts: getUnixTime(parseISO(forecastData.daily.sunset[i]))
    }));

    console.log(`[Processor] Processados ${hourlyRecords.length} registros horários e ${dailyRecords.length} registros diários.`);
    return { hourlyRecords, dailyRecords };
}
