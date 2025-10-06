import { defineEventHandler, getQuery, createError } from 'h3'
import db from '~/utils/db'
import {
  PM25_CONFIG,
  PM10_CONFIG,
  calcSubIndex,
  pickOverallAQI,
  categorizeAQI,
} from '~/utils/aqi'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const moduleId = (Array.isArray(q.moduleId) ? q.moduleId[0] : q.moduleId)
    ?.toString()
    .trim()
  if (!moduleId)
    throw createError({
      statusCode: 400,
      statusMessage: 'moduleId is required',
    })

  const sql = `
    WITH latest AS (
      SELECT MAX("timestamp") AS t_end
      FROM sen55
      WHERE moduleid = ?
    ),
    win AS (
      SELECT s.*
      FROM sen55 s
      CROSS JOIN latest l
      WHERE s.moduleid = ?
        AND s."timestamp" >  l.t_end - interval '24 hours'
        AND s."timestamp" <= l.t_end
    )
    SELECT
      AVG(pm25) AS pm25_24h,
      AVG(pm10) AS pm10_24h
    FROM win
  `
  const r = await db.raw(sql, [moduleId, moduleId])
  const row = r?.rows?.[0] ?? {}
  const pm25Avg = row.pm25_24h ?? null
  const pm10Avg = row.pm10_24h ?? null

  const subs = [
    pm25Avg != null
      ? { pollutant: 'pm25', ...calcSubIndex(Number(pm25Avg), PM25_CONFIG) }
      : null,
    pm10Avg != null
      ? { pollutant: 'pm10', ...calcSubIndex(Number(pm10Avg), PM10_CONFIG) }
      : null,
  ].filter(Boolean) as Array<{ pollutant: string; aqi: number | null }>

  const worst = pickOverallAQI(
    subs.map((s) => ({ pollutant: s.pollutant, aqi: s.aqi }))
  )

  if (!worst || worst.aqi == null || Number(worst.aqi) === 0) {
    return {
      moduleId,
      aqi: null,
      category: null,
      color: null,
      pollutant: null,
      generatedAt: new Date().toISOString(),
    }
  }

  const { category, color } = categorizeAQI(worst.aqi)
  return {
    moduleId,
    aqi: worst.aqi,
    category,
    color,
    pollutant: worst.pollutant,
    generatedAt: new Date().toISOString(),
  }
})
