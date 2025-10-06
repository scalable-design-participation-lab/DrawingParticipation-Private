// const functions = require('@google-cloud/functions-framework')
// const pg = require('pg')

// functions.http('helloHttp', async (req, res) => {
//   if (req.body) console.log('body is: ', req.body, req.body.temperature)
//   // console.log('I am a log entry!');
//   // console.error('I am an error!');
//   // res.send(`Hello ${req.body.name}, bodyyyyyy=${JSON.stringify(req.body)}!`);
//   if (req.body) {
//     const credentials = {
//       host: process.env.host,
//       database: process.env.database,
//       port: '5432',
//       user: 'postgres',
//       password: process.env.password,
//     }

//     const pool = new pg.Pool(credentials) //new Pool(credentials);

//     // Insert a test row into the Sensor table
//     const insertSen55 =
//       'INSERT INTO SEN55(ModuleID, Temperature, Relative_Humidity, VOC, NOx, PM1, PM25, PM4, PM10, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
//     const insertSoil =
//       'INSERT INTO Soil(ModuleID, Soil_Moisture, timestamp) VALUES ($1, $2, $3)'
//     const insertCurrent_Sensor =
//       'INSERT INTO Current_Sensor(ModuleID, Solar_Input_Current, timestamp) VALUES ($1, $2, $3)'
//     const insertMicrocontroller =
//       'INSERT INTO Microcontroller(ModuleID, Battery_Level, timestamp) VALUES ($1, $2, $3)'
//     const insertGPS =
//       'INSERT INTO GPS(ModuleID, Lat, Lon, timestamp) VALUES ($1, $2, $3, $4)'
//     const insertBlues =
//       'INSERT INTO Blues_Notecard(ModuleID, temperature, voltage, timestamp) VALUES ($1, $2, $3, $4)'
//     const insertBME =
//       'INSERT INTO bme_280(ModuleID, bme_temp, timestamp) VALUES ($1, $2, $3)'

//     // const ModuleID = req.body.ModuleID !== undefined ? req.body.ModuleID : 860322068064283;
//     // const Temperature = req.body.Temperature !== undefined ? req.body.Temperature : 0;
//     // const Relative_Humidity = req.body.Relative_Humidity !== undefined ? req.body.Relative_Humidity : 0;
//     // const VOC = req.body.VOC !== undefined ? req.body.VOC : 0;
//     // const NOx = req.body.NOx !== undefined ? req.body.NOx : 0;
//     // const PM1 = req.body.PM1 !== undefined ? req.body.PM1 : 0;
//     // const PM25 = req.body.PM25 !== undefined ? req.body.PM25 : 0;
//     // const PM4 = req.body.PM4 !== undefined ? req.body.PM4 : 0;
//     // const PM10 = req.body.PM10 !== undefined ? req.body.PM10 : 0;
//     // const Soil_Moisture = req.body.Soil_Moisture !== undefined ? req.body.Soil_Moisture : 0;
//     // const Solar_Input_Current = req.body.Solar_Input_Current !== undefined ? req.body.Solar_Input_Current : 0;
//     // const Battery_Level = req.body.Battery_Level !== undefined ? req.body.Battery_Level : 0;
//     // const Lat = req.body.Lat !== undefined ? req.body.Lat : 0;
//     // const Lon = req.body.Lon !== undefined ? req.body.Lon : 0;
//     // const Local_Temp = req.body.Local_Temp !== undefined ? req.body.Local_Temp : 0
//     // const Voltage = req.body.Voltage !== undefined ? req.body.Voltage : 0
//     // const timestamp = req.body.timestamp !== undefined ? new Date(req.body.timestamp * 1000) : new Date();
//     // const bme_temp = req.body['BME-Temp'] !== undefined ? req.body['BME-Temp'] : 0
//     const str = req.body.ID
//     const parts = str.split(':')
//     const integerPart = parts[1]

