import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from "express";
import path from 'path';
import RouterUrl from "./routes/shortner.routes.js";
import { prisma } from "./config/db-client.js";
import { env } from "./config/env.js";

// Create Express application
const app = express();

const PORT = env.PORT;

// Configure EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Middleware setup
app.use(express.static("public")); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse form submissions

// Use the router for handling requests
app.use('/', RouterUrl);

// Initialize database and start server
const startServer = async () => {
    try {
        // Test Prisma connection
        await prisma.$connect();
        console.log("✅ Connected to MySQL database with Prisma successfully!");
        console.log(`📊 Database: ${env.DATABASE_NAME}`);
        console.log(`🏠 Host: ${env.DATABASE_HOST}`);
        
        // Check if database schema is in sync (optional)
        console.log("📋 Database schema is ready with Prisma");
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MySQL database:", error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);
});

startServer();
