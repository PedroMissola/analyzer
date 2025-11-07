// src/config/index.js

export const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/weather-data';

export const cronSchedule = process.env.WORKER_CRON_SCHEDULE || '0 5 * * *';
export const timezone = process.env.TZ || 'America/Sao_Paulo';

export const latitude = process.env.LOCATION_LATITUDE;
export const longitude = process.env.LOCATION_LONGITUDE;

export const forecastApiUrl = process.env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast';
export const airQualityApiUrl = process.env.OPEN_METEO_AIR_QUALITY_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality';

export const port = process.env.WORKER_PORT || 3001;
