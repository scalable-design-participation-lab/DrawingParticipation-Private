import knex, { Knex } from 'knex'
import { logger } from './logger'

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  },
  pool: { min: 2, max: 10 },
}

const db = knex(config)

// Verify connection
db.raw('SELECT 1')
  .then(() => {
    logger.info('Database connection established successfully')
  })
  .catch((error) => {
    logger.error('Failed to establish database connection:', error)
  })

export default db
