import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.dev') });

const ds = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: Number(process.env['DB_PORT'] ?? 5433),
  username: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASSWORD'] ?? 'postgres',
  database: process.env['DB_NAME'] ?? 'smartenergy',
  entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await ds.initialize();
  const hash = await bcrypt.hash('admin123', 12);
  await ds.query(
    `INSERT INTO users (email, password, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ['admin@smartenergy.dev', hash],
  );
  console.log('Seed done — admin@smartenergy.dev / admin123');
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
