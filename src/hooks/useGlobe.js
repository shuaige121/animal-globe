import { useRef, useEffect, useCallback, useState } from 'react'

export function useGlobe({ containerRef, onAnimalClick, animals }) {
  const globeRef = useRef(null)
  const globeInstanceRef = useRef(null)
  const autoRotateRef = useRef(true)
  const touchStateRef = useRef({ touching: false, pinchDist: 0 })
  const [isReady, setIsReady] = useState(false)
  const idleTimerRef = useRef(null)

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    autoRotateRef.current = false
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = false
    }
    idleTimerRef.current = setTimeout(() => {
      autoRotateRef.current = true
      if (globeInstanceRef.current) {
        globeInstanceRef.current.controls().autoRotate = true
      }
    }, 3000)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let globe = null
    let animFrame = null

    const initGlobe = async () => {
      const { default: Globe } = await import('globe.gl')

      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight

      globe = Globe({ animateIn: true })
        .width(w)
        .height(h)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#4488ff')
        .atmosphereAltitude(0.15)
        .showAtmosphere(true)

      globe(containerRef.current)
      globeInstanceRef.current = globe

      // 配置控制器
      const controls = globe.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.5
      controls.enableDamping = true
      controls.dampingFactor = 0.1
      controls.minDistance = 101
      controls.maxDistance = 800

      // 初始视角
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000)

      // 添加动物柱状图（种群数量）
      const cylinderData = animals.map(animal => {
        const coords = Array.isArray(animal.habitatCoordinates[0])
          ? animal.habitatCoordinates[0]
          : animal.habitatCoordinates

        const lat = coords[0]
        const lng = coords[1]
        const logPop = animal.population > 0 ? Math.log10(animal.population) : 1
        const minLog = 1, maxLog = 8
        const height = Math.max(0.02, ((logPop - minLog) / (maxLog - minLog)) * 0.4)

        const statusColors = {
          CR: '#ff0000', EN: '#ff4444', VU: '#ff8800',
          NT: '#ffcc00', LC: '#44ff88', EW: '#888888', EX: '#444444',
        }
        return {
          lat,
          lng,
          altitude: height,
          radius: 0.4,
          color: statusColors[animal.conservationStatus] || '#44ff88',
          label: animal.chineseName,
          animal,
        }
      })

      globe
        .cylindersData(cylinderData)
        .cylinderLat(d => d.lat)
        .cylinderLng(d => d.lng)
        .cylinderAltitude(d => d.altitude)
        .cylinderRadius(d => d.radius)
        .cylinderColor(d => d.color)
        .onCylinderClick((d) => {
          if (onAnimalClick) onAnimalClick(d.animal)
          resetIdleTimer()
        })

      // HTML 标记（动物头像）
      globe
        .htmlElementsData(animals)
        .htmlLat(d => {
          const coords = Array.isArray(d.habitatCoordinates[0])
            ? d.habitatCoordinates[0]
            : d.habitatCoordinates
          return coords[0]
        })
        .htmlLng(d => {
          const coords = Array.isArray(d.habitatCoordinates[0])
            ? d.habitatCoordinates[0]
            : d.habitatCoordinates
          return coords[1]
        })
        .htmlAltitude(0.01)
        .htmlElement(d => {
          const isDangerous = ['CR', 'EN'].includes(d.conservationStatus)
          const wrapper = document.createElement('div')
          wrapper.className = 'animal-marker'
          wrapper.style.cssText = `
            position: relative;
            width: 44px;
            height: 44px;
            cursor: pointer;
            transform: translate(-50%, -50%);
          `

          const img = document.createElement('img')
          img.src = d.photoUrl
          img.alt = d.chineseName
          img.className = `animal-avatar ${d.conservationStatus.toLowerCase()}-status`
          img.style.cssText = `
            width: 44px;
            height: 44px;
            border-radius: 50%;
            object-fit: cover;
            display: block;
            border: 2.5px solid ${isDangerous ? '#ff4444' : 'rgba(255,255,255,0.9)'};
            box-shadow: 0 0 0 3px ${isDangerous ? 'rgba(255,68,68,0.4)' : 'rgba(68,136,255,0.4)'}, 0 4px 12px rgba(0,0,0,0.5);
            background: #1a1a3a;
            transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          `

          if (isDangerous) {
            img.style.animation = 'danger-pulse 2s ease-in-out infinite'
          }

          img.onerror = () => {
            img.style.background = isDangerous ? '#3a1a1a' : '#1a1a3a'
            img.src = ''
            const emoji = document.createElement('div')
            emoji.style.cssText = `
              width: 44px; height: 44px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 20px; background: ${isDangerous ? '#3a1a1a' : '#1a2a3a'};
              border: 2.5px solid ${isDangerous ? '#ff4444' : 'rgba(255,255,255,0.9)'};
            `
            emoji.textContent = getCategoryEmoji(d.category)
            wrapper.insertBefore(emoji, img)
            wrapper.removeChild(img)
          }

          if (isDangerous) {
            const warning = document.createElement('div')
            warning.className = 'warning-icon'
            warning.textContent = '!'
            warning.style.cssText = `
              position: absolute; top: -6px; right: -6px;
              width: 18px; height: 18px;
              background: #ff4444; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 10px; line-height: 1; font-weight: bold; color: white;
              border: 1.5px solid #0a0a1a;
              animation: warning-bounce 1.5s ease-in-out infinite;
              pointer-events: none;
            `
            wrapper.appendChild(warning)
          }

          wrapper.appendChild(img)

          wrapper.addEventListener('click', (e) => {
            e.stopPropagation()
            if (onAnimalClick) onAnimalClick(d)
            resetIdleTimer()
          })

          // hover 效果
          wrapper.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.2)'
          })
          wrapper.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)'
          })

          return wrapper
        })

      // 窗口大小调整
      const handleResize = () => {
        if (!containerRef.current || !globe) return
        globe
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
      }
      window.addEventListener('resize', handleResize)

      setIsReady(true)

      // 触摸事件处理
      const el = containerRef.current
      const handleTouchStart = (e) => {
        resetIdleTimer()
        touchStateRef.current.touching = true
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          touchStateRef.current.pinchDist = Math.sqrt(dx*dx + dy*dy)
        }
      }
      const handleTouchEnd = () => {
        touchStateRef.current.touching = false
        resetIdleTimer()
      }

      el.addEventListener('touchstart', handleTouchStart, { passive: true })
      el.addEventListener('touchend', handleTouchEnd, { passive: true })
      el.addEventListener('mousedown', resetIdleTimer, { passive: true })

      return () => {
        window.removeEventListener('resize', handleResize)
        el.removeEventListener('touchstart', handleTouchStart)
        el.removeEventListener('touchend', handleTouchEnd)
        el.removeEventListener('mousedown', resetIdleTimer)
      }
    }

    let cleanup = null
    initGlobe().then(fn => { cleanup = fn })

    return () => {
      if (cleanup) cleanup()
      if (animFrame) cancelAnimationFrame(animFrame)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (globeInstanceRef.current && containerRef.current) {
        try {
          containerRef.current.innerHTML = ''
        } catch (e) {}
      }
    }
  }, [])

  const flyTo = useCallback((lat, lng) => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 1200)
    }
  }, [])

  return { isReady, flyTo }
}

function getCategoryEmoji(category) {
  const emojis = {
    mammal: '🦁',
    bird: '🦅',
    reptile: '🦎',
    amphibian: '🐸',
    fish: '🦈',
    insect: '🦋',
  }
  return emojis[category] || '🐾'
}
