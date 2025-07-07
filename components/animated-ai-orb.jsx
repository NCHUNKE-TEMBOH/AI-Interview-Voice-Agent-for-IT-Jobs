"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function AnimatedAIOrb({ isListening = false, isSpeaking = false, isConnected = false, size = 150 }) {
  const [pulseIntensity, setPulseIntensity] = useState(0)

  useEffect(() => {
    let interval
    if (isSpeaking) {
      // Simulate audio levels when speaking
      interval = setInterval(() => {
        setPulseIntensity(Math.random() * 0.8 + 0.2)
      }, 100)
    } else if (isListening) {
      // Gentle pulse when listening
      interval = setInterval(() => {
        setPulseIntensity(Math.random() * 0.4 + 0.1)
      }, 200)
    } else {
      setPulseIntensity(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSpeaking, isListening])

  const getOrbColor = () => {
    if (!isConnected) return "from-gray-400 to-gray-600"
    if (isSpeaking) return "from-purple-400 via-pink-500 to-red-500"
    if (isListening) return "from-blue-400 via-cyan-500 to-teal-500"
    return "from-green-400 via-blue-500 to-purple-600"
  }

  const getGlowColor = () => {
    if (!isConnected) return "shadow-gray-500/20"
    if (isSpeaking) return "shadow-purple-500/50"
    if (isListening) return "shadow-blue-500/50"
    return "shadow-green-500/30"
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow rings */}
      {isConnected && (
        <>
          <motion.div
            className={`absolute rounded-full bg-gradient-to-r ${getOrbColor()} opacity-20`}
            style={{ width: size * 1.4, height: size * 1.4 }}
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
              opacity: isSpeaking ? [0.2, 0.4, 0.2] : isListening ? [0.2, 0.3, 0.2] : 0.2,
            }}
            transition={{
              duration: isSpeaking ? 0.5 : isListening ? 1 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={`absolute rounded-full bg-gradient-to-r ${getOrbColor()} opacity-30`}
            style={{ width: size * 1.2, height: size * 1.2 }}
            animate={{
              scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1.08, 1] : 1,
              opacity: isSpeaking ? [0.3, 0.5, 0.3] : isListening ? [0.3, 0.4, 0.3] : 0.3,
            }}
            transition={{
              duration: isSpeaking ? 0.3 : isListening ? 0.8 : 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.div
        className={`relative rounded-full bg-gradient-to-r ${getOrbColor()} ${getGlowColor()} shadow-2xl`}
        style={{ width: size, height: size }}
        animate={{
          scale: isSpeaking 
            ? [1, 1 + pulseIntensity * 0.3, 1] 
            : isListening 
            ? [1, 1 + pulseIntensity * 0.2, 1] 
            : isConnected 
            ? [1, 1.05, 1] 
            : 1,
          boxShadow: isSpeaking
            ? [
                `0 0 ${size * 0.3}px rgba(147, 51, 234, 0.4)`,
                `0 0 ${size * 0.5}px rgba(147, 51, 234, 0.6)`,
                `0 0 ${size * 0.3}px rgba(147, 51, 234, 0.4)`,
              ]
            : isListening
            ? [
                `0 0 ${size * 0.2}px rgba(59, 130, 246, 0.4)`,
                `0 0 ${size * 0.4}px rgba(59, 130, 246, 0.6)`,
                `0 0 ${size * 0.2}px rgba(59, 130, 246, 0.4)`,
              ]
            : isConnected
            ? `0 0 ${size * 0.2}px rgba(34, 197, 94, 0.3)`
            : `0 0 ${size * 0.1}px rgba(107, 114, 128, 0.2)`,
        }}
        transition={{
          duration: isSpeaking ? 0.1 : isListening ? 0.2 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner gradient overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-black/20" />
        
        {/* Center highlight */}
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-sm" />
        
        {/* Animated particles inside orb */}
        {isConnected && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/60 rounded-full"
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${30 + (i * 8)}%`,
                }}
                animate={{
                  x: [0, Math.random() * 20 - 10, 0],
                  y: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Status indicator */}
      <div className="absolute bottom-0 right-0 flex items-center justify-center">
        <motion.div
          className={`w-4 h-4 rounded-full ${
            !isConnected 
              ? "bg-gray-400" 
              : isSpeaking 
              ? "bg-purple-500" 
              : isListening 
              ? "bg-blue-500" 
              : "bg-green-500"
          }`}
          animate={{
            scale: isConnected ? [1, 1.2, 1] : 1,
            opacity: isConnected ? [1, 0.7, 1] : 0.5,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Audio visualization bars (when speaking) */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-white/70 rounded-full"
                animate={{
                  height: [size * 0.1, size * 0.3 * (pulseIntensity + 0.2), size * 0.1],
                }}
                transition={{
                  duration: 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
