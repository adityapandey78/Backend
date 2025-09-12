import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

const resetDatabase = async () => {
  try {
    // Create connection without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '123456',
      port: 3306,
    });

    console.log('🔗 Connected to MySQL server');

    // Drop and recreate database
    await connection.execute(`DROP DATABASE IF EXISTS ${process.env.DATABASE_NAME || 'url_shortner_mysql'}`);
    console.log('🗑️ Dropped existing database');

    await connection.execute(`CREATE DATABASE ${process.env.DATABASE_NAME || 'url_shortner_mysql'}`);
    console.log('✅ Created fresh database');

    await connection.end();
    console.log('🔄 Database reset complete! Now run: npm run db:migrate');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
