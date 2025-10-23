import PocketBase from 'pocketbase';
import { pbUrl } from './config.js';

const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);

export default pb;