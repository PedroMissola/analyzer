// src/repositories/analysisRepository.js

import { getDb } from '../database/connection.js';

const REPORT_COLLECTION = 'analysis_reports';

/**
 * Salva os relatórios de análise no banco de dados usando uma operação de 'upsert'.
 * @param {Array<Object>} reports - A lista de relatórios para salvar.
 */
export async function saveReports(reports) {
    if (!reports || reports.length === 0) {
        console.log('[Repo] Nenhum relatório de análise para salvar.');
        return;
    }

    console.log(`[Repo] Salvando ${reports.length} relatórios na coleção '${REPORT_COLLECTION}'...`);
    const db = getDb();
    const collection = db.collection(REPORT_COLLECTION);

    const operations = reports.map(report => ({
        updateOne: {
            filter: { date: report.date },
            update: { $set: report },
            upsert: true
        }
    }));

    try {
        const result = await collection.bulkWrite(operations);
        console.log(`[Repo] Relatórios salvos: ${result.upsertedCount} inseridos, ${result.modifiedCount} atualizados.`);
    } catch (error) {
        console.error(`[Repo] Erro ao salvar relatórios de análise via bulkWrite:`, error);
        throw error;
    }
}

/**
 * Busca os relatórios de análise mais recentes, ordenados por data descendente.
 */
export async function getLatestReports() {
    console.log(`[Repo] Buscando relatórios mais recentes da coleção '${REPORT_COLLECTION}'...`);
    const db = getDb();
    const collection = db.collection(REPORT_COLLECTION);
    try {
        const reports = await collection.find({}).sort({ date: -1 }).toArray();
        return reports;
    } catch (err) {
        console.error('[Repo] Erro ao buscar relatórios de análise:', err.message);
        throw err;
    }
}
