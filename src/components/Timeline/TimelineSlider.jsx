import { useRef, useCallback, useEffect, useState } from 'react'

// Logarithmic scale: position 0 = present (left), position 1 = 4B years (right)
// We invert so left side = present, right side = deep past
const LOG_MAX = Math.log10(4000000001)

function yearsToPosition(years) {
  if (years <= 0) return 0
  return Math.log10(years + 1) / LOG_MAX
}

function positionToYears(pos) {
  if (pos <= 0) return 0
  return Math.pow(10, pos * LOG_MAX) - 1
}

function formatYears(years) {
  if (years < 10000) return '现代'
  if (years < 1000000) return `${Math.round(years / 1000)}千年前`
  if (years < 100000000) return `${(years / 1000000).toFixed(1)}百万年前`
  return `${(years / 100000000).toFixed(2)}亿年前`
}

function findEraForYears(years, eras) {
  // eras are ordered: present first, precambrian last
  // find the era whose start <= years < end
  for (let i = 0; i < eras.length; i++) {
    const era = eras[i]
    if (years >= era.start && years < era.end) return era
  }
  // fallback: return last era for very large values
  return eras[eras.length - 1]
}

// Key marker labels to show on the track
const ERA_MARKERS = [
  { label: '现代', years: 0 },
  { label: '冰河期', years: 2600000 },
  { label: '恐龙', years: 66000000 },
  { label: '寒武纪', years: 541000000 },
  { label: '前寒武纪', years: 4000000000 },
]

export default function TimelineSlider({ currentEra, onEraChange, eras }) {
  const trackRef = useRef(null)
  const isDragging = useRef(false)
  const [position, setPosition] = useState(0) // 0 = present, 1 = 4B years ago

  // Sync position when era changes externally (e.g. initial mount)
  useEffect(() => {
    if (!isDragging.current) {
      setPosition(yearsToPosition(currentEra.start))
    }
  }, [currentEra.start])

  const getPositionFromEvent = useCallback((clientX) => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const raw = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(1, raw))
  }, [])

  const applyPosition = useCallback((pos) => {
    setPosition(pos)
    const years = positionToYears(pos)
    const era = findEraForYears(years, eras)
    if (era && era.id !== currentEra.id) {
      onEraChange(era)
    }
  }, [eras, currentEra.id, onEraChange])

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    applyPosition(getPositionFromEvent(e.clientX))

    const onMove = (e) => {
      if (isDragging.current) {
        applyPosition(getPositionFromEvent(e.clientX))
      }
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [applyPosition, getPositionFromEvent])

  // Touch events
  const handleTouchStart = useCallback((e) => {
    isDragging.current = true
    applyPosition(getPositionFromEvent(e.touches[0].clientX))

    const onMove = (e) => {
      e.preventDefault()
      if (isDragging.current) {
        applyPosition(getPositionFromEvent(e.touches[0].clientX))
      }
    }
    const onEnd = () => {
      isDragging.current = false
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }, [applyPosition, getPositionFromEvent])

  const eraColor = currentEra.color || '#44ff88'
  const yearsValue = positionToYears(position)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'rgba(8, 8, 20, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${eraColor}33`,
        padding: '10px 20px 14px',
        userSelect: 'none',
        transition: 'border-color 0.8s ease',
      }}
    >
      {/* Era name and time display */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: '700',
            color: eraColor,
            letterSpacing: '0.5px',
            transition: 'color 0.5s ease',
          }}>
            {currentEra.name}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.45)',
            fontStyle: 'italic',
          }}>
            {currentEra.nameEn}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
          }}>
            · {currentEra.description}
          </span>
        </div>
        <span style={{
          fontSize: '12px',
          color: eraColor,
          opacity: 0.8,
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.5s ease',
        }}>
          {formatYears(yearsValue)}
        </span>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          marginBottom: '6px',
        }}
      >
        {/* Filled portion (left = present side) */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${position * 100}%`,
          borderRadius: '3px',
          background: `linear-gradient(to right, #44ff8844, ${eraColor})`,
          transition: 'background 0.5s ease',
        }} />

        {/* Era band color segments behind the track */}
        {eras.map((era) => {
          const left = yearsToPosition(era.start) * 100
          const right = yearsToPosition(Math.min(era.end, 4000000000)) * 100
          const width = right - left
          if (width <= 0) return null
          return (
            <div
              key={era.id}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${left}%`,
                width: `${width}%`,
                background: `${era.color}18`,
                borderRadius: era.id === 'present' ? '3px 0 0 3px' : era.id === 'precambrian' ? '0 3px 3px 0' : '0',
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Draggable handle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${position * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: eraColor,
          boxShadow: `0 0 8px ${eraColor}, 0 0 16px ${eraColor}66`,
          border: '2px solid rgba(255,255,255,0.8)',
          cursor: 'grab',
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
          zIndex: 2,
        }} />
      </div>

      {/* Era markers below track */}
      <div style={{
        position: 'relative',
        height: '18px',
      }}>
        {ERA_MARKERS.map((marker) => {
          const pos = yearsToPosition(marker.years) * 100
          return (
            <div
              key={marker.label}
              style={{
                position: 'absolute',
                left: `${pos}%`,
                transform: 'translateX(-50%)',
                fontSize: '9px',
                color: 'rgba(255,255,255,0.35)',
                whiteSpace: 'nowrap',
                top: 0,
                lineHeight: 1,
                pointerEvents: 'none',
              }}
            >
              {/* Tick mark */}
              <div style={{
                width: '1px',
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                margin: '0 auto 2px',
              }} />
              {marker.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
