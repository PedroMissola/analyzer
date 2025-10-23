import axios from 'axios';
import { format, addDays, subDays } from 'date-fns';
import {
    forecastApiUrl,
    airQualityApiUrl,
    latitude,
    longitude,
    timezone
} from '../configs/config.js';

export async function fetchWeatherData() {
    console.log('Buscando dados das APIs Open-Meteo...');

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

    const [forecastResponse, airQualityResponse] = await Promise.all([
        axios.get(forecastApiUrl, { params: forecastParams }),
        axios.get(airQualityApiUrl, { params: airQualityParams })
    ]);

    console.log('Dados recebidos das APIs.');
    return { 
        forecastData: forecastResponse.data, 
        airQualityData: airQualityResponse.data 
    };
}

export async function triggerAnalysisHook(hookUrl, authToken) {
    try {
        console.log('Disparando hook de análise...');
        
        const config = authToken ? { headers: { 'Authorization': authToken } } : {};
        
        await axios.get(hookUrl, config);
        console.log('Hook de análise disparado com sucesso.');
    } catch (hookErr) {
        console.error('Erro ao disparar hook de análise:', hookErr.message);
    }
}