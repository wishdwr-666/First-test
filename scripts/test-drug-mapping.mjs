import fs from 'node:fs/promises'
import path from 'node:path'

const drugsPath = path.join(process.cwd(), 'src', 'data', 'drugs.json')

function assert(condition, message) {
  if (!condition) {
    const err = new Error(message)
    err.name = 'AssertionError'
    throw err
  }
}

const raw = await fs.readFile(drugsPath, 'utf-8')
const data = JSON.parse(raw)

assert(Array.isArray(data), 'drugs.json 必须是数组')
assert(data.length >= 30, 'drugs.json 必须至少包含 30 条药品映射')

const requiredFields = [
  'symptomId',
  'symptomName',
  'drugId',
  'drugName',
  'dosage',
  'unit',
  'frequency',
  'contraindications',
]

const symptomIds = new Set()
const drugIds = new Set()

for (const [idx, item] of data.entries()) {
  assert(item && typeof item === 'object', `第 ${idx + 1} 条必须为对象`) 
  for (const field of requiredFields) {
    assert(field in item, `第 ${idx + 1} 条缺少字段: ${field}`)
    assert(String(item[field]).length > 0, `第 ${idx + 1} 条字段 ${field} 不能为空`)
  }

  symptomIds.add(item.symptomId)
  drugIds.add(item.drugId)
}

assert(symptomIds.size >= 10, '必须至少覆盖 10 种 symptomId')
assert(drugIds.size >= 30, '必须至少覆盖 30 种 drugId')

process.stdout.write(
  `OK: symptoms=${symptomIds.size}, drugs=${drugIds.size}, rows=${data.length}\n`,
)

