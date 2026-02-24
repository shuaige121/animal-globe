const STATUS_CONFIG = {
  CR: { label: '极危 CR', bg: 'rgba(255,0,0,0.2)', border: '#ff0000', color: '#ff4444', emoji: '🔴' },
  EN: { label: '濒危 EN', bg: 'rgba(255,68,68,0.15)', border: '#ff4444', color: '#ff6b6b', emoji: '🟠' },
  VU: { label: '易危 VU', bg: 'rgba(255,136,0,0.15)', border: '#ff8800', color: '#ff9933', emoji: '🟡' },
  NT: { label: '近危 NT', bg: 'rgba(255,204,0,0.15)', border: '#ffcc00', color: '#ffdd44', emoji: '🟡' },
  LC: { label: '无危 LC', bg: 'rgba(68,255,136,0.12)', border: '#44ff88', color: '#44ff88', emoji: '🟢' },
  EW: { label: '野外灭绝 EW', bg: 'rgba(136,136,136,0.15)', border: '#888888', color: '#aaaaaa', emoji: '⚫' },
  EX: { label: '已灭绝 EX', bg: 'rgba(68,68,68,0.15)', border: '#444444', color: '#888888', emoji: '⚫' },
  '未评估': { label: '未评估', bg: 'rgba(102,136,170,0.15)', border: '#6688aa', color: '#88aacc', emoji: '⬜' },
}

const DEFAULT_CONFIG = { label: '未评估', bg: 'rgba(102,136,170,0.15)', border: '#6688aa', color: '#88aacc', emoji: '⬜' }

export default function ConservationBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || DEFAULT_CONFIG

  const sizes = {
    sm: { fontSize: '10px', padding: '3px 8px', gap: '3px' },
    md: { fontSize: '12px', padding: '5px 12px', gap: '4px' },
    lg: { fontSize: '14px', padding: '7px 16px', gap: '6px' },
  }

  const sizeStyle = sizes[size] || sizes.md

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyle.gap,
        padding: sizeStyle.padding,
        borderRadius: '20px',
        fontSize: sizeStyle.fontSize,
        fontWeight: '700',
        letterSpacing: '0.5px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  )
}
