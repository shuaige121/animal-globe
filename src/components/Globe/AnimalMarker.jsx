// AnimalMarker 用于 globe.gl 的 htmlElement 回调中动态创建 DOM
// 实际渲染逻辑在 useGlobe.js 的 htmlElement 配置中

export function getStatusColor(status) {
  const colors = {
    CR: '#ff0000',
    EN: '#ff4444',
    VU: '#ff8800',
    NT: '#ffcc00',
    LC: '#44ff88',
    EW: '#888888',
    EX: '#444444',
  }
  return colors[status] || '#44ff88'
}

export function isDangerous(status) {
  return ['CR', 'EN'].includes(status)
}

export default function AnimalMarker() {
  return null
}
