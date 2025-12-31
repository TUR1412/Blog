import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const distDir = path.resolve(process.cwd(), 'dist')
const assetsDir = path.join(distDir, 'assets')

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`
}

function gzipSizeSync(filePath) {
  const buf = fs.readFileSync(filePath)
  const gz = zlib.gzipSync(buf, { level: 9 })
  return gz.byteLength
}

function listAssets() {
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`未找到构建产物目录：${assetsDir}（请先执行 npm run build）`)
  }
  return fs.readdirSync(assetsDir, { withFileTypes: true }).filter((d) => d.isFile())
}

const budgets = [
  { name: 'main-js', re: /^index-.*\.js$/i, maxGzipKB: 165 },
  { name: 'main-css', re: /^index-.*\.css$/i, maxGzipKB: 20 },
  { name: 'markdown-chunk', re: /^Markdown-.*\.js$/i, maxGzipKB: 70 },
]

const rows = []
let failed = false

const assets = listAssets()

for (const rule of budgets) {
  const files = assets.filter((d) => rule.re.test(d.name)).map((d) => d.name)
  if (files.length === 0) {
    failed = true
    rows.push({
      name: rule.name,
      file: '(missing)',
      gzip: 'N/A',
      max: `${rule.maxGzipKB} kB`,
      ok: false,
    })
    continue
  }

  for (const file of files) {
    const filePath = path.join(assetsDir, file)
    const gzBytes = gzipSizeSync(filePath)
    const gzKB = gzBytes / 1024
    const ok = gzKB <= rule.maxGzipKB
    if (!ok) failed = true
    rows.push({
      name: rule.name,
      file,
      gzip: formatKB(gzBytes),
      max: `${rule.maxGzipKB} kB`,
      ok,
    })
  }
}

const allSizes = assets
  .map((d) => {
    const filePath = path.join(assetsDir, d.name)
    const gzBytes = gzipSizeSync(filePath)
    return { file: d.name, gzBytes }
  })
  .sort((a, b) => b.gzBytes - a.gzBytes)

console.log('\nBundle budget (gzip):')
for (const r of rows) {
  console.log(
    `- ${r.ok ? '✅' : '❌'} ${r.name}: ${r.file} = ${r.gzip} (max ${r.max})`,
  )
}

console.log('\nTop assets (gzip):')
for (const it of allSizes.slice(0, 8)) {
  console.log(`- ${it.file} = ${formatKB(it.gzBytes)}`)
}
console.log('')

if (failed) {
  process.exitCode = 1
}
