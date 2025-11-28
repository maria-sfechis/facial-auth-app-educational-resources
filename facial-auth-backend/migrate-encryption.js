const mysql = require('mysql2/promise');
const encryptionService = require('./encryption');
require('dotenv').config();

async function migrateData() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Get all users with unencrypted descriptors
    const [users] = await db.query(
      'SELECT id, face_descriptor FROM users WHERE face_descriptor_encrypted IS NULL'
    );

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      if (user.face_descriptor) {
        const descriptor = JSON.parse(user.face_descriptor);
        const encrypted = encryptionService.encrypt(descriptor);
        
        await db.query(
          'UPDATE users SET face_descriptor_encrypted = ?, encryption_iv = ? WHERE id = ?',
          [JSON.stringify(encrypted.data), encrypted.iv, user.id]
        );
        
        console.log(`Encrypted data for user ${user.id}`);
      }
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await db.end();
  }
}

migrateData();