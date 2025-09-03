import { z } from "zod";

// Schema for environment variables with defaults
export const env = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_HOST: z.string().default("localhost"),
    DATABASE_USER: z.string().default("root"), 
    DATABASE_PASSWORD: z.string().default("123456"), // Use your actual password as default
    DATABASE_NAME: z.string().default("url_shortner_mysql"),
}).parse(process.env);

console.log("🔧 Environment variables loaded:");
console.log(`   Port: ${env.PORT}`);
console.log(`   Database Host: ${env.DATABASE_HOST}`);
console.log(`   Database User: ${env.DATABASE_USER}`);
console.log(`   Database Password: ${env.DATABASE_PASSWORD ? '***HIDDEN***' : 'NOT SET'}`);
console.log(`   Database Name: ${env.DATABASE_NAME}`);