import { useMemo } from 'react'
import animalsData from '../data/animals.json'

const STATUS_ORDER = ['CR', 'EN', 'VU', 'NT', 'LC', 'EW', 'EX']

export function useAnimalData() {
  const animals = useMemo(() => animalsData.animals, [])

  const getStatusColor = (status) => {
    const colors = {
      CR: '#ff0000',
      EN: '#ff4444',
      VU: '#ff8800',
      NT: '#ffcc00',
      LC: '#44ff88',
      EW: '#888888',
      EX: '#444444',
    }
    return colors[status] || '#888888'
  }

  const getStatusLabel = (status) => {
    const labels = {
      CR: '极危',
      EN: '濒危',
      VU: '易危',
      NT: '近危',
      LC: '无危',
      EW: '野外灭绝',
      EX: '灭绝',
    }
    return labels[status] || status
  }

  const isDangerous = (status) => ['CR', 'EN'].includes(status)

  const getPopulationBarHeight = (population) => {
    if (!population || population <= 0) return 0.01
    const logPop = Math.log10(population)
    const minLog = 1  // 10
    const maxLog = 8  // 100,000,000
    const normalized = (logPop - minLog) / (maxLog - minLog)
    return Math.max(0.01, Math.min(0.8, normalized * 0.8))
  }

  const stats = useMemo(() => {
    const byStatus = {}
    STATUS_ORDER.forEach(s => { byStatus[s] = 0 })
    animals.forEach(a => {
      if (byStatus[a.conservationStatus] !== undefined) {
        byStatus[a.conservationStatus]++
      }
    })
    return { byStatus, total: animals.length }
  }, [animals])

  return {
    animals,
    stats,
    getStatusColor,
    getStatusLabel,
    isDangerous,
    getPopulationBarHeight,
  }
}
