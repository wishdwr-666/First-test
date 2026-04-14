import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const NODE_MODULES = path.join(ROOT, 'node_modules')

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

function isDeleteName(name) {
  return name.includes('.DELETE.')
}

function restoreName(name) {
  const idx = name.indexOf('.DELETE.')
  return idx === -1 ? name : name.slice(0, idx)
}

async function walk(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name)

      if (isDeleteName(entry.name)) {
        const restored = restoreName(entry.name)
        const target = path.join(dir, restored)

        if (!(await exists(target))) {
          try {
            await fs.rename(full, target)
            return
          } catch {
            return
          }
        }

        try {
          if (entry.isDirectory()) await fs.rm(full, { recursive: true, force: true })
          else await fs.rm(full, { force: true })
        } catch {
          return
        }
        return
      }

      if (entry.isDirectory()) {
        if (entry.name === '.bin') return
        await walk(full)
      }
    }),
  )
}

if (await exists(NODE_MODULES)) {
  await walk(NODE_MODULES)
}

