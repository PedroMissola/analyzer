// analyzer/services/databaseService.js

import { MongoClient } from 'mongodb';
import { mongoUrl } from '../config.js';

const client = new MongoClient(mongoUrl);
let db;

export async function connectToDatabase() {
    try {
        if (db) return;
        await client.connect();
        db = client.db();
        console.log('[DB Service] Conectado ao MongoDB com sucesso!');
    } catch (error) {
        console.error('[DB Service] Erro ao conectar ao MongoDB:', error);
        throw error;
    }
}

export async function fetchRawData() {
    console.log('[DB Service] Buscando dados brutos em uma janela de 7 dias...');
    
    const today = new Date();
    const startDate = new Date(today.setDate(today.getDate() - 3));
    const endDate = new Date(today.setDate(today.getDate() + 6)); // +3 from today, so +6 from start

    try {
        const dailyData = await db.collection('daily_data').find({
            date: { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] }
        }).sort({ date: 1 }).toArray();

        const hourlyData = await db.collection('hourly_data').find({
            timestamp: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
        }).sort({ timestamp: 1 }).toArray();

        if (dailyData.length === 0 || hourlyData.length === 0) {
            throw new Error(`Dados insuficientes encontrados entre ${startDate.toISOString().split('T')[0]} e ${endDate.toISOString().split('T')[0]}. O 'worker' já rodou?`);
        }
        
        console.log(`[DB Service] Encontrados ${dailyData.length} registros diários e ${hourlyData.length} registros horários.`);
        return { hourlyData, dailyData };
    } catch (err) {
        console.error('[DB Service] Erro ao buscar dados brutos:', err.message);
        throw err;
    }
}

export async function saveAnalysisReport(reports) {
    if (!reports || reports.length === 0) {
        console.log('[DB Service] Nenhum relatório para salvar.');
        return;
    }

    console.log(`[DB Service] Salvando ${reports.length} relatórios de análise (lógica upsert)...`);
    const collection = db.collection('full_analysis_report');

    for (const report of reports) {
        try {
            const query = { date: report.date };
            const update = { $set: report };
            const options = { upsert: true };

            await collection.updateOne(query, update, options);
            console.log(`[DB Service] Relatório para ${report.date} salvo com sucesso (upsert).`);

        } catch (error) {
            console.error(`[DB Service] Erro ao salvar relatório para ${report.date}:`, error);
            throw error; 
        }
    }

    console.log(`[DB Service] ${reports.length} relatórios salvos com sucesso.`);
}

export async function getLatestAnalysis() {
    console.log('[DB Service] Buscando o último relatório de análise...');
    try {
        const collection = db.collection('full_analysis_report');
        const reports = await collection.find({}).sort({ date: -1 }).toArray();
        return reports;
    } catch (err) {
        console.error('[DB Service] Erro ao buscar o último relatório de análise:', err.message);
        throw err;
    }
}