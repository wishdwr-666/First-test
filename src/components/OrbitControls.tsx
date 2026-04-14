import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Props = {
  enabled?: boolean
}

export default function OrbitControls({ enabled = true }: Props) {
  const { camera, gl } = useThree()

  const controls = useMemo(() => {
    const instance = new ThreeOrbitControls(camera, gl.domElement)
    instance.enableDamping = true
    instance.enablePan = false
    instance.minDistance = 3
    instance.maxDistance = 10
    instance.maxPolarAngle = Math.PI / 2.1
    return instance
  }, [camera, gl.domElement])

  useEffect(() => {
    controls.enabled = enabled
    return () => {
      controls.dispose()
    }
  }, [controls, enabled])

  useFrame(() => {
    if (enabled) controls.update()
  })

  return null
}

