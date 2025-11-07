// --- 1. Ler Configurações do Ambiente ---

export const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/weather-data';

export const cronSchedule = process.env.ANALYZER_CRON_SCHEDULE || '5 * * * *'; 
export const timezone = process.env.TZ || 'America/Sao_Paulo';

// Configurações geográficas (necessárias para a Etapa 2.1 K - Direção do Vento)
export const latitude = process.env.LOCATION_LATITUDE;
export const longitude = process.env.LOCATION_LONGITUDE;