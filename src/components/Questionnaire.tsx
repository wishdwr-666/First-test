import React, { useState } from 'react'
import drugsData from '../data/drugs.json'
import { analyzeCondition, type DiagnosisResult } from '../logic/diagnosis'

interface QuestionnaireProps {
  onClose: () => void
  onComplete: (payload: { diagnosis: DiagnosisResult; recommendation: any }) => void
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1)
  const [selectedSymptom, setSelectedSymptom] = useState<{ symptomId: string; symptomName: string } | null>(null)
  const [selectedSubSymptom, setSelectedSubSymptom] = useState<string | null>(null)
  const [severity, setSeverity] = useState(5)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)

  const mainSymptoms = Array.from(
    new Map(drugsData.map((d: any) => [d.symptomId, { symptomId: d.symptomId, symptomName: d.symptomName }])).values(),
  )
  
  // Get sub symptoms for the selected main symptom
  const subSymptoms = drugsData
    .filter((d: any) => d.symptomId === selectedSymptom?.symptomId)
    .flatMap((d: any) => d.subSymptoms)
    .filter((v, i, a) => a.indexOf(v) === i)

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
      return
    }

    if (step === 3) {
      if (!selectedSymptom || !selectedSubSymptom) return

      const result = analyzeCondition({
        symptomId: selectedSymptom.symptomId,
        symptomName: selectedSymptom.symptomName,
        subSymptom: selectedSubSymptom,
        severity,
      })
      setDiagnosis(result)
      setStep(4)
    }
  }

  const handleComplete = () => {
    if (!selectedSymptom || !selectedSubSymptom || !diagnosis) return

    const recommendation = drugsData.find(
      (d: any) => d.symptomId === selectedSymptom.symptomId && d.subSymptoms.includes(selectedSubSymptom),
    )

    onComplete({ diagnosis, recommendation })
  }

  return (
    <div className="overlay">
      <div className="modal">
        <button onClick={onClose} className="iconBtn" aria-label="关闭">
          ×
        </button>

        <div className="mb-6">
          <div className="text-sm text-blue-400 font-medium mb-1">症状问卷 ({Math.min(step, 3)}/3)</div>
          <h2 className="text-xl font-bold">
            {step === 1 && "您的主要症状是什么？"}
            {step === 2 && "具体有哪些表现？"}
            {step === 3 && "严重程度如何？"}
            {step === 4 && "分析结果"}
          </h2>
        </div>

        {step === 1 && (
          <div className="grid2">
            {mainSymptoms.map((s: any) => (
              <button
                key={s.symptomId}
                onClick={() => {
                  setSelectedSymptom(s)
                  handleNext()
                }}
                className="cardBtn"
              >
                <span>{s.symptomName}</span>
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            {subSymptoms.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSelectedSubSymptom(s)
                  handleNext()
                }}
                className="listBtn"
              >
                {s}
              </button>
            ))}
            <button onClick={() => setStep(1)} className="ghostBtn">
              返回上一步
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="stack">
            <div className="stack">
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="range"
              />
              <div className="between">
                <span className="muted">轻微</span>
                <span className="sev">{severity}</span>
                <span className="muted">极度不适</span>
              </div>
            </div>

            <div className="row">
              <button onClick={() => setStep(2)} className="secondaryBtn">
                上一步
              </button>
              <button onClick={handleNext} className="primaryBtn">
                生成分析
              </button>
            </div>
          </div>
        )}

        {step === 4 && diagnosis && selectedSymptom && selectedSubSymptom && (
          <div className="stack">
            <div className="analysisCard">
              <div className="analysisTitle">{diagnosis.conditionName}</div>
              <div className="analysisMeta">
                <span>置信度 {(diagnosis.confidence * 100).toFixed(0)}%</span>
                <span>·</span>
                <span>
                  {diagnosis.triage === 'self_care' && '可先自我护理'}
                  {diagnosis.triage === 'watch' && '建议观察/必要时就医'}
                  {diagnosis.triage === 'see_doctor' && '建议尽快就医'}
                </span>
              </div>

              <div className="chips">
                {diagnosis.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
                <span className="chip chipDim">{selectedSymptom.symptomName}</span>
                <span className="chip chipDim">{selectedSubSymptom}</span>
              </div>

              <div className="analysisSection">
                <div className="sectionTitle">建议</div>
                <ul className="list">
                  {diagnosis.advice.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="analysisSection">
                <div className="sectionTitle warn">警示信号</div>
                <ul className="list">
                  {diagnosis.redFlags.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="row">
              <button
                onClick={() => {
                  setDiagnosis(null)
                  setStep(3)
                }}
                className="secondaryBtn"
              >
                返回调整
              </button>
              <button onClick={handleComplete} className="primaryBtn">
                查看推荐药品
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Questionnaire
