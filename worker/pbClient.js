import PocketBase from 'pocketbase';
import { pbUrl } from './config.js';

// --- 2. Inicializar Cliente PocketBase ---
const pb = new PocketBase(pbUrl);
pb.autoCancellation(false); // Desativa cancelamento automático para longas operações

export default pb;