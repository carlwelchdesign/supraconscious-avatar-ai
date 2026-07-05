import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(root, 'src', 'widget')
const outputDir = join(root, 'dist', 'widget')

await mkdir(outputDir, { recursive: true })

for (const fileName of ['index.html', 'styles.css']) {
  await copyFile(join(sourceDir, fileName), join(outputDir, fileName))
}
