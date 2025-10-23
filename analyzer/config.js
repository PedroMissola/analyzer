// --- 1. Ler Configurações do Ambiente ---

export const pbUrl = process.env.POCKETBASE_URL || 'http://pocketbase:8090';
export const pbAdminEmail = process.env.PB_ADMIN_EMAIL;
export const pbAdminPassword = process.env.PB_ADMIN_PASSWORD;

export const cronSchedule = process.env.ANALYZER_CRON_SCHEDULE || '5 * * * *'; 
export const timezone = process.env.TZ || 'America/Sao_Paulo';

// Configurações geográficas (necessárias para a Etapa 2.1 K - Direção do Vento)
export const latitude = process.env.LOCATION_LATITUDE || '-22.90';
export const longitude = process.env.LOCATION_LONGITUDE || '-47.06';