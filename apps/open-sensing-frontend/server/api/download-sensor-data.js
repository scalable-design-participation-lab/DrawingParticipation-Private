import { defineEventHandler } from 'h3'
import pg from 'pg'
import { parse } from 'json2csv' // Import json2csv for CSV conversion
const { Pool } = pg

/**
 * API endpoint for downloading sensor data
 *
 * This endpoint allows clients to request specific sensor data within a given date range.
 * It connects to a PostgreSQL database, executes a query based on the provided parameters,
 * and returns the requested sensor data.
 *
 * @async
 * @function
 * @param {Object} event - The H3 event object
 * @returns {Promise<Array>} An array of sensor data objects
 * @throws {Error} 400 if the request body is invalid
 * @throws {Error} 500 if there's an internal server error
 *
 * @example
 * // Request body
 * {
 *   datasets: { temperature: true, humidity: true },
 *   dateRange: { start: '2023-01-01', end: '2023-01-31' },
 *   format: 'csv' // Optional, for CSV format response
 * }
 *
 * // Response
 * [
 *   { timestamp: '2023-01-01T00:00:00Z', temperature: 22.5, humidity: 45 },
 *   // ... more data points
 * ]
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body || !body.datasets || !body.dateRange || !body.format) {
    console.error('Invalid request body:', body)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        message:
          'Invalid request body. Missing datasets, dateRange, or format.',
      },
    })
  }

  const pool = new Pool({
    user: config.dbUser,
    host: config.dbHost,
    database: config.dbName,
    password: config.dbPassword,
    port: config.dbPort,
  })

  try {
    const client = await pool.connect()

    // Build the query
    let query = 'SELECT s.timestamp'
    const selectedDatasets = Object.entries(body.datasets)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => key)

    // Map frontend field names to database field names
    const fieldMapping = {
      temperature: 'temperature',
      relative_humidity: 'relative_humidity',
      voc: 'voc',
      nox: 'nox',
      pm1: 'pm1',
      pm25: 'pm25',
      pm4: 'pm4',
      pm10: 'pm10',
    }

    // Add selected fields to query
    selectedDatasets.forEach((dataset) => {
      const dbField = fieldMapping[dataset]
      if (dbField) {
        query += `, s.${dbField}`
      }
    })

    // Add location join and filter if locations are selected
    query += ' FROM sen55 s JOIN modules m ON s.moduleid = m.moduleid'
    query += ' WHERE s.timestamp BETWEEN $1 AND $2'

    const queryParams = [body.dateRange.start, body.dateRange.end]

    // Add location filter if locations are selected
    const selectedLocations = Object.entries(body.location)
      .filter(([_, isSelected]) => isSelected)
      .map(([location]) => location)

    if (selectedLocations.length > 0) {
      query += ` AND m.ecohub_location = ANY($3)`
      queryParams.push(selectedLocations)
    }

    query += ' ORDER BY s.timestamp DESC'

    const result = await client.query(query, queryParams)
    client.release()

    if (body.format === 'csv') {
      const csv = parse(result.rows)
      return csv
    } else {
      return result.rows
    }
  } catch (err) {
    console.error('Error executing query for download', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        message: 'Failed to retrieve data',
        details: err.message,
      },
    })
  }
})
