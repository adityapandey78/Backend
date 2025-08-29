import dotenv from 'dotenv';
dotenv.config();

import dbClient from './config/db-client.js';
import { env } from './config/env.js';

async function testMongoDB() {
    try {
        console.log('Testing MongoDB connection...');
        await dbClient.connect();
        console.log('✅ Connected to MongoDB successfully!');
        
        const db = dbClient.db(env.MONGODB_DATABASE_NAME);
        console.log(`✅ Connected to database: ${env.MONGODB_DATABASE_NAME}`);
        
        const collection = db.collection('shortners');
        console.log('✅ Collection initialized');
        
        // Test insert
        const testDoc = {
            shortCode: 'test123',
            url: 'https://example.com',
            createdAt: new Date()
        };
        
        const insertResult = await collection.insertOne(testDoc);
        console.log('✅ Test document inserted:', insertResult.insertedId);
        
        // Test find
        const docs = await collection.find().toArray();
        console.log('✅ Documents in collection:', docs.length);
        console.log('Documents:', docs);
        
        // Clean up test document
        await collection.deleteOne({ _id: insertResult.insertedId });
        console.log('✅ Test document cleaned up');
        
        await dbClient.close();
        console.log('✅ Connection closed');
        
    } catch (error) {
        console.error('❌ MongoDB test failed:', error);
    }
}

testMongoDB();
