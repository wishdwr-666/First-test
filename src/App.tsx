import React, { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import OrbitControls from './components/OrbitControls'

import Pillbox from './components/Pillbox'
import Questionnaire from './components/Questionnaire'
import DrawerUI from './components/DrawerUI'
import CountdownBar from './components/CountdownBar'
import { useCamera } from './hooks/useCamera'
import type { DiagnosisResult } from './logic/diagnosis'

const App: React.FC = () => {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [isPhotoCaptured, setIsPhotoCaptured] = useState(false)

  const { stream, error, videoRef, requestPermission, stopCamera, capturePhoto } = useCamera()

  const handleLeftClick = () => {
    setShowQuestionnaire(true)
  }

  const handleRightLongPress = () => {
    setIsDrawerOpen(!isDrawerOpen)
    if (!isDrawerOpen) {
      setShowCamera(true)
      requestPermission()
    } else {
      setShowCamera(false)
      stopCamera()
    }
  }

  const handleQuestionnaireComplete = (payload: { diagnosis: DiagnosisResult; recommendation: any }) => {
    setDiagnosis(payload.diagnosis)
    setRecommendation(payload.recommendation)
    setShowQuestionnaire(false)
    // Auto open drawer after recommendation
    setIsDrawerOpen(true)
    setShowCamera(true)
    requestPermission()
  }

  // Auto capture after 30 seconds
  useEffect(() => {
    if (showCamera && stream && !isPhotoCaptured) {
      const timer = setTimeout(() => {
        capturePhoto()
        setIsPhotoCaptured(true)
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [showCamera, stream, isPhotoCaptured, capturePhoto])

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a]">
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        <OrbitControls />
        
        <Suspense fallback={null}>
          <Pillbox 
            onLeftClick={handleLeftClick}
            onRightLongPress={handleRightLongPress}
            isDrawerOpen={isDrawerOpen}
            diagnosis={diagnosis}
            recommendation={recommendation}
          />
        </Suspense>
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />

        <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
      </Canvas>

      {/* UI Layers */}
      <CountdownBar />
      
      {showQuestionnaire && (
        <Questionnaire onClose={() => setShowQuestionnaire(false)} onComplete={handleQuestionnaireComplete} />
      )}

      <DrawerUI 
        isOpen={isDrawerOpen}
        diagnosis={diagnosis}
        recommendation={recommendation}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Camera Preview Overlay */}
      <div className={showCamera ? 'cameraOverlay show' : 'cameraOverlay'}>
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="cameraVideo" />
        ) : (
          <div className="cameraPlaceholder">
            <div className={error ? 'cameraBadge err' : 'cameraBadge'}>{error ? '!' : '…'}</div>
            <div className="muted">{error ?? '正在请求权限...'}</div>
          </div>
        )}

        <div className="cameraLive">
          <span className="liveDot" />
          LIVE
        </div>

        {isPhotoCaptured && <div className="cameraCaptured">✓</div>}
      </div>

      {/* Hint UI */}
      {!showQuestionnaire && !isDrawerOpen && (
        <div className="hint">
          左键：启动问卷 | 右键长按/长按：展开药盒
        </div>
      )}
    </div>
  )
}

export default App
