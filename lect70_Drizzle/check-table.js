import dotenv from 'dotenv';
dotenv.config();

import { db } from './config/db-client.js';

async function checkTableStructure() {
    try {
        console.log('🔍 Checking table structure...');
        
        // Show table structure
        const [columns] = await db.execute("DESCRIBE short_links");
        console.log('📊 Table columns:', columns);
        
        // Show actual data
        const [rows] = await db.execute("SELECT * FROM short_links LIMIT 5");
        console.log('📋 Sample data:', rows);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}

checkTableStructure();
