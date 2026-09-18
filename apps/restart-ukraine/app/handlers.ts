import { registerHandler } from '../../../base/app/utils/handlers'

/**
 * Side effects a spec may `call`. Kept out of pages so the pages can be JSON.
 */

function convertToCSV(_data: unknown) {
  // ponytail: real CSV conversion once the export data exists.
  return 'data,in,csv,format'
}

export function registerHandlers() {
  registerHandler('downloadData', (payload) => {
    const { format = 'json' } = (payload ?? {}) as { format?: string }
    const data = {}
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(data) : convertToCSV(data)],
      { type: format === 'json' ? 'application/json' : 'text/csv' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ukraine-data.${format}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, 'Download the collected data as JSON or CSV. Payload: { format }')
}
