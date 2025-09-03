import dotenv from 'dotenv';
dotenv.config();

import { loadLinks } from './models/shortner.model.js';

async function testLoadLinks() {
    try {
        console.log('🧪 Testing loadLinks function...');
        
        const links = await loadLinks();
        console.log('📊 Raw data from loadLinks:', JSON.stringify(links, null, 2));
        console.log('📏 Data length:', links.length);
        console.log('📋 Data type:', typeof links);
        console.log('🔍 Is array:', Array.isArray(links));
        
        if (links.length > 0) {
            console.log('📝 First item structure:', JSON.stringify(links[0], null, 2));
            
            // Simulate controller processing
            const shortcodesList = links.map(link => ({
                shortCode: link.short_code,
                url: link.url,
                host: 'localhost:3000',
                createdAt: link.created_at
            }));
            
            console.log('🎨 Processed data for template:', JSON.stringify(shortcodesList, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error testing loadLinks:', error);
    }
    
    process.exit(0);
}

testLoadLinks();
