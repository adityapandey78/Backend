import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

const checkDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '123456',
      database: process.env.DATABASE_NAME || 'url_shortner_mysql',
      port: 3306,
    });

    console.log('🔗 Connected to database');

    // Check what tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Existing tables:', tables);

    // Check structure of short_links table if it exists
    try {
      const [shortLinksStructure] = await connection.execute('DESCRIBE short_links');
      console.log('\n📝 short_links table structure:');
      shortLinksStructure.forEach(column => {
        console.log(`  ${column.Field} - ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
      });
    } catch (err) {
      console.log('❌ short_links table does not exist');
    }

    // Check structure of users table if it exists
    try {
      const [usersStructure] = await connection.execute('DESCRIBE users');
      console.log('\n👥 users table structure:');
      usersStructure.forEach(column => {
        console.log(`  ${column.Field} - ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
      });
    } catch (err) {
      console.log('❌ users table does not exist');
    }

    // Check migration history
    try {
      const [migrationHistory] = await connection.execute('SELECT * FROM __drizzle_migrations');
      console.log('\n📈 Migration history:');
      migrationHistory.forEach(migration => {
        console.log(`  ${migration.id} - ${migration.hash} - ${migration.created_at}`);
      });
    } catch (err) {
      console.log('❌ No migration history found (table __drizzle_migrations does not exist)');
    }

    await connection.end();

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
};

checkDatabase();
