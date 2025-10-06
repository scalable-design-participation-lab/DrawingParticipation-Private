import { defineEventHandler, getQuery } from 'h3'
import db from '../../utils/db'
import { subMonths } from 'date-fns'

/**
 * API endpoint for retrieving sensor data by moduleId
 *
 * @async
 * @function
 * @param {Object} event - The H3 event object
 * @returns {Promise<Object>} Sensor data and location information
 */
export default defineEventHandler(async (event) => {
  try {
    const { moduleId, start, end } = getQuery(event)
    const startDate = start ? new Date(start) : subMonths(new Date(), 1)
    const endDate = end ? new Date(end) : new Date()

    // === ALL SENSORS LATEST SNAPSHOT ===
    if (!moduleId) {
      const allSensorsQuery = await db.raw(`
        SELECT 
          m.moduleid,
          m.ecohub_location,
          m.lat,
          m.lon,
          s.temperature,
          s.relative_humidity,
          s.voc,
          s.nox,
          s.pm1,
          s.pm25,
          s.pm4,
          s.pm10,
          s.timestamp,
          b.bme_temp,
          b.bme_humid,
          b.bme_pressure
        FROM modules m
        LEFT JOIN (
          SELECT DISTINCT ON (moduleid) *
          FROM sen55
          ORDER BY moduleid, timestamp DESC
        ) s ON m.moduleid = s.moduleid
        LEFT JOIN (
          SELECT DISTINCT ON (moduleid) *
          FROM bme_280
          ORDER BY moduleid, timestamp DESC
        ) b ON m.moduleid = b.moduleid
        ORDER BY m.moduleid;
      `)
      return allSensorsQuery.rows
    }

    // === MODULE METADATA ===
    const locationQuery = await db.raw(
      `SELECT moduleid, ecohub_location, lat, lon FROM modules WHERE moduleid = ?`,
      [moduleId]
    )
    const moduleInfo = locationQuery.rows[0]
    if (!moduleInfo) return { error: 'Module not found' }

    // === FETCH ENABLED SENSOR TABLES ===
    const sensorListQuery = await db.raw(
      `SELECT sensors FROM modulesensors WHERE moduleid = ?`,
      [moduleId]
    )
    const sensors = sensorListQuery.rows[0]?.sensors ?? []
    const sensorFields = {
      bme_280: ['bme_temp', 'bme_humid', 'bme_pressure'],
      scd_41: ['scd_temp', 'scd_humid', 'scd_co2'],
    }
    const filteredSensors = sensors.filter((s) => s in sensorFields)

    const selectFields = [
      's.timestamp',
      's.temperature',
      's.relative_humidity',
      's.voc',
      's.nox',
      's.pm1',
      's.pm25',
      's.pm4',
      's.pm10',
    ]
    const joinClauses = []

    // === BUILD UNIFIED LATERAL JOINS FOR ALL SENSORS ===
    for (const sensor of filteredSensors) {
      const fields = sensorFields[sensor]
      fields.forEach((f) => {
        selectFields.push(`${sensor}.${f} AS ${f}`)
      })

      joinClauses.push(`
        LEFT JOIN LATERAL (
          SELECT ${fields.join(', ')}
          FROM ${sensor}
          WHERE moduleid = s.moduleid
          ORDER BY ABS(EXTRACT(EPOCH FROM (s.timestamp - timestamp)))
          LIMIT 1
        ) ${sensor} ON true
      `)
    }

    const dynamicQuery = `
      SELECT ${selectFields.join(',\n')}
      FROM sen55 s
      ${joinClauses.join('\n')}
      WHERE s.moduleid = ?
        AND s.timestamp BETWEEN ? AND ?
      ORDER BY s.timestamp DESC
    `

    const result = await db.raw(dynamicQuery, [
      moduleId,
      startDate.toISOString(),
      endDate.toISOString(),
    ])

    return {
      moduleInfo,
      sensorData: result.rows,
    }
  } catch (err) {
    console.error('Error executing dynamic query', err)
    return { error: 'Internal server error', details: err.message }
  }
})
