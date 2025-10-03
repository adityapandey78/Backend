import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

config();

const markMigrationAsApplied = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '123456',
      database: process.env.DATABASE_NAME || 'url_shortner_mysql',
      port: 3306,
    });

    console.log('🔗 Connected to database');

    // Read the new migration file
    const migrationFile = readFileSync('./drizzle/migration/0000_blue_stature.sql', 'utf8');
    const migrationHash = createHash('sha256').update(migrationFile).digest('hex');
    
    // Get the next ID
    const [maxIdResult] = await connection.execute(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM __drizzle_migrations'
    );
    const nextId = maxIdResult[0].nextId;
    
    console.log(`📝 Next migration ID: ${nextId}`);
    console.log(`🔒 Migration hash: ${migrationHash.substring(0, 12)}...`);
    
    // Insert into migration history to mark it as applied
    await connection.execute(
      'INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)',
      [nextId, migrationHash, Date.now()]
    );

    console.log('✅ Marked migration as applied without running it');
    console.log('🎉 Your database is now in sync with your schema!');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

markMigrationAsApplied();
