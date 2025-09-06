import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from "express";
import path from 'path';
import RouterUrl from "./routes/shortner.routes.js";
import { db } from "./config/db-client.js";
import { env } from "./config/env.js";
import { authRoutes } from './routes/auth.routes.js';
import { sql } from 'drizzle-orm';

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
app.use(authRoutes);
app.use('/', RouterUrl);

// Initialize database and start server
const startServer = async () => {
    try {
        // Test Drizzle connection with a simple query
        await db.execute(sql`SELECT 1 as test`);
        console.log("✅ Connected to MySQL database with Drizzle ORM successfully!");
        console.log(`📊 Database: ${env.DATABASE_NAME}`);
        console.log(`🏠 Host: ${env.DATABASE_HOST}`);
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
    await db.end && db.end();
    console.log('✅ Database connection closed');
    process.exit(0);
});

startServer();
