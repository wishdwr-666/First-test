import conditionsData from '../data/conditions.json'

export type Condition = {
  conditionId: string
  conditionName: string
  symptomIds: string[]
  tags: string[]
  advice: string[]
  redFlags: string[]
  confidenceBase: number
}

export type DiagnosisResult = {
  conditionId: string
  conditionName: string
  confidence: number
  tags: string[]
  advice: string[]
  redFlags: string[]
  severity: number
  triage: 'self_care' | 'watch' | 'see_doctor'
}

const CONDITIONS: Condition[] = conditionsData as unknown as Condition[]

export function analyzeCondition(input: {
  symptomId: string
  symptomName: string
  subSymptom: string
  severity: number
}): DiagnosisResult {
  const candidates = CONDITIONS.filter((c) => c.symptomIds.includes(input.symptomId))
  const picked = candidates[0] ?? {
    conditionId: 'C000',
    conditionName: '未分类症状（仅供参考）',
    symptomIds: [input.symptomId],
    tags: [input.symptomName],
    advice: ['如症状持续或加重，请及时就医'],
    redFlags: ['症状持续加重', '出现呼吸困难/胸痛/意识异常'],
    confidenceBase: 0.45,
  }

  let confidence = picked.confidenceBase

  if (/高烧不退/.test(input.subSymptom)) confidence += 0.1
  if (/清水样|过敏/.test(input.subSymptom)) confidence += picked.tags.includes('过敏') ? 0.12 : 0
  if (/水样便|腹泻|反酸|烧心/.test(input.subSymptom)) confidence += picked.tags.includes('肠胃') || picked.tags.includes('反酸') ? 0.1 : 0

  const sev = Math.max(1, Math.min(10, Math.round(input.severity)))
  confidence += (sev - 5) * 0.01
  confidence = Math.max(0.35, Math.min(0.92, confidence))

  const triage: DiagnosisResult['triage'] = sev >= 8 ? 'see_doctor' : sev >= 6 ? 'watch' : 'self_care'

  return {
    conditionId: picked.conditionId,
    conditionName: picked.conditionName,
    confidence,
    tags: picked.tags,
    advice: picked.advice,
    redFlags: picked.redFlags,
    severity: sev,
    triage,
  }
}

