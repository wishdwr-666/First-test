import React, { useState, useEffect, useRef } from 'react'

const CountdownBar: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const audioCtx = useRef<AudioContext | null>(null)
  const hasPlayed = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (!hasPlayed.current) {
            hasPlayed.current = true
            playAlert()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const playAlert = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const oscillator = audioCtx.current.createOscillator()
    const gainNode = audioCtx.current.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.current.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, audioCtx.current.currentTime) // A4 note
    gainNode.gain.setValueAtTime(0, audioCtx.current.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.current.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 1)
    
    oscillator.start()
    oscillator.stop(audioCtx.current.currentTime + 1)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (timeLeft / (15 * 60)) * 100

  return (
    <div className="topBar">
      <div className="timeBox">
        <span className="timeLabel">⏱</span>
        <span className="timeValue">{formatTime(timeLeft)}</span>
      </div>

      <div className="barTrack">
        <div className="barFill" style={{ width: `${progress}%` }} />
      </div>

      <div className="nextDose">
        <span>下次服药</span>
        <span className={timeLeft <= 10 ? 'bell bellHot' : 'bell'}>🔔</span>
      </div>
    </div>
  )
}

export default CountdownBar
