/**
 * Level 4 of the verifier: look at the rendered page. The static verifier
 * proves the JSON is well-formed and the render verifier proves nothing
 * threw; this one catches what only eyes catch — overlaps, cut-off text,
 * blank regions, "undefined", error boxes.
 *
 *   yarn workspace @mono/base visual-check --url http://localhost:3015/datos [--viewport 390x844] [--provider anthropic]
 *   yarn workspace @mono/base visual-check --image page.png [--provider stub --stub verdict.json]
 *
 * `--url` screenshots the page with the locally installed Chrome
 * (playwright-core, no browser download; `--browser <exe>` overrides).
 * Prints the same `{ pass, errors[{ path, rule, message }] }` shape as the
 * other levels; exit code 1 on failure.
 */
import type { Buffer } from 'node:buffer'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { z } from 'zod'
import { providerFromArgs } from './llm'

const args = process.argv.slice(2)
function flag(name: string) {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
function fromUser(p: string) {
  const local = resolve(process.cwd(), p)
  return existsSync(local) ? local : resolve(import.meta.dirname, '../..', p)
}

const url = flag('url')
const image = flag('image')
if (!url && !image) {
  console.error('usage: visual-check --url <http://…> | --image <file.png> [--viewport 390x844] [--browser <exe>] [--provider stub|anthropic] [--stub verdict.json]')
  process.exit(2)
}

async function screenshot(target: string): Promise<Buffer> {
  const { chromium } = await import('playwright-core')
  const [width, height] = (flag('viewport') ?? '1280x800').split('x').map(Number)
  const executablePath = flag('browser')
  const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' })
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(target, { waitUntil: 'networkidle' })
    const png = await page.screenshot({ fullPage: true })
    const out = flag('save')
    if (out) {
      writeFileSync(fromUser(out), png)
    }
    return png
  }
  finally {
    await browser.close()
  }
}

const png = image ? readFileSync(fromUser(image)) : await screenshot(url!)

const VerdictSchema = z.strictObject({
  pass: z.boolean(),
  errors: z.array(z.strictObject({
    path: z.string().describe('Where on the page, e.g. "header", "form > second field", "bottom-left"'),
    rule: z.enum(['visual.overlap', 'visual.cut-off', 'visual.blank', 'visual.placeholder', 'visual.contrast', 'visual.error-box', 'visual.other']),
    message: z.string(),
  })),
})

const ask = providerFromArgs(flag, fromUser)
const verdict = await ask(
  VerdictSchema,
  `You check a rendered web page for defects a non-technical user would notice. Report only what is visibly wrong in the screenshot: elements overlapping, text cut off or overflowing its box, large blank regions where content clearly belongs, literal "undefined" / "null" / "[object Object]" / "NaN", unreadable contrast, red error boxes. Do not judge taste or layout choices. pass = no defects.`,
  [
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png.toString('base64') } },
    { type: 'text', text: `Page: ${url ?? image}` },
  ],
  'visual',
)
console.log(JSON.stringify(verdict, null, 2))
process.exit(verdict.pass ? 0 : 1)
