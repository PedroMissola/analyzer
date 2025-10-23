import pb from '../pbClient.js';
import { pbAdminEmail, pbAdminPassword } from '../config.js';

export async function authenticate() {
    console.log('Autenticando no PocketBase como usuário de serviço...');
    try {
        await pb.collection('users').authWithPassword(pbAdminEmail, pbAdminPassword);
        console.log(`Autenticado com sucesso como: ${pb.authStore.model.email}`);
    } catch (authErr) {
        console.error('Falha ao autenticar usuário de serviço no PocketBase:', authErr.message);
        if (authErr.status === 404) {
            console.error("Verifique se sua coleção de usuários realmente se chama 'users'.");
        }
        throw authErr; // Re-lança para parar a execução
    }
}

async function clearCollection(collectionName) {
    const idsToDelete = (await pb.collection(collectionName).getFullList({ fields: 'id' })).map(r => r.id);
    
    const deletePromises = [];
    for (const id of idsToDelete) {
        deletePromises.push(pb.collection(collectionName).delete(id));
    }
    
    if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
    }
    return deletePromises.length;
}

async function createRecords(collectionName, records) {
    console.log(`Inserindo ${records.length} registros em '${collectionName}'...`);
    const createPromises = [];
    for (const record of records) {
        createPromises.push(pb.collection(collectionName).create(record));
    }
    await Promise.all(createPromises);
}

export async function syncData(hourlyRecords, dailyRecords) {
    console.log('Salvando dados no PocketBase...');
    
    // Parte 1: Limpar coleções antigas
    console.log('Limpando coleções antigas...');
    const [hourlyDeleted, dailyDeleted] = await Promise.all([
        clearCollection('hourly_data'),
        clearCollection('daily_data')
    ]);
    console.log(`Coleções antigas limpas (removidos ${hourlyDeleted + dailyDeleted} registros).`);
    
    // Parte 2: Inserir novos dados
    console.log('Inserindo novos dados...');
    await Promise.all([
        createRecords('hourly_data', hourlyRecords),
        createRecords('daily_data', dailyRecords)
    ]);
    
    console.log('Dados salvos com sucesso no PocketBase.');
}