//     const ModuleID = integerPart !== undefined ? integerPart : null
//     const Temperature =
//       req.body.Temperature !== undefined ? req.body.Temperature : null
//     const Relative_Humidity =
//       req.body.Relative_Humidity !== undefined
//         ? req.body.Relative_Humidity
//         : null
//     const VOC = req.body.VOC !== undefined ? req.body.VOC : null
//     const NOx = req.body.NOx !== undefined ? req.body.NOx : null
//     const PM1 = req.body.PM1 !== undefined ? req.body.PM1 : null
//     const PM25 = req.body.PM25 !== undefined ? req.body.PM25 : null
//     const PM4 = req.body.PM4 !== undefined ? req.body.PM4 : null
//     const PM10 = req.body.PM10 !== undefined ? req.body.PM10 : null
//     const Soil_Moisture =
//       req.body.Soil_Moisture !== undefined ? req.body.Soil_Moisture : null
//     const Solar_Input_Current =
//       req.body.Solar_Input_Current !== undefined
//         ? req.body.Solar_Input_Current
//         : null
//     const Battery_Level =
//       req.body.Battery_Level !== undefined ? req.body.Battery_Level : null
//     const Lat = req.body.Lat !== undefined ? req.body.Lat : null
//     const Lon = req.body.Lon !== undefined ? req.body.Lon : null
//     const Local_Temp =
//       req.body.Local_Temp !== undefined ? req.body.Local_Temp : null
//     const Voltage = req.body.Voltage !== undefined ? req.body.Voltage : null
//     const timestamp =
//       req.body.timestamp !== undefined
//         ? new Date(req.body.timestamp * 1000)
//         : new Date()
//     const bme_temp =
//       req.body['BME-Temp'] !== undefined ? req.body['BME-Temp'] : null

//     checkAndInsertModuleId(pool, ModuleID)

//     // const insert = await pool.query(insertText, ['f9e87ab8-2a57-11ee-be56-0242ac120002', 'Soil', 'Howard', 1, 40.6722, 73.9078, now])
//     const runInsertSen55 = pool
//       .query(insertSen55, [
//         ModuleID,
//         Temperature,
//         Relative_Humidity,
//         VOC,
//         NOx,
//         PM1,
//         PM25,
//         PM4,
//         PM10,
//         timestamp,
//       ])
//       .then((res) => {
//         console.log(res)
//       })
//       .catch((err) => {
//         console.log(err)
//       })
//     const runInsertSoil = pool.query(insertSoil, [
//       ModuleID,
//       Soil_Moisture,
//       timestamp,
//     ])
//     const runInsertCurrent_Sensor = pool.query(insertCurrent_Sensor, [
//       ModuleID,
//       Solar_Input_Current,
//       timestamp,
//     ])
//     const runInsertMicrocontroller = pool.query(insertMicrocontroller, [
//       ModuleID,
//       Battery_Level,
//       timestamp,
//     ])
//     const runInsertGPS = pool.query(insertGPS, [ModuleID, Lat, Lon, timestamp])
//     const runInsertBlues = pool.query(insertBlues, [
//       ModuleID,
//       Local_Temp,
//       Voltage,
//       timestamp,
//     ])
//     const runInsertBME = pool.query(insertBME, [ModuleID, bme_temp, timestamp])
//   }
// })

// // Function to check if ModuleId exists and insert if it doesn't
// const checkAndInsertModuleId = async (client, moduleId) => {
//   // SQL query that checks if the ModuleId exists, and inserts it if it doesn't
//   const queryText = `
//         INSERT INTO Modules (ModuleId)
//         SELECT $1
//         WHERE NOT EXISTS (
//             SELECT 1 FROM Modules WHERE ModuleId = $1
//         );
//     `

//   // Execute the query
//   const res = await client.query(queryText, [moduleId])
//   if (res.rowCount > 0) {
//     console.log(`ModuleId ${moduleId} inserted.`)
//   } else {
//     console.log(`ModuleId ${moduleId} already exists.`)
//   }
// }

// // const pg = require('pg');

// // // Database connection configuration
// // const config = {
// //     user: 'yourUsername',
// //     host: 'yourHost',
// //     database: 'yourDatabase',
// //     password: 'yourPassword',
// //     port: 5432,
// // };

// // const pool = new pg.Pool(config);

// // // Function to check if ModuleId exists and insert if it doesn't
// // const checkAndInsertModuleId = async (moduleId) => {
// //     const client = await pool.connect();
// //     try {
// //         // SQL query that checks if the ModuleId exists, and inserts it if it doesn't
// //         const queryText = `
// //             INSERT INTO Modules (ModuleId)
// //             SELECT $1
// //             WHERE NOT EXISTS (
// //                 SELECT 1 FROM Modules WHERE ModuleId = $1
// //             );
// //         `;

// //         // Execute the query
// //         const res = await client.query(queryText, [moduleId]);
// //         if (res.rowCount > 0) {
// //             console.log(`ModuleId ${moduleId} inserted.`);
// //         } else {
// //             console.log(`ModuleId ${moduleId} already exists.`);
// //         }
// //     } catch (err) {
// //         console.error('Error executing query', err.stack);
// //     } finally {
// //         client.release();
// //     }
// // };

// // // Example usage
// // const moduleId = 'yourModuleId';
// // checkAndInsertModuleId(moduleId).catch(console.error);
