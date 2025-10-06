export const SENSOR_METRICS = {
  Temperature: { name: 'temperature', label: 'Temperature (°C)' },
  'Relative Humidity': {
    name: 'relative_humidity',
    label: 'Relative Humidity (%)',
  },
  'VOC (ppb)': { name: 'voc', label: 'VOC (ppb)' },
  'NOx (ppb)': { name: 'nox', label: 'NOx (ppb)' },
  pm1: { name: 'pm1', label: 'PM1 (µg/m³)' },
  pm25: { name: 'pm25', label: 'PM2.5 (µg/m³)' },
  pm4: { name: 'pm4', label: 'PM4 (µg/m³)' },
  pm10: { name: 'pm10', label: 'PM10 (µg/m³)' },
  bme_humid: { name: 'bme_humid', label: 'BME Humidity (%)' },
  bme_temp: { name: 'bme_temp', label: 'BME Temperature (°C)' },
  bme_pressure: { name: 'bme_pressure', label: 'BME Pressure (hPa)' },
  scd_temp: { name: 'scd_temp', label: 'SCD Temperature (°C)' },
  scd_humid: { name: 'scd_humid', label: 'SCD Humidity (%)' },
  scd_co2: { name: 'scd_co2', label: 'SCD CO₂ (ppm)' },
} as const
