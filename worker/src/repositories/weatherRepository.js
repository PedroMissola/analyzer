// src/repositories/weatherRepository.js

import { getDb } from '../database/connection.js';

/**
 * Sincroniza os registros horários no banco de dados usando 'upsert'.
 * @param {Array<Object>} hourlyRecords - Uma lista de registros horários.
 */
async function syncHourlyData(hourlyRecords) {
    if (!hourlyRecords || hourlyRecords.length === 0) {
        console.log('[Repo] Nenhum registro horário para sincronizar.');
        return;
    }

    const db = getDb();
    const collection = db.collection('hourly_data');

    const operations = hourlyRecords.map(record => ({
        updateOne: {
            filter: { timestamp: record.timestamp },
            update: { $set: record },
            upsert: true
        }
    }));

    console.log(`[Repo] Sincronizando ${operations.length} registros horários...`);
    const result = await collection.bulkWrite(operations);
    console.log(`[Repo] Registros horários sincronizados: ${result.upsertedCount} inseridos, ${result.modifiedCount} atualizados.`);
}

/**
 * Sincroniza os registros diários no banco de dados usando 'upsert'.
 * @param {Array<Object>} dailyRecords - Uma lista de registros diários.
 */
async function syncDailyData(dailyRecords) {
    if (!dailyRecords || dailyRecords.length === 0) {
        console.log('[Repo] Nenhum registro diário para sincronizar.');
        return;
    }

    const db = getDb();
    const collection = db.collection('daily_data');

    const operations = dailyRecords.map(record => ({
        updateOne: {
            filter: { date: record.date },
            update: { $set: record },
            upsert: true
        }
    }));

    console.log(`[Repo] Sincronizando ${operations.length} registros diários...`);
    const result = await collection.bulkWrite(operations);
    console.log(`[Repo] Registros diários sincronizados: ${result.upsertedCount} inseridos, ${result.modifiedCount} atualizados.`);
}

/**
 * Sincroniza todos os dados meteorológicos (horários e diários).
 * @param {Array<Object>} hourlyRecords - A lista de registros horários.
 * @param {Array<Object>} dailyRecords - A lista de registros diários.
 */
export async function syncWeatherData(hourlyRecords, dailyRecords) {
    console.log('[Repo] Iniciando sincronização de dados com o banco de dados...');
    await Promise.all([
        syncHourlyData(hourlyRecords),
        syncDailyData(dailyRecords)
    ]);
    console.log('[Repo] Sincronização de dados concluída.');
}
