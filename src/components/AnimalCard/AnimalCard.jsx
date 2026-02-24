import { useRef, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ConservationBadge from '../UI/ConservationBadge'
import { useAnimalSound } from '../../hooks/useAnimalSound'

const CATEGORY_LABELS = {
  mammal: '哺乳动物', bird: '鸟类', reptile: '爬行动物',
  amphibian: '两栖动物', fish: '鱼类', insect: '昆虫',
}

const CATEGORY_EMOJIS = {
  mammal: '🦁', bird: '🦅', reptile: '🦎',
  amphibian: '🐸', fish: '🦈', insect: '🦋',
}

function formatPopulation(n) {
  if (!n) return '未知'
  if (n >= 1e8) return `约 ${(n / 1e8).toFixed(1)} 亿`
  if (n >= 1e4) return `约 ${(n / 1e4).toFixed(1)} 万`
  if (n >= 1000) return `约 ${n.toLocaleString()}`
  return `约 ${n}`
}

export default function AnimalCard({ animal, onClose, onShowFoodChain }) {
  const startYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const { playSound } = useAnimalSound()
  const [muted, setMuted] = useState(
    () => localStorage.getItem('animalGlobe_muted') === 'true'
  )

  // Play sound when a new animal card opens
  useEffect(() => {
    if (animal) {
      playSound(animal)
    }
  }, [animal])

  const handleToggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem('animalGlobe_muted', String(next))
      return next
    })
  }, [])

  const handleTouchStart = useCallback((e) => {
    startYRef.current = e.touches[0].clientY
    isDraggingRef.current = true
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const dy = e.changedTouches[0].clientY - startYRef.current
    if (dy > 80) onClose()
  }, [onClose])

  const isDangerous = ['CR', 'EN'].includes(animal.conservationStatus)

  return (
    <motion.div
      className="animal-card"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 28,
        mass: 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 拖动把手 */}
      <div className="card-handle" />

      {/* 静音按钮 */}
      <button
        onClick={handleToggleMute}
        title={muted ? '取消静音' : '静音'}
        style={{
          position: 'absolute', top: '16px', right: '56px',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
          width: '32px', height: '32px',
          borderRadius: '50%', cursor: 'pointer', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: 'rgba(255,255,255,0.6)', width: '32px', height: '32px',
          borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
      >
        ×
      </button>

      <div style={{ padding: '16px 20px 0' }}>
        {/* 顶部：照片 + 基本信息 */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
          {/* 照片 */}
          <div style={{
            width: '90px', height: '90px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${isDangerous ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
            boxShadow: isDangerous ? '0 0 20px rgba(255,68,68,0.2)' : '0 4px 16px rgba(0,0,0,0.4)',
            background: '#1a1a3a',
          }}>
            <img
              src={animal.photoUrl}
              alt={animal.chineseName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentNode.style.display = 'flex'
                e.target.parentNode.style.alignItems = 'center'
                e.target.parentNode.style.justifyContent = 'center'
                e.target.parentNode.style.fontSize = '40px'
                e.target.parentNode.textContent = CATEGORY_EMOJIS[animal.category] || '🐾'
              }}
            />
          </div>

          {/* 信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'white', lineHeight: 1.2 }}>
                {animal.chineseName}
              </span>
              {isDangerous && (
                <span style={{ fontSize: '16px', animation: 'warning-bounce 1.5s ease-in-out infinite' }}>⚠️</span>
              )}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
              {animal.englishName}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: '10px' }}>
              {animal.scientificName}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <ConservationBadge status={animal.conservationStatus} size="sm" />
              <span style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.08)', padding: '3px 8px',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {CATEGORY_LABELS[animal.category] || animal.category}
              </span>
            </div>
          </div>
        </div>

        {/* 描述 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
          padding: '12px 14px', marginBottom: '14px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7', margin: 0 }}>
            {animal.description}
          </p>
        </div>

        {/* 数据栏 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <InfoCard icon="🌍" label="栖息地" value={animal.habitat} />
          <InfoCard icon="📊" label="种群数量" value={formatPopulation(animal.population)} />
          <InfoCard icon="📍" label="分布区域" value={animal.habitatRegion} />
          <InfoCard icon="🏷️" label="食物角色" value={animal.foodChain?.role || '未知'} />
        </div>

        {/* 食物链预览 */}
        <FoodChainPreview animal={animal} />

        {/* 查看食物链按钮 */}
        <motion.button
          onClick={onShowFoodChain}
          style={{
            width: '100%', padding: '15px',
            background: 'linear-gradient(135deg, rgba(68,136,255,0.3), rgba(100,68,255,0.3))',
            border: '1px solid rgba(68,136,255,0.4)',
            borderRadius: '14px', color: 'white', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer', marginBottom: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontFamily: 'inherit',
          }}
          whileHover={{ scale: 1.02, background: 'linear-gradient(135deg, rgba(68,136,255,0.45), rgba(100,68,255,0.45))' }}
          whileTap={{ scale: 0.98 }}
        >
          <span>🕸️</span>
          <span>查看食物链</span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>→</span>
        </motion.button>

        {/* 安全区域 */}
        <div className="safe-bottom" style={{ height: '8px' }} />
      </div>
    </motion.div>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
      padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', lineHeight: '1.3' }}>
        {value}
      </div>
    </div>
  )
}

function FoodChainPreview({ animal }) {
  const { prey = [], predators = [] } = animal.foodChain || {}
  const insects = animal.relatedInsects || []

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px' }}>
        食物链预览
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {predators.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#ff6b6b', background: 'rgba(255,107,107,0.15)', padding: '3px 7px', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.3)' }}>
              天敌
            </span>
            {predators.slice(0, 2).map(p => (
              <span key={p} style={{ fontSize: '11px', color: '#ff9999', background: 'rgba(255,107,107,0.1)', padding: '3px 7px', borderRadius: '8px' }}>
                {p}
              </span>
            ))}
          </div>
        )}
        {prey.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#69db7c', background: 'rgba(105,219,124,0.15)', padding: '3px 7px', borderRadius: '8px', border: '1px solid rgba(105,219,124,0.3)' }}>
              猎物
            </span>
            {prey.slice(0, 3).map(p => (
              <span key={p} style={{ fontSize: '11px', color: '#99ee99', background: 'rgba(105,219,124,0.1)', padding: '3px 7px', borderRadius: '8px' }}>
                {p}
              </span>
            ))}
          </div>
        )}
        {insects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#ffd43b', background: 'rgba(255,212,59,0.15)', padding: '3px 7px', borderRadius: '8px', border: '1px solid rgba(255,212,59,0.3)' }}>
              相关虫
            </span>
            {insects.slice(0, 2).map(i => (
              <span key={i} style={{ fontSize: '11px', color: '#ffe566', background: 'rgba(255,212,59,0.1)', padding: '3px 7px', borderRadius: '8px' }}>
                {i}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
