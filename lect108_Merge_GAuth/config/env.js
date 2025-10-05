// Load dotenv FIRST before reading process.env
import './dotenv.config.js';
import { z } from "zod";

// Schema for environment variables with defaults
export const env = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_HOST: z.string().default("localhost"),
    DATABASE_USER: z.string().default("root"),
    DATABASE_PASSWORD: z.string().default(""),
    DATABASE_NAME: z.string().default("url_shortener"),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    GOOGLE_CLIENT_ID: z.string().optional().default(""),
    GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
    JWT_SECRET: z.string().default("fallback-jwt-secret-change-in-production"),
    RESEND_API_KEY: z.string().optional().default(""),
}).parse(process.env);

// console.log("🔧 Environment variables loaded:");
// console.log(`   Port: ${env.PORT}`);
// console.log(`   Database Host: ${env.DATABASE_HOST}`);
// console.log(`   Database User: ${env.DATABASE_USER}`);
// console.log(`   Database Password: ${env.DATABASE_PASSWORD ? '***HIDDEN***' : 'NOT SET'}`);
// console.log(`   Database Name: ${env.DATABASE_NAME}`);
// console.log(`   JWT Secret: ${env.JWT_SECRET ? '***CONFIGURED***' : 'NOT SET'}`);
// console.log(`   Google Client ID: ${env.GOOGLE_CLIENT_ID ? '***SET***' : 'NOT SET'}`);
// console.log(`   Google Client Secret: ${env.GOOGLE_CLIENT_SECRET ? '***SET***' : 'NOT SET'}`);