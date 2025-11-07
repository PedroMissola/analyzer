// src/repositories/weatherDataRepository.js

import { getDb } from '../database/connection.js';

/**
 * Busca os dados meteorológicos brutos (horários e diários) do banco de dados.
 * A janela de busca é de 7 dias (3 dias para trás, hoje, 3 dias para frente).
 */
export async function fetchRawData() {
    console.log('[Repo] Buscando dados brutos para análise...');
    const db = getDb();
    
    // Define a janela de 7 dias para a busca
    const today = new Date();
    const startDate = new Date(new Date().setDate(today.getDate() - 3));
    const endDate = new Date(new Date().setDate(today.getDate() + 3));

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    try {
        const dailyData = await db.collection('daily_data')
            .find({ date: { $gte: startDateString, $lte: endDateString } })
            .sort({ date: 1 })
            .toArray();

        const hourlyData = await db.collection('hourly_data')
            .find({ timestamp: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } })
            .sort({ timestamp: 1 })
            .toArray();

        if (dailyData.length === 0 || hourlyData.length === 0) {
            throw new Error(`Dados insuficientes encontrados entre ${startDateString} e ${endDateString}. O 'worker' precisa ser executado primeiro.`);
        }
        
        console.log(`[Repo] Encontrados ${dailyData.length} registros diários e ${hourlyData.length} registros horários.`);
        return { hourlyData, dailyData };
    } catch (err) {
        console.error('[Repo] Erro ao buscar dados brutos:', err.message);
        throw err;
    }
}
