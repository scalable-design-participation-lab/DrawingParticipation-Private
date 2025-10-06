import { defineEventHandler } from 'h3'
import db from '../../utils/db'
import { logger } from '../../utils/logger'

export default defineEventHandler(async () => {
  logger.info('Starting database connection test')

  try {
    // Test the database connection
    logger.debug('Attempting to connect to database...')
    await db.raw('SELECT 1')
    logger.info('Basic connection test successful')

    // Get current timestamp from database
    const result = await db.raw('SELECT NOW() as current_time')
    logger.info('Database query successful', result.rows[0])

    return {
      status: 'success',
      message: 'Database connection is working',
      timestamp: result.rows[0].current_time,
      database: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
      },
    }
  } catch (error) {
    logger.error('Database connection test failed:', error)

    // Build detailed error information
    const errorDetails = {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }

    throw createError({
      statusCode: 500,
      message: 'Database connection failed',
      cause: errorDetails,
    })
  }
})
