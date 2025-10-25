// analyzer/services/databaseService.js

import pb from '../pbClient.js';
import { pbAdminEmail, pbAdminPassword } from '../config.js';
import { subDays, addDays, format } from 'date-fns';
 
export async function authenticate() {
    console.log('[DB Service] Autenticando no PocketBase como usuário de serviço...');
    await pb.collection('users').authWithPassword(pbAdminEmail, pbAdminPassword);
    console.log(`[DB Service] Autenticado com sucesso como: ${pb.authStore.model.email}`);
}
 
export async function fetchRawData() {
    console.log('[DB Service] Buscando dados brutos em uma janela de 7 dias...');
    
    const today = new Date();
    const startDate = format(subDays(today, 3), 'yyyy-MM-dd');
    const endDate = format(addDays(today, 3), 'yyyy-MM-dd');
 
    try {
        const dailyData = await pb.collection('daily_data').getFullList({
            filter: `date >= "${startDate}" && date <= "${endDate}"`,
            sort: 'date'
        });
        const hourlyData = await pb.collection('hourly_data').getFullList({
            filter: `timestamp >= "${startDate} 00:00:00" && timestamp <= "${endDate} 23:59:59"`,
            sort: 'timestamp'
        });
 
        if (dailyData.length === 0 || hourlyData.length === 0) {
            throw new Error(`Dados insuficientes encontrados entre ${startDate} e ${endDate}. O 'worker' já rodou?`);
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
    const collection = pb.collection('full_analysis_report');
 
    for (const report of reports) {
        try {
            const existing = await collection.getFirstListItem(`date ~ "${report.date}"`);
            
            console.log(`[DB Service] Atualizando relatório para ${report.date} (ID: ${existing.id})`);
            await collection.update(existing.id, report);

        } catch (error) {
            if (error.status === 404) {
                console.log(`[DB Service] Criando novo relatório para ${report.date}`);
                await collection.create(report);
            } else {
                console.error(`[DB Service] Erro ao salvar relatório para ${report.date}:`, error);
                throw error; 
            }
        }
    }
 
    console.log(`[DB Service] ${reports.length} relatórios salvos com sucesso.`);
}