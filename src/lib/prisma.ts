import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL || 'file:./dev.db';

  if (url.startsWith('file:') && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
    try {
      const dbPath = url.replace('file:', '');
      const dbFileName = path.basename(dbPath);
      const sourceDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(/*turbopackIgnore: true*/ process.cwd(), dbPath);
      const targetDbPath = path.join(os.tmpdir(), dbFileName);

      if (!fs.existsSync(targetDbPath)) {
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, targetDbPath);
          console.log(`Successfully copied SQLite database to ${targetDbPath}`);
        } else {
          // If source doesn't exist, create an empty file
          fs.writeFileSync(targetDbPath, '');
          console.log(`Created empty SQLite database at ${targetDbPath}`);
        }
      }
      url = `file:${targetDbPath}`;
    } catch (error) {
      console.error('Error copying SQLite database to temporary directory:', error);
    }
  }

  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
