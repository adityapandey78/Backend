import dotenv from 'dotenv';
dotenv.config();

import { db } from './config/db-client.js';

async function checkTableStructure() {
    try {
        console.log('🔍 Checking table structure...');
        
    // Show sample data using Drizzle ORM
    const { short_links } = await import('./drizzle/schema.js');
    const rows = await db.select().from(short_links).limit(5).execute();
    console.log('📋 Sample data:', rows);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}

checkTableStructure();
