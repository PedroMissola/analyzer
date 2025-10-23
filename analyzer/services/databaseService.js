// analyzer/services/databaseService.js

import pb from '../pbClient.js';
import { pbAdminEmail, pbAdminPassword } from '../config.js';
import { subDays, addDays, format } from 'date-fns';

/**
 * Autentica o serviço no PocketBase.
 */
export async function authenticate() {
    console.log('[DB Service] Autenticando no PocketBase como usuário de serviço...');
    try {
        // Autentica sempre com usuário e senha. Se a intenção fosse usar authRefresh, a lógica seria diferente.
        await pb.collection('users').authWithPassword(pbAdminEmail, pbAdminPassword);
        console.log(`[DB Service] Autenticado com sucesso como: ${pb.authStore.model.email}`);
    } catch (authErr) {
        console.error('[DB Service] Falha ao autenticar usuário de serviço no PocketBase:', authErr.message);
        if (authErr.status === 404) {
            console.error("[DB Service] Verifique se sua coleção de usuários realmente se chama 'users' e se as credenciais estão corretas.");
        } else if (authErr.status === 400) {
            console.error("[DB Service] Credenciais de autenticação inválidas. Verifique PB_ADMIN_EMAIL e PB_ADMIN_PASSWORD.");
        }
        throw authErr; // Re-lança o erro para parar a execução do job
    }
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
export async function saveAnalysisReport(analysisReports) {
    console.log(`[DB Service] Salvando ${analysisReports.length} relatórios de análise...`);
    const upsertPromises = [];

    for (const report of analysisReports) {
        upsertPromises.push(async () => {
            try {
                // Assumimos que 'date' é um campo único para identificar o relatório diário.
                // Adapte o filtro se o identificador único for outro (ex: 'id' ou combinação de campos).
                const existingRecords = await pb.collection('full_analysis_report').getFullList({
                    filter: `date = "${report.date}"`,
                    fields: 'id' // Busca apenas o ID para otimizar
                });

                if (existingRecords.length > 0) {
                    // Se existir, atualiza o primeiro registro encontrado
                    await pb.collection('full_analysis_report').update(existingRecords[0].id, report);
                    console.log(`[DB Service] Relatório para a data ${report.date} atualizado.`);
                } else {
                    // Se não existir, cria um novo registro
                    await pb.collection('full_analysis_report').create(report);
                    console.log(`[DB Service] Relatório para a data ${report.date} criado.`);
                }
            } catch (error) {
                console.error(`[DB Service] Erro ao salvar relatório para a data ${report.date}:`, error.message);
                throw error; // Re-lança o erro para que o job possa tratá-lo
            }
        }, Promise.resolve()); // Invoca a função assíncrona imediatamente
    }

    await Promise.all(upsertPromises);
    console.log('[DB Service] Todos os relatórios de análise processados.');
}