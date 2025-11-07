// src/database/connection.js

import { MongoClient } from 'mongodb';
import { mongoUrl } from '../config/index.js';

const client = new MongoClient(mongoUrl);
let dbInstance;

export async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }
    try {
        await client.connect();
        dbInstance = client.db();
        console.log('[DB] Conectado ao MongoDB com sucesso!');
        return dbInstance;
    } catch (error) {
        console.error('[DB] Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

export function getDb() {
    if (!dbInstance) {
        throw new Error('[DB] Conexão com o banco de dados não foi estabelecida.');
    }
    return dbInstance;
}

export async function closeDatabaseConnection() {
    if (client) {
        await client.close();
        console.log('[DB] Conexão com o MongoDB fechada.');
    }
}
