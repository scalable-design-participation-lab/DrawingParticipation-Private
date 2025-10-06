export interface ProcessedDataPoint {
  date: string
  value: number
}

export const processDataPoint = (
  data: any,
  metricName: string
): ProcessedDataPoint | null => {
  if (!data || !data.timestamp || data[metricName] === undefined) {
    return null
  }

  const value = Number(data[metricName])
  if (isNaN(value) || !isFinite(value)) {
    return null
  }

  return {
    date: new Date(data.timestamp).toISOString(),
    value,
  }
}

export const validateAndSortData = (
  data: ProcessedDataPoint[]
): ProcessedDataPoint[] => {
  return data
    .filter((d) => d && d.date && !isNaN(new Date(d.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
