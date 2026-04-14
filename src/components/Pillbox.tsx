import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DiagnosisResult } from '../logic/diagnosis'

type Props = {
  onLeftClick: () => void
  onRightLongPress: () => void
  isDrawerOpen: boolean
  diagnosis: DiagnosisResult | null
  recommendation: any
}

function makeTextTexture(params: {
  lines: string[]
  width: number
  height: number
  background: string
  foreground: string
  fontSize: number
  padding: number
  align?: 'left' | 'center'
}) {
  const canvas = document.createElement('canvas')
  canvas.width = params.width
  canvas.height = params.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = params.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = params.foreground
  ctx.font = `600 ${params.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
  ctx.textBaseline = 'top'
  ctx.textAlign = params.align === 'center' ? 'center' : 'left'

  const x = params.align === 'center' ? canvas.width / 2 : params.padding
  let y = params.padding
  for (const line of params.lines) {
    ctx.fillText(line, x, y)
    y += Math.round(params.fontSize * 1.35)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function hashToIndex(input: string, mod: number) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % mod
}

export default function Pillbox({
  onLeftClick,
  onRightLongPress,
  isDrawerOpen,
  diagnosis,
  recommendation,
}: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const trayRef = useRef<THREE.Group>(null)
  const lidRef = useRef<THREE.Group>(null)
  const screenRef = useRef<THREE.Group>(null)
  const longPressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'default'
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [hovered])

  const etchedTexture = useMemo(() => {
    return makeTextTexture({
      lines: ['家庭健康守护'],
      width: 1024,
      height: 256,
      background: 'rgba(0,0,0,0)',
      foreground: 'rgba(120,120,120,0.85)',
      fontSize: 92,
      padding: 40,
      align: 'center',
    })
  }, [])

  const screenTexture = useMemo(() => {
    const drugName = recommendation?.drugName ? String(recommendation.drugName) : '（待生成推荐）'
    return makeTextTexture({
      lines: ['根据症状分析，建议服用如下', `药物：${drugName}`],
      width: 1024,
      height: 512,
      background: 'rgba(255,255,255,0.06)',
      foreground: 'rgba(10,10,10,0.92)',
      fontSize: 44,
      padding: 64,
      align: 'left',
    })
  }, [recommendation?.drugName])

  const holoTexture = useMemo(() => {
    const name = recommendation?.drugName ? String(recommendation.drugName) : '布洛芬'
    const primary = name.includes('布洛芬') ? '布洛芬' : name.slice(0, 4)
    return makeTextTexture({
      lines: [primary],
      width: 512,
      height: 256,
      background: 'rgba(0,0,0,0)',
      foreground: 'rgba(120,200,255,0.95)',
      fontSize: 84,
      padding: 40,
      align: 'center',
    })
  }, [recommendation?.drugName])

  const highlightIndex = useMemo(() => {
    if (!recommendation?.drugId) return -1
    return hashToIndex(String(recommendation.drugId), 12)
  }, [recommendation?.drugId])

  useFrame((_, delta) => {
    if (rootRef.current && !isDrawerOpen) {
      rootRef.current.rotation.y += delta * 0.35
    }

    if (trayRef.current) {
      const targetX = isDrawerOpen ? 0.38 : 0.0
      trayRef.current.position.x = THREE.MathUtils.lerp(trayRef.current.position.x, targetX, delta * 6)
    }

    if (lidRef.current) {
      const openAngle = THREE.MathUtils.degToRad(isDrawerOpen ? 78 : 72)
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, -openAngle, delta * 6)
    }

    if (screenRef.current) {
      const t = Date.now() * 0.002
      screenRef.current.position.y = 0.02 + Math.sin(t) * 0.01
    }
  })

  const startLongPress = () => {
    longPressTriggered.current = false
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true
      onRightLongPress()
    }, 550)
  }

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const onPointerDown = (e: any) => {
    if (e.pointerType && e.pointerType !== 'mouse') {
      startLongPress()
      return
    }

    if (e.button === 0) {
      onLeftClick()
      return
    }

    if (e.button === 2) startLongPress()
  }

  const onPointerUp = (e: any) => {
    const wasTriggered = longPressTriggered.current
    clearLongPress()

    if (e.pointerType && e.pointerType !== 'mouse') {
      if (!wasTriggered) onLeftClick()
    }
  }

  const matteWhite = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f6f7f8'),
        roughness: 0.78,
        metalness: 0.05,
      }),
    [],
  )

  const brushedMetal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c9cdd2'),
        roughness: 0.32,
        metalness: 0.85,
      }),
    [],
  )

  const led = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#5ab2ff'),
        emissive: new THREE.Color('#3aa0ff'),
        emissiveIntensity: 1.6,
        roughness: 0.3,
        metalness: 0.1,
      }),
    [],
  )

  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#cfe8ff'),
        roughness: 0.06,
        metalness: 0.0,
        transparent: true,
        opacity: 0.35,
      }),
    [],
  )

  const screenMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.2,
      metalness: 0.0,
      transparent: true,
      opacity: 0.75,
      map: screenTexture ?? undefined,
    })
  }, [screenTexture])

  const etchedMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.8,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
      map: etchedTexture ?? undefined,
    })
  }, [etchedTexture])

  const holoMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#7dd3fc'),
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: holoTexture ?? undefined,
    })
  }, [holoTexture])

  const slotMats = useMemo(() => {
    const normal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e9edf1'),
      roughness: 0.9,
      metalness: 0.05,
    })
    const active = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e9edf1'),
      roughness: 0.55,
      metalness: 0.1,
      emissive: new THREE.Color('#3aa0ff'),
      emissiveIntensity: 0.75,
    })
    return { normal, active }
  }, [])

  const screenSummary = useMemo(() => {
    if (!diagnosis) return null
    const text = `${diagnosis.conditionName}`
    return text
  }, [diagnosis])

  const screenBadgeTexture = useMemo(() => {
    if (!screenSummary) return null
    return makeTextTexture({
      lines: [screenSummary],
      width: 1024,
      height: 256,
      background: 'rgba(0,0,0,0)',
      foreground: 'rgba(10,10,10,0.78)',
      fontSize: 56,
      padding: 32,
      align: 'left',
    })
  }, [screenSummary])

  const screenBadgeMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
      map: screenBadgeTexture ?? undefined,
      depthWrite: false,
    })
  }, [screenBadgeTexture])

  return (
    <group
      ref={rootRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.nativeEvent.preventDefault()}
    >
      <group position={[0, -0.15, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.6, 1.0, 1.65]} />
          <primitive object={matteWhite} attach="material" />
        </mesh>

        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.62, 0.22, 1.67]} />
          <primitive object={brushedMetal} attach="material" />
        </mesh>

        <mesh position={[0, -0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.62, 0.06, 1.67]} />
          <primitive object={brushedMetal} attach="material" />
        </mesh>

        <mesh position={[0, -0.36, 0.835]} castShadow>
          <planeGeometry args={[1.65, 0.22]} />
          <primitive object={etchedMat} attach="material" />
        </mesh>

        <mesh position={[0, -0.475, 0.835]}>
          <boxGeometry args={[2.65, 0.02, 0.06]} />
          <primitive object={led} attach="material" />
        </mesh>
        <mesh position={[0, 0.475, 0.835]}>
          <boxGeometry args={[2.65, 0.02, 0.06]} />
          <primitive object={led} attach="material" />
        </mesh>
        <mesh position={[1.315, 0, 0.835]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.7, 0.02, 0.06]} />
          <primitive object={led} attach="material" />
        </mesh>
        <mesh position={[-1.315, 0, 0.835]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.7, 0.02, 0.06]} />
          <primitive object={led} attach="material" />
        </mesh>

        <group ref={lidRef} position={[0, 0.35, -0.83]} rotation={[-THREE.MathUtils.degToRad(72), 0, 0]}>
          <mesh position={[0, 0.06, 0.83]} castShadow receiveShadow>
            <boxGeometry args={[2.62, 0.16, 1.67]} />
            <primitive object={matteWhite} attach="material" />
          </mesh>
          <mesh position={[0, 0.02, 0.83]}>
            <boxGeometry args={[2.64, 0.02, 1.69]} />
            <primitive object={led} attach="material" />
          </mesh>
        </group>

        <group ref={trayRef} position={[0, 0.05, 0.0]}>
          <mesh position={[0, 0.12, -0.05]} castShadow receiveShadow>
            <boxGeometry args={[2.36, 0.26, 1.32]} />
            <meshStandardMaterial color="#dfe6ee" roughness={0.95} metalness={0.05} />
          </mesh>

          {Array.from({ length: 12 }).map((_, i) => {
            const cols = 4
            const rows = 3
            const c = i % cols
            const r = Math.floor(i / cols)
            const x = -0.82 + c * 0.55
            const z = -0.42 + r * 0.42
            const active = i === highlightIndex
            return (
              <mesh key={i} position={[x, 0.24, z]} castShadow receiveShadow>
                <boxGeometry args={[0.46, 0.16, 0.34]} />
                <primitive object={active ? slotMats.active : slotMats.normal} attach="material" />
              </mesh>
            )
          })}

          {highlightIndex >= 0 && (
            (() => {
              const i = highlightIndex
              const cols = 4
              const c = i % cols
              const r = Math.floor(i / cols)
              const x = -0.82 + c * 0.55
              const z = -0.42 + r * 0.42
              return (
                <group position={[x, 0.44, z]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.5, 0.25]} />
                    <primitive object={holoMat} attach="material" />
                  </mesh>
                  <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.56, 0.3]} />
                    <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
                  </mesh>
                </group>
              )
            })()
          )}
        </group>

        <group ref={screenRef} position={[1.36, -0.1, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0.0, 0]} castShadow>
            <boxGeometry args={[0.02, 0.92, 1.15]} />
            <primitive object={glass} attach="material" />
          </mesh>
          <mesh position={[0.012, 0.04, 0.0]}>
            <planeGeometry args={[1.05, 0.82]} />
            <primitive object={screenMat} attach="material" />
          </mesh>
          {screenSummary && (
            <mesh position={[0.013, -0.38, 0.33]}>
              <planeGeometry args={[1.0, 0.2]} />
              <primitive object={screenBadgeMat} attach="material" />
            </mesh>
          )}
          <mesh position={[0.013, -0.32, -0.33]}>
            <planeGeometry args={[0.34, 0.14]} />
            <meshBasicMaterial color="#5aa8ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[0.014, -0.32, -0.33]}>
            <planeGeometry args={[0.18, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

