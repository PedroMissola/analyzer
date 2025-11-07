// src/server.js

import express from 'express';
import { runWeatherJob } from './jobs/weatherJob.js';
import { getDb } from './database/connection.js';

const app = express();

app.use(express.json());

// Endpoint de health-check
app.get('/health', (req, res) => {
    try {
        getDb(); 
        res.status(200).json({ status: 'ok', db: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', db: 'disconnected', message: error.message });
    }
});

// Endpoint para acionar o job manualmente
app.post('/jobs/weather/run', async (req, res) => {
    console.log('[API Server] Acionamento manual do job de coleta de dados recebido.');
    runWeatherJob(); 
    res.status(202).json({ message: 'O job de coleta de dados foi iniciado.' });
});

export default app;
