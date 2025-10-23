// analyzer/services/databaseService.js

import pb from '../pbClient.js';
import { pbAdminEmail, pbAdminPassword } from '../config.js';
import { subDays, addDays, format } from 'date-fns';

/**
 * Autentica o serviço no PocketBase.
 */
export async function authenticate() {
    console.log('[DB Service] Autenticando no PocketBase como usuário de serviço...');
    // Usamos authRefresh para evitar login desnecessário se o token ainda for válido
    await pb.collection('users').authWithPassword(pbAdminEmail, pbAdminPassword);
    console.log(`[DB Service] Autenticado com sucesso como: ${pb.authStore.model.email}`);
}

/**
 * Busca os dados brutos dos últimos 7 dias.
 */
export async function fetchRawData() {
    console.log('[DB Service] Buscando dados brutos (7 dias)...');
    
    // Define a janela de 7 dias
    const today = new Date();
    const startDate = format(subDays(today, 3), 'yyyy-MM-dd');
    const endDate = format(addDays(today, 3), 'yyyy-MM-dd');

    try {
        // 1. Busca todos os registros DIÁRIOS na janela
        const dailyData = await pb.collection('daily_data').getFullList({
            filter: `date >= "${startDate}" && date <= "${endDate}"`,
            sort: 'date'
        });

        // 2. Busca todos os registros HORÁRIOS na janela
        const hourlyData = await pb.collection('hourly_data').getFullList({
            filter: `timestamp >= "${startDate} 00:00:00" && timestamp <= "${endDate} 23:59:59"`,
            sort: 'timestamp'
        });

        if (dailyData.length === 0 || hourlyData.length === 0) {
            throw new Error(`Dados insuficientes encontrados entre ${startDate} e ${endDate}. O 'worker' já rodou?`);
        }

        console.log(`[DB Service] Encontrados ${dailyData.length} registros diários e ${hourlyData.length} registros horários.`);
        
        // Retorna os dados brutos do PocketBase
        return { hourlyData, dailyData };

    } catch (err) {
        console.error('[DB Service] Erro ao buscar dados brutos:', err.message);
        throw err; // Repassa o erro para o job.js
    }
}

/**
 * Salva o relatório de análise no banco.
 * (Ainda não implementado)
 */
export async function saveAnalysisReport(reports) {
    console.log(`[DB Service] ${reports.length} relatórios recebidos para salvar (Simulado).`);
    // Implementaremos o "Upsert" (create or update) em 'full_analysis_report' aqui
    return;
}