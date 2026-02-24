import { motion } from 'framer-motion'
import FoodChainGraph from './FoodChainGraph'
import BackButton from '../UI/BackButton'
import ConservationBadge from '../UI/ConservationBadge'

export default function FoodChainView({ animal, onClose }) {
  const { prey = [], predators = [] } = animal.foodChain || {}
  const insects = animal.relatedInsects || []

  return (
    <motion.div
      className="food-chain-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* 背景渐变 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(20,20,60,0.8) 0%, rgba(10,10,26,0.98) 100%)',
        zIndex: 0,
      }} />

      {/* D3 图 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <FoodChainGraph animal={animal} />
      </div>

      {/* 顶部动物信息卡片 */}
      <motion.div
        style={{
          position: 'absolute',
          top: 'max(20px, env(safe-area-inset-top, 20px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 15, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 'calc(100vw - 40px)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* 头像 */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: '2px solid rgba(68,136,255,0.5)',
          boxShadow: '0 0 12px rgba(68,136,255,0.3)',
        }}>
          <img
            src={animal.photoUrl}
            alt={animal.chineseName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>

        {/* 信息 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>
              {animal.chineseName}
            </span>
            <ConservationBadge status={animal.conservationStatus} size="sm" />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>
            {animal.scientificName} · 食物链关系图
          </div>
        </div>
      </motion.div>

      {/* 右侧图例说明 */}
      <motion.div
        style={{
          position: 'absolute',
          top: 'max(20px, env(safe-area-inset-top, 20px))',
          right: '16px',
          zIndex: 10,
          background: 'rgba(15, 15, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '12px 14px',
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: '600' }}>
          统计
        </div>
        <StatRow color="#69db7c" label="猎物" count={prey.length} />
        <StatRow color="#ff6b6b" label="天敌" count={predators.length} />
        <StatRow color="#ffd43b" label="相关昆虫" count={insects.length} />
      </motion.div>

      {/* 返回按钮 */}
      <BackButton onClick={onClose} label="返回地球仪" icon="🌍" />
    </motion.div>
  )
}

function StatRow({ color, label, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '6px', fontSize: '12px',
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <span style={{ color: color, fontWeight: '700', marginLeft: 'auto' }}>{count}</span>
    </div>
  )
}
