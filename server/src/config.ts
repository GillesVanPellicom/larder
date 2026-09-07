import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001)),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://coquinaria:coquinaria_secret@localhost:5432/coquinaria',
  clientDistPath: path.resolve(process.cwd(), 'dist'),
}
