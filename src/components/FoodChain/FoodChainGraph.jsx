import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'

const NODE_CONFIG = {
  self: { color: '#4488ff', radius: 52, stroke: '#88aaff', labelColor: 'white', glowColor: 'rgba(68,136,255,0.5)' },
  prey: { color: '#1a6b2a', radius: 32, stroke: '#69db7c', labelColor: '#a8f0b4', glowColor: 'rgba(105,219,124,0.3)' },
  predator: { color: '#6b1a1a', radius: 32, stroke: '#ff6b6b', labelColor: '#ffaaaa', glowColor: 'rgba(255,107,107,0.3)' },
  insect: { color: '#5a4d0a', radius: 26, stroke: '#ffd43b', labelColor: '#ffe566', glowColor: 'rgba(255,212,59,0.3)' },
}

const LINK_CONFIG = {
  eats: { color: '#69db7c', width: 2, animated: true, label: '捕食' },
  eaten_by: { color: '#ff6b6b', width: 2, animated: true, label: '被捕食' },
  related: { color: '#ffd43b', width: 1.5, animated: false, label: '相关' },
}

export default function FoodChainGraph({ animal }) {
  const svgRef = useRef(null)
  const simulationRef = useRef(null)

  const buildGraph = useCallback(() => {
    const { prey = [], predators = [] } = animal.foodChain || {}
    const insects = animal.relatedInsects || []

    const nodes = [
      { id: 'self', type: 'self', label: animal.chineseName, photo: animal.photoUrl },
      ...prey.map(p => ({ id: `prey_${p}`, type: 'prey', label: p })),
      ...predators.map(p => ({ id: `pred_${p}`, type: 'predator', label: p })),
      ...insects.map(i => ({ id: `insect_${i}`, type: 'insect', label: i })),
    ]

    const links = [
      ...prey.map(p => ({ source: `prey_${p}`, target: 'self', type: 'eats' })),
      ...predators.map(p => ({ source: 'self', target: `pred_${p}`, type: 'eaten_by' })),
      ...insects.map(i => ({ source: 'self', target: `insect_${i}`, type: 'related' })),
    ]

    return { nodes, links }
  }, [animal])

  useEffect(() => {
    if (!svgRef.current) return

    const { nodes, links } = buildGraph()
    const svgEl = svgRef.current
    const rect = svgEl.getBoundingClientRect()
    const width = rect.width || window.innerWidth
    const height = rect.height || window.innerHeight

    // 清空
    d3.select(svgEl).selectAll('*').remove()

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)

    // 定义箭头 marker
    const defs = svg.append('defs')
    ;[
      { id: 'arrow-eats', color: '#69db7c' },
      { id: 'arrow-eaten', color: '#ff6b6b' },
      { id: 'arrow-related', color: '#ffd43b' },
    ].forEach(({ id, color }) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color)
        .attr('opacity', 0.8)
    })

    // 滤镜发光效果
    const filter = defs.append('filter')
      .attr('id', 'glow')
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // 主图层
    const g = svg.append('g')

    // 缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    // 初始化力模拟
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
        if (d.type === 'related') return 160
        const config = NODE_CONFIG[nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source))?.type] || {}
        return 140 + (config.radius || 32)
      }).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => NODE_CONFIG[d.type]?.radius + 20 || 50))
      .force('x', d3.forceX().x(d => {
        if (d.type === 'self') return width / 2
        if (d.type === 'prey') return width * 0.25
        if (d.type === 'predator') return width * 0.75
        return width / 2
      }).strength(0.15))
      .force('y', d3.forceY().y(d => {
        if (d.type === 'self') return height / 2
        if (d.type === 'insect') return height * 0.78
        return height / 2
      }).strength(0.1))

    simulationRef.current = simulation

    // 连线
    const linkGroup = g.append('g').attr('class', 'links')
    const link = linkGroup.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => LINK_CONFIG[d.type]?.color || '#888')
      .attr('stroke-width', d => LINK_CONFIG[d.type]?.width || 1.5)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-dasharray', d => LINK_CONFIG[d.type]?.animated ? '8 4' : 'none')
      .attr('marker-end', d => {
        if (d.type === 'eats') return 'url(#arrow-eats)'
        if (d.type === 'eaten_by') return 'url(#arrow-eaten)'
        return 'url(#arrow-related)'
      })
      .style('animation', d => LINK_CONFIG[d.type]?.animated ? 'dash-flow 1.5s linear infinite' : 'none')

    // 节点组
    const nodeGroup = g.append('g').attr('class', 'nodes')
    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // 外圈光晕
    node.append('circle')
      .attr('r', d => (NODE_CONFIG[d.type]?.radius || 32) + 8)
      .attr('fill', d => NODE_CONFIG[d.type]?.glowColor || 'rgba(255,255,255,0.1)')
      .attr('stroke', 'none')
      .style('filter', 'blur(4px)')

    // 主圆
    node.append('circle')
      .attr('r', d => NODE_CONFIG[d.type]?.radius || 32)
      .attr('fill', d => NODE_CONFIG[d.type]?.color || '#333')
      .attr('stroke', d => NODE_CONFIG[d.type]?.stroke || '#888')
      .attr('stroke-width', d => d.type === 'self' ? 3 : 2)
      .style('filter', d => d.type === 'self' ? 'url(#glow)' : 'none')

    // 自身节点：照片裁切圆
    const selfNode = node.filter(d => d.type === 'self')
    const selfDefs = defs
    selfDefs.append('clipPath')
      .attr('id', 'avatar-clip')
      .append('circle')
      .attr('r', NODE_CONFIG.self.radius - 2)

    selfNode.append('image')
      .attr('href', d => d.photo)
      .attr('x', -(NODE_CONFIG.self.radius - 2))
      .attr('y', -(NODE_CONFIG.self.radius - 2))
      .attr('width', (NODE_CONFIG.self.radius - 2) * 2)
      .attr('height', (NODE_CONFIG.self.radius - 2) * 2)
      .attr('clip-path', 'url(#avatar-clip)')
      .attr('preserveAspectRatio', 'xMidYMid slice')

    // 标签
    node.append('text')
      .attr('dy', d => d.type === 'self' ? NODE_CONFIG.self.radius + 18 : (NODE_CONFIG[d.type]?.radius || 32) + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', d => NODE_CONFIG[d.type]?.labelColor || 'white')
      .attr('font-size', d => d.type === 'self' ? '15px' : '13px')
      .attr('font-weight', d => d.type === 'self' ? '700' : '500')
      .attr('font-family', "'Noto Sans SC', 'PingFang SC', sans-serif")
      .attr('stroke', 'rgba(0,0,0,0.8)')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .text(d => d.label)

    // 类型标签（猎物/天敌/相关）
    node.filter(d => d.type !== 'self').append('text')
      .attr('dy', -4)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', d => NODE_CONFIG[d.type]?.labelColor || 'white')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('font-family', "'Noto Sans SC', 'PingFang SC', sans-serif")
      .attr('stroke', 'rgba(0,0,0,0.8)')
      .attr('stroke-width', 2)
      .attr('paint-order', 'stroke')
      .text(d => {
        if (d.type === 'prey') return '🌿'
        if (d.type === 'predator') return '⚡'
        if (d.type === 'insect') return '🦟'
        return ''
      })

    // hover 效果
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('circle:nth-child(2)')
        .transition().duration(200)
        .attr('r', (NODE_CONFIG[d.type]?.radius || 32) + 4)
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle:nth-child(2)')
        .transition().duration(200)
        .attr('r', NODE_CONFIG[d.type]?.radius || 32)
    })

    // 力模拟 tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // 进入动画
    node.style('opacity', 0)
      .transition()
      .duration(600)
      .delay((d, i) => i * 60)
      .style('opacity', 1)

    link.style('opacity', 0)
      .transition()
      .duration(600)
      .delay(300)
      .style('opacity', 1)

    // 图例
    const legendData = [
      { type: 'predator', label: '天敌节点', color: '#ff6b6b' },
      { type: 'self', label: '当前动物', color: '#4488ff' },
      { type: 'prey', label: '猎物节点', color: '#69db7c' },
      { type: 'insect', label: '相关昆虫', color: '#ffd43b' },
    ]

    const legend = svg.append('g')
      .attr('transform', `translate(20, ${height - 100})`)

    legendData.forEach((item, i) => {
      const row = legend.append('g').attr('transform', `translate(${i * 110}, 0)`)
      row.append('circle').attr('r', 6).attr('fill', item.color).attr('opacity', 0.8)
      row.append('text')
        .attr('x', 12).attr('y', 4)
        .attr('fill', 'rgba(255,255,255,0.6)')
        .attr('font-size', '12px')
        .attr('font-family', "'Noto Sans SC', 'PingFang SC', sans-serif")
        .text(item.label)
    })

    // 标题
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '18px')
      .attr('font-weight', '700')
      .attr('font-family', "'Noto Sans SC', 'PingFang SC', sans-serif")
      .attr('stroke', 'rgba(0,0,0,0.8)')
      .attr('stroke-width', 2)
      .attr('paint-order', 'stroke')
      .text(`${animal.chineseName} 的食物链`)

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 56)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('font-size', '12px')
      .attr('font-family', "'Noto Sans SC', 'PingFang SC', sans-serif")
      .text('拖动节点 · 双指缩放')

    return () => {
      simulation.stop()
    }
  }, [animal, buildGraph])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
