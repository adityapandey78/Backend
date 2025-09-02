import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from "express";
import path from 'path';
import RouterUrl from "./routes/shortner.routes.js";
import { db } from "./config/db-client.js";
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
        // Test MySQL connection pool
        const connection = await db.getConnection();
        await connection.ping();
        connection.release();
        
        console.log("✅ Connected to MySQL database successfully!");
        console.log(`📊 Database: ${env.DATABASE_NAME}`);
        console.log(`🏠 Host: ${env.DATABASE_HOST}`);
        
        // Create table if it doesn't exist
        await createTableIfNotExists();
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MySQL database:", error);
        process.exit(1);
    }
};

// Function to create table if it doesn't exist
const createTableIfNotExists = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS short_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                short_code VARCHAR(20) UNIQUE NOT NULL,
                url VARCHAR(255) NOT NULL
            )
        `;
        
        await db.execute(createTableQuery);
        console.log("📋 Database table 'short_links' is ready");
    } catch (error) {
        console.error("❌ Error creating table:", error);
        throw error;
    }
};

startServer();
