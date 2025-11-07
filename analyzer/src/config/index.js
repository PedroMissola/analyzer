// src/config/index.js

export const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/weather-data';

export const cronSchedule = process.env.ANALYZER_CRON_SCHEDULE || '10 5 * * *';
export const timezone = process.env.TZ || 'America/Sao_Paulo';

export const port = process.env.ANALYZER_PORT || 3000;
