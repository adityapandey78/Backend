import { config } from 'dotenv';
config();

export default {
  schema: './drizzle/schema.js',
  out: './drizzle/migration',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '123456',
    database: process.env.DATABASE_NAME || 'url_shortner_mysql',
    port: 3306,
  },
};
