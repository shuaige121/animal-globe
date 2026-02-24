import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GlobeView from './components/Globe/GlobeView'
import AnimalCard from './components/AnimalCard/AnimalCard'
import FoodChainView from './components/FoodChain/FoodChainView'
import TimelineSlider from './components/Timeline/TimelineSlider'
import animalsData from './data/animals.json'
import timelineData from './data/timeline_eras.json'

const STATUS_COLORS = {
  CR: '#ff0000', EN: '#ff4444', VU: '#ff8800',
  NT: '#ffcc00', LC: '#44ff88', EW: '#888888', EX: '#444444',
}

const STATUS_GROUPS = [
  { color: '#ff0000', label: '极危 CR', statuses: ['CR'] },
  { color: '#ff4444', label: '濒危 EN', statuses: ['EN'] },
  { color: '#ff8800', label: '易危 VU', statuses: ['VU'] },
  { color: '#ffcc00', label: '近危 NT', statuses: ['NT'] },
  { color: '#44ff88', label: '无危 LC', statuses: ['LC'] },
  { color: '#6688aa', label: '未评估', statuses: ['未评估'] },
]

export default function App() {
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [showFoodChain, setShowFoodChain] = useState(false)
  const [currentEra, setCurrentEra] = useState(timelineData.eras[0])

  const displayAnimals = currentEra.id === 'present'
    ? animalsData.animals
    : currentEra.animals

  const handleAnimalSelect = useCallback((animal) => {
    setSelectedAnimal(animal)
    setShowFoodChain(false)
  }, [])

  const handleCloseCard = useCallback(() => {
    setSelectedAnimal(null)
  }, [])

  const handleShowFoodChain = useCallback(() => {
    setShowFoodChain(true)
  }, [])

  const handleCloseFoodChain = useCallback(() => {
    setShowFoodChain(false)
  }, [])

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative',
      background: currentEra.bgColor || '#0a0a1a',
      transition: 'background 1s ease',
      overflow: 'hidden',
    }}>
      {/* 星空背景 */}
      <div className="starfield" />

      {/* 地球仪 */}
      <GlobeView
        animals={displayAnimals}
        onAnimalSelect={handleAnimalSelect}
        selectedAnimal={selectedAnimal}
      />

      {/* 应用标题（左上角）*/}
      <AnimatePresence>
        {!showFoodChain && (
          <motion.div
            style={{
              position: 'fixed',
              top: 'max(20px, env(safe-area-inset-top, 20px))',
              left: '20px',
              zIndex: 50,
            }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div style={{
              background: 'rgba(15, 15, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '12px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                fontSize: '18px', fontWeight: '700', color: 'white',
                letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '20px' }}>🌍</span>
                <span>动物地球仪</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>
                Animal Globe · {displayAnimals.length} Species
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右侧统计面板 */}
      <AnimatePresence>
        {!showFoodChain && (
          <motion.div
            className="stats-panel"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ delay: 1.5, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.45)',
              marginBottom: '10px', fontWeight: '700', letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              保护等级
            </div>
            {STATUS_GROUPS.map(({ color, label, statuses }) => {
              const count = displayAnimals.filter(a => statuses.includes(a.conservationStatus)).length
              return (
                <div key={label} className="stat-item" style={{ marginBottom: '7px' }}>
                  <div
                    className="stat-dot"
                    style={{
                      background: color,
                      boxShadow: count > 0 ? `0 0 6px ${color}` : 'none',
                    }}
                  />
                  <span style={{ flex: 1 }}>{label}</span>
                  {count > 0 && (
                    <span style={{
                      color: color, fontWeight: '700', fontSize: '13px',
                      background: `${color}20`, padding: '1px 6px',
                      borderRadius: '8px', border: `1px solid ${color}40`,
                    }}>
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
            <div style={{
              marginTop: '10px', paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center',
            }}>
              共 <span style={{ color: 'white', fontWeight: '700' }}>{displayAnimals.length}</span> 个物种
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部操作提示（位于时间轴上方） */}
      <AnimatePresence>
        {!selectedAnimal && !showFoodChain && (
          <motion.div
            style={{
              position: 'fixed',
              bottom: '88px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 15, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.65)',
              padding: '10px 22px',
              borderRadius: '50px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              zIndex: 50,
              pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ delay: 2.5, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👆</span>
              <span>点击标记查看动物</span>
            </span>
            <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌐</span>
              <span>拖动旋转地球</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 地质年代时间轴 */}
      {!showFoodChain && (
        <TimelineSlider
          currentEra={currentEra}
          onEraChange={setCurrentEra}
          eras={timelineData.eras}
        />
      )}

      {/* 动物卡片（底部滑出） */}
      <AnimatePresence>
        {selectedAnimal && !showFoodChain && (
          <AnimalCard
            key={selectedAnimal.id}
            animal={selectedAnimal}
            onClose={handleCloseCard}
            onShowFoodChain={handleShowFoodChain}
          />
        )}
      </AnimatePresence>

      {/* 食物链视图（全屏） */}
      <AnimatePresence>
        {showFoodChain && selectedAnimal && (
          <FoodChainView
            key={`foodchain-${selectedAnimal.id}`}
            animal={selectedAnimal}
            onClose={handleCloseFoodChain}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
