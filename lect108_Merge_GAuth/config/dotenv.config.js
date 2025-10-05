import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file FIRST before anything else
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('✅ dotenv loaded');
