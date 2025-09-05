// ===== PREVIOUS MYSQL SETUP (COMMENTED OUT) =====
// import mysql from "mysql2/promise";
// import { env } from "./env.js";

// // Create MySQL connection pool for better connection management
// const pool = mysql.createPool({
//     host: env.DATABASE_HOST,
//     user: env.DATABASE_USER,
//     password: env.DATABASE_PASSWORD,
//     database: env.DATABASE_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// console.log("🔗 MySQL connection pool created successfully!");

// // Export the pool as db for compatibility
// export const db = pool;

// ===== NEW PRISMA SETUP =====
import { PrismaClient } from "../generated/prisma/index.js";

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Enable logging for debugging
});

console.log("🔗 Prisma Client initialized successfully!");

// Export prisma instance for use across the application
export { prisma };

// Optional: Export as db for backward compatibility if needed
export const db = prisma;
