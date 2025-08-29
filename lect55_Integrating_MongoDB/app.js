import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from "express";
import path from 'path';
import RouterUrl from "./routes/shortner.routes.js";
import dbClient from "./config/db-client.js";
import { env } from "./config/env.js";

// Create Express application
const app = express();

const PORT = env.PORT;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Middleware setup
app.use(express.static("public")); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse form submissions

// app.set("view engine","ejs");

// express router
// app.use(RouterUrl); // Use the router for handling requests

//use the router
app.use('/',RouterUrl)

// Connect to MongoDB and start the server
const startServer = async () => {
    try {
        await dbClient.connect();
        console.log("Connected to MongoDB successfully!");
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
};

startServer();
