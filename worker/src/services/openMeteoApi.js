// src/services/openMeteoApi.js

import axios from 'axios';
import { format, addDays, subDays } from 'date-fns';
import {
    forecastApiUrl,
    airQualityApiUrl,
    latitude,
    longitude,
    timezone
} from '../config/index.js';

/**
 * Busca os dados de previsão do tempo e qualidade do ar das APIs Open-Meteo.
 */
export async function fetchWeatherData() {
    console.log('[API] Buscando dados das APIs Open-Meteo...');

    if (!latitude || !longitude) {
        throw new Error('[API] Latitude e Longitude não foram configuradas nas variáveis de ambiente.');
    }

    const today = new Date();
    const startDate = format(subDays(today, 3), 'yyyy-MM-dd');
    const endDate = format(addDays(today, 3), 'yyyy-MM-dd');

    const forecastParams = {
        latitude, longitude, timezone, start_date: startDate, end_date: endDate,
        hourly: [
            'temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'dew_point_2m',
            'precipitation_probability', 'precipitation', 'rain', 'showers', 'snowfall',
            'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
            'surface_pressure', 'cloud_cover', 'uv_index', 'lightning_potential'
        ].join(','),
        daily: [
            'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset'
        ].join(',')
    };

    const airQualityParams = {
        latitude, longitude, timezone, start_date: startDate, end_date: endDate,
        hourly: 'european_aqi'
    };

    try {
        const [forecastResponse, airQualityResponse] = await Promise.all([
            axios.get(forecastApiUrl, { params: forecastParams }),
            axios.get(airQualityApiUrl, { params: airQualityParams })
        ]);

        console.log('[API] Dados recebidos com sucesso.');
        return {
            forecastData: forecastResponse.data,
            airQualityData: airQualityResponse.data
        };
    } catch (error) {
        console.error('[API] Erro ao buscar dados das APIs Open-Meteo:', error.message);
        if (error.response?.data) {
            console.error("Detalhes do Erro da API:", JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}
