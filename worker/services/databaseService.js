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
        throw authErr;
    }
}

async function clearCollection(collectionName) {
    console.log(`Limpando coleção ${collectionName}...`);
    const items = await pb.collection(collectionName).getFullList({ fields: 'id' });
    const deletePromises = items.map(item => pb.collection(collectionName).delete(item.id));
    
    await Promise.all(deletePromises);
    console.log(`${items.length} registros deletados de ${collectionName}.`);
    return items.length;
}

async function createRecords(collectionName, records) {
    console.log(`Inserindo ${records.length} registros em '${collectionName}'...`);
    const createPromises = records.map(record => pb.collection(collectionName).create(record));
    await Promise.all(createPromises);
    console.log(`Inserção em ${collectionName} concluída.`);
}

export async function syncData(hourlyRecords, dailyRecords) {
    console.log('Salvando dados no PocketBase...');
    
    console.log('Limpando coleções antigas...');
    const [hourlyDeleted, dailyDeleted] = await Promise.all([
        clearCollection('hourly_data'),
        clearCollection('daily_data')
    ]);
    console.log(`Coleções antigas limpas (removidos ${hourlyDeleted + dailyDeleted} registros).`);
    
    console.log('Inserindo novos dados...');
    await Promise.all([
        createRecords('hourly_data', hourlyRecords),
        createRecords('daily_data', dailyRecords)
    ]);
    
    console.log('Dados salvos com sucesso no PocketBase.');
}