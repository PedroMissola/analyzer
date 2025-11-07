import express from 'express';
import { runAnalyzerJob, getAnalysisFromDb } from './job.js';

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/analysis', async (req, res) => {
    try {
        await runAnalyzerJob();
        const analysis = await getAnalysisFromDb();
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`[Analyzer] Server running at http://localhost:${port}`);
});
