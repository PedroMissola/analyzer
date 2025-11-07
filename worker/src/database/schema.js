// src/database/schema.js

import { getDb } from './connection.js';

/**
 * Garante que as coleções e seus índices necessários existam.
 */
export async function ensureSchema() {
    console.log('[DB] Garantindo a existência de coleções e índices...');
    try {
        const db = getDb();
        
        // Coleção de dados horários
        const hourlyCollection = db.collection('hourly_data');
        await hourlyCollection.createIndex({ timestamp: 1 }, { unique: true });
        
        // Coleção de dados diários
        const dailyCollection = db.collection('daily_data');
        await dailyCollection.createIndex({ date: 1 }, { unique: true });
        
        console.log('[DB] Índices de coleções verificados/criados com sucesso.');
    } catch (error) {
        console.error('[DB] Erro ao garantir o schema do banco de dados:', error);
        throw error;
    }
}
