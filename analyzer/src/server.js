// src/server.js

import express from 'express';
import { runAnalysisJob } from './jobs/analysisJob.js';
import { getLatestReports } from './repositories/analysisRepository.js';
import { getDb } from './database/connection.js';

const app = express();

app.use(express.json());
app.use(express.static('public')); // Serve a UI simples

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
app.post('/api/jobs/analysis/run', (req, res) => {
    console.log('[API] Acionamento manual do job de análise recebido.');
    runAnalysisJob(); // Roda em segundo plano
    res.status(202).json({ message: 'O job de análise foi iniciado.' });
});

// Endpoint para obter os relatórios mais recentes
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await getLatestReports();
        res.status(200).json(reports);
    } catch (error) {
        console.error('[API] Erro ao buscar relatórios:', error);
        res.status(500).json({ error: 'Falha ao buscar relatórios de análise.' });
    }
});

export default app;
