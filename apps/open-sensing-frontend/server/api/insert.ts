import { defineEventHandler, readBody } from 'h3'
import db from '../../utils/db'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    logger.info('Received sensor data request with body:', body)

    if (!body) {
      logger.error('Missing request body')
      throw createError({
        statusCode: 400,
        message: 'Request body is required',
      })
    }

    // Parse ModuleID from ID string
    const str = body.ID
    const parts = str.split(':')
    const integerPart = parts[1]

    logger.debug('Parsed ModuleID:', integerPart)

    // Extract and validate data from request body
    const data = {
      ModuleID: integerPart || null,
      Temperature: body.Temperature ?? null,
      Relative_Humidity: body.Relative_Humidity ?? null,
      VOC: body.VOC ?? null,
      NOx: body.NOx ?? null,
      PM1: body.PM1 ?? null,
      PM25: body.PM25 ?? null,
      PM4: body.PM4 ?? null,
      PM10: body.PM10 ?? null,
      Soil_Moisture: body.Soil_Moisture ?? null,
      Solar_Input_Current: body.Solar_Input_Current ?? null,
      Battery_Level: body.Battery_Level ?? null,
      Lat: body.Lat ?? null,
      Lon: body.Lon ?? null,
      Local_Temp: body.Local_Temp ?? null,
      Voltage: body.Voltage ?? null,
      timestamp: body.timestamp ? new Date(body.timestamp * 1000) : new Date(),
      bme_temp: body['BME-Temp'] ?? null,
      scd_temp: body.scd_temp ?? null,
      scd_humid: body.scd_humid ?? null,
      scd_co2: body.scd_co2 ?? null,
    }

    logger.debug('Processed data:', data)

    // Begin transaction
    const trx = await db.transaction()
    logger.info('Started database transaction')

    try {
      // Check and insert ModuleID
      await trx.raw(
        `
        INSERT INTO Modules (ModuleId)
        SELECT ?
        WHERE NOT EXISTS (
          SELECT 1 FROM Modules WHERE ModuleId = ?
        )
      `,
        [data.ModuleID, data.ModuleID]
      )
      logger.debug('Module ID checked/inserted')

      // Insert sensor data
      const insertPromises = [
        // SEN55 data
        trx.raw(
          `
          INSERT INTO SEN55(ModuleID, Temperature, Relative_Humidity, VOC, NOx, PM1, PM25, PM4, PM10, timestamp) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            data.ModuleID,
            data.Temperature,
            data.Relative_Humidity,
            data.VOC,
            data.NOx,
            data.PM1,
            data.PM25,
            data.PM4,
            data.PM10,
            data.timestamp,
          ]
        ),

        // Soil data
        trx.raw(
          `
          INSERT INTO Soil(ModuleID, Soil_Moisture, timestamp) 
          VALUES (?, ?, ?)
        `,
          [data.ModuleID, data.Soil_Moisture, data.timestamp]
        ),

        // Current_Sensor data
        trx.raw(
          `
          INSERT INTO Current_Sensor(ModuleID, Solar_Input_Current, timestamp) 
          VALUES (?, ?, ?)
        `,
          [data.ModuleID, data.Solar_Input_Current, data.timestamp]
        ),

        // Microcontroller data
        trx.raw(
          `
          INSERT INTO Microcontroller(ModuleID, Battery_Level, timestamp) 
          VALUES (?, ?, ?)
        `,
          [data.ModuleID, data.Battery_Level, data.timestamp]
        ),

        // GPS data
        trx.raw(
          `
          INSERT INTO GPS(ModuleID, Lat, Lon, timestamp) 
          VALUES (?, ?, ?, ?)
        `,
          [data.ModuleID, data.Lat, data.Lon, data.timestamp]
        ),

        // Blues_Notecard data
        trx.raw(
          `
          INSERT INTO Blues_Notecard(ModuleID, temperature, voltage, timestamp) 
          VALUES (?, ?, ?, ?)
        `,
          [data.ModuleID, data.Local_Temp, data.Voltage, data.timestamp]
        ),

        // BME_280 data
        trx.raw(
          `
          INSERT INTO bme_280(ModuleID, bme_temp, timestamp) 
          VALUES (?, ?, ?)
        `,
          [data.ModuleID, data.bme_temp, data.timestamp]
        ),
      ]

      await Promise.all(insertPromises)
      await trx.commit()
      logger.info('Successfully inserted all sensor data')

      return {
        statusCode: 200,
        body: {
          message: 'Data inserted successfully',
          moduleId: data.ModuleID,
        },
      }
    } catch (error) {
      await trx.rollback()
      logger.error('Database transaction failed:', error)
      throw error
    }
  } catch (error) {
    logger.error('Error processing sensor data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to insert sensor data',
      cause: error,
    })
  }
})
