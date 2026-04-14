import React from 'react'
import type { DiagnosisResult } from '../logic/diagnosis'

interface DrawerUIProps {
  isOpen: boolean
  diagnosis: DiagnosisResult | null
  recommendation: any
  onClose: () => void
}

const DrawerUI: React.FC<DrawerUIProps> = ({ isOpen, diagnosis, recommendation, onClose }) => {
  return (
    <div className={`drawerPanel ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="drawerHeader">
        <h3 className="drawerTitle">智能推荐方案</h3>
        <button onClick={onClose} className="iconBtn" aria-label="关闭">
          ×
        </button>
      </div>

      {!recommendation ? (
        <div className="drawerEmpty">
          <div className="emptyDot" />
          <p className="muted">请先左键点击药盒完成问卷，再右键长按展开抽屉</p>
        </div>
      ) : (
        <div className="drawerBody">
          {diagnosis && (
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
              </div>
            </div>
          )}

          <div className="section">
            <div className="sectionTitle">推荐药品</div>
            <div className="recommendCard">
              <div className="recommendName">{recommendation.drugName}</div>
              <div className="recommendMeta">
                {recommendation.dosage}
                {recommendation.unit} / {recommendation.frequency}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="sectionTitle">用药间隔</div>
            <div className="noteCard">{recommendation.frequency}</div>
          </div>

          <div className="section">
            <div className="sectionTitle warn">注意事项</div>
            <div className="warnCard">{recommendation.contraindications}</div>
          </div>

          {diagnosis && (
            <div className="section">
              <div className="sectionTitle">用药前提示</div>
              <div className="noteCard">{diagnosis.advice[0]}</div>
            </div>
          )}
        </div>
      )}

      <div className="drawerFooter">* 药盒助手仅提供参考，严重症状请及时就医</div>
    </div>
  )
}

export default DrawerUI
