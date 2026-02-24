// PopulationBar 用于柱状图配置的辅助函数
export function getBarHeight(population) {
  if (!population || population <= 0) return 0.01
  const logPop = Math.log10(population)
  const minLog = 1
  const maxLog = 8
  const normalized = (logPop - minLog) / (maxLog - minLog)
  return Math.max(0.01, Math.min(0.4, normalized * 0.4))
}

export function getBarColor(conservationStatus) {
  const colors = {
    CR: '#ff0000',
    EN: '#ff4444',
    VU: '#ff8800',
    NT: '#ffcc00',
    LC: '#44ff88',
    EW: '#888888',
    EX: '#444444',
  }
  return colors[conservationStatus] || '#44ff88'
}

export default function PopulationBar() {
  return null
}
