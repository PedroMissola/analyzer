// --- 1. Ler Configurações do Ambiente ---

export const pbUrl = process.env.POCKETBASE_URL || 'http://pocketbase:8090';
export const pbAdminEmail = process.env.PB_ADMIN_EMAIL;
export const pbAdminPassword = process.env.PB_ADMIN_PASSWORD;

export const cronSchedule = process.env.WORKER_CRON_SCHEDULE || '0 5 * * *';
export const timezone = process.env.TZ || 'America/Sao_Paulo';

export const latitude = process.env.LOCATION_LATITUDE;
export const longitude = process.env.LOCATION_LONGITUDE;

export const forecastApiUrl = process.env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast';
export const airQualityApiUrl = process.env.OPEN_METEO_AIR_QUALITY_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality';
export const analysisHookUrl = `${pbUrl}/api/custom/run-scorer`;