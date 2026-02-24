import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_COLORS = {
  CR: '#ff0000', EN: '#ff4444', VU: '#ff8800',
  NT: '#ffcc00', LC: '#44ff88', EW: '#888888', EX: '#444444',
  '未评估': '#6688aa',
}

function getStatusColor(status) {
  return STATUS_COLORS[status] || '#6688aa'
}

function getCategoryEmoji(category) {
  const emojis = {
    mammal: '🦁', bird: '🦅', reptile: '🦎',
    amphibian: '🐸', fish: '🦈', insect: '🦋',
  }
  return emojis[category] || '🐾'
}

function getCoords(animal) {
  const c = animal.habitatCoordinates
  if (!c || c.length === 0) return null
  if (Array.isArray(c[0])) {
    const lat = c[0][0], lng = c[0][1]
    if (typeof lat !== 'number' || typeof lng !== 'number') return null
    if (isNaN(lat) || isNaN(lng)) return null
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    return { lat, lng }
  }
  if (typeof c[0] === 'number' && typeof c[1] === 'number') {
    const lat = c[0], lng = c[1]
    if (isNaN(lat) || isNaN(lng)) return null
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    return { lat, lng }
  }
  return null
}

function createMarkerElement(animal, onAnimalSelect) {
  const isDangerous = ['CR', 'EN'].includes(animal.conservationStatus)
  const statusColor = getStatusColor(animal.conservationStatus)

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    position: relative;
    width: 44px;
    height: 44px;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  `

  const img = document.createElement('img')
  img.src = animal.photoUrl || ''
  img.alt = animal.chineseName || ''
  img.loading = 'lazy'
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

  img.onerror = () => {
    const fallback = document.createElement('div')
    fallback.style.cssText = `
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; background: ${isDangerous ? '#3a1a1a' : '#1a2a3a'};
      border: 2.5px solid ${isDangerous ? '#ff4444' : 'rgba(255,255,255,0.9)'};
      box-shadow: 0 0 0 3px ${isDangerous ? 'rgba(255,68,68,0.4)' : 'rgba(68,136,255,0.4)'};
    `
    fallback.textContent = getCategoryEmoji(animal.category)
    if (wrapper.contains(img)) wrapper.replaceChild(fallback, img)
  }

  if (isDangerous) {
    const warning = document.createElement('div')
    warning.style.cssText = `
      position: absolute; top: -6px; right: -6px;
      width: 18px; height: 18px;
      background: #ff4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: bold; color: white; line-height: 1;
      border: 1.5px solid #0a0a1a;
      pointer-events: none; z-index: 2;
    `
    warning.textContent = '!'
    wrapper.appendChild(warning)
  }

  wrapper.appendChild(img)

  wrapper.addEventListener('click', e => {
    e.stopPropagation()
    onAnimalSelect(animal)
  })

  wrapper.addEventListener('touchend', e => {
    e.stopPropagation()
    e.preventDefault()
    onAnimalSelect(animal)
  }, { passive: false })

  wrapper.addEventListener('mouseenter', () => {
    wrapper.style.transform = 'translate(-50%, -50%) scale(1.15)'
  })
  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.transform = 'translate(-50%, -50%) scale(1)'
  })

  return wrapper
}

export default function GlobeView({ animals, onAnimalSelect, selectedAnimal }) {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const idleTimerRef = useRef(null)
  const onAnimalSelectRef = useRef(onAnimalSelect)

  useEffect(() => { onAnimalSelectRef.current = onAnimalSelect }, [onAnimalSelect])

  const startAutoRotate = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
    }
  }, [])

  const stopAutoRotate = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false
    }
    idleTimerRef.current = setTimeout(startAutoRotate, 3000)
  }, [startAutoRotate])

  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true
    let cleanupFn = null

    const init = async () => {
      try {
        // Wait for container to have real dimensions
        await new Promise(resolve => setTimeout(resolve, 100))
        if (!mounted || !containerRef.current) return

        const w = containerRef.current.clientWidth || window.innerWidth
        const h = containerRef.current.clientHeight || window.innerHeight

        const GlobeModule = await import('globe.gl')
        const Globe = GlobeModule.default

        if (!mounted || !containerRef.current) return

        // Only show animals with valid GPS coordinates
        const animalsWithCoords = (animals || []).filter(a => getCoords(a) !== null)

        const dpr = Math.min(window.devicePixelRatio || 1, 3)

        // Use local textures (served from /animal-globe/earth-blue-marble.jpg)
        const globe = Globe()

        globe
          .width(w)
          .height(h)
          .backgroundColor('rgba(0,0,0,0)')
          .globeImageUrl('/animal-globe/earth-blue-marble.jpg')
          .bumpImageUrl('/animal-globe/earth-topology.png')
          .atmosphereColor('#4488ff')
          .atmosphereAltitude(0.15)

        if (typeof globe.showAtmosphere === 'function') {
          globe.showAtmosphere(true)
        }

        globe
          .htmlElementsData(animalsWithCoords)
          .htmlLat(d => getCoords(d).lat)
          .htmlLng(d => getCoords(d).lng)
          .htmlAltitude(0.015)
          .htmlElement(d => createMarkerElement(d, (a) => {
            onAnimalSelectRef.current?.(a)
            stopAutoRotate()
          }))

        globe(containerRef.current)
        globeRef.current = globe

        // 4K / AirPlay sharpness
        const renderer = globe.renderer?.()
        if (renderer) renderer.setPixelRatio(dpr)

        const controls = globe.controls()
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.5
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.minDistance = 101
        controls.maxDistance = 700
        controls.enablePan = false

        globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1500)

        const handleResize = () => {
          if (!containerRef.current || !globeRef.current) return
          globeRef.current
            .width(containerRef.current.clientWidth)
            .height(containerRef.current.clientHeight)
        }
        window.addEventListener('resize', handleResize)

        const el = containerRef.current
        el.addEventListener('touchstart', stopAutoRotate, { passive: true })
        el.addEventListener('mousedown', stopAutoRotate, { passive: true })

        if (mounted) setIsLoading(false)

        cleanupFn = () => {
          window.removeEventListener('resize', handleResize)
          if (el) {
            el.removeEventListener('touchstart', stopAutoRotate)
            el.removeEventListener('mousedown', stopAutoRotate)
          }
        }
      } catch (err) {
        console.error('Globe init error:', err)
        if (mounted) {
          setLoadError(err.message || '未知错误')
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
      if (cleanupFn) cleanupFn()
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (globeRef.current && containerRef.current) {
        try { containerRef.current.innerHTML = '' } catch (_) {}
        globeRef.current = null
      }
    }
  }, [])

  // Fly to selected animal
  useEffect(() => {
    if (selectedAnimal && globeRef.current) {
      const coords = getCoords(selectedAnimal)
      if (coords) {
        setTimeout(() => {
          globeRef.current?.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.8 }, 1200)
        }, 100)
      }
      stopAutoRotate()
    }
  }, [selectedAnimal])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #6699ff, #1a1a6a, #0a0a2a)',
                boxShadow: '0 0 50px rgba(68,136,255,0.5), 0 0 100px rgba(68,136,255,0.2)',
                position: 'relative', overflow: 'hidden',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <div style={{
                position: 'absolute', top: '15%', left: '20%',
                width: '35%', height: '30%',
                background: 'rgba(68,200,68,0.5)', borderRadius: '50% 40% 50% 40%',
                filter: 'blur(2px)',
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: '60%',
                width: '25%', height: '20%',
                background: 'rgba(68,200,68,0.4)', borderRadius: '40% 50%',
                filter: 'blur(1px)',
              }} />
            </motion.div>
            <motion.div
              style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '600' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              正在加载地球仪...
            </motion.div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
              Animal Globe · Loading
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadError && !isLoading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', color: 'rgba(255,255,255,0.7)',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <div style={{ fontSize: '16px' }}>地球仪加载失败</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', maxWidth: '300px', textAlign: 'center' }}>
            {loadError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(68,136,255,0.3)', border: '1px solid rgba(68,136,255,0.5)',
              color: 'white', padding: '10px 24px', borderRadius: '20px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '14px',
            }}
          >
            重新加载
          </button>
        </div>
      )}
    </div>
  )
}
