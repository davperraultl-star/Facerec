import { useState, useCallback } from 'react'

interface InjectionPoint {
  id: string
  x: number
  y: number
  label?: string
  color?: string
}

interface ToothChartProps {
  selectedTeeth: string[]
  onToggleTooth?: (toothId: string) => void
  points: InjectionPoint[]
  onAddPoint?: (x: number, y: number) => void
  onRemovePoint?: (id: string) => void
  color?: string
  interactive?: boolean
}

// FDI tooth numbering
// Upper Right: 18-11, Upper Left: 21-28
// Lower Left: 38-31, Lower Right: 41-48
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11']
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28']
const LOWER_LEFT = ['38', '37', '36', '35', '34', '33', '32', '31']
const LOWER_RIGHT = ['41', '42', '43', '44', '45', '46', '47', '48']

const TOOTH_NAMES: Record<string, string> = {
  '11': 'Central Incisor',   '21': 'Central Incisor',
  '12': 'Lateral Incisor',   '22': 'Lateral Incisor',
  '13': 'Canine',            '23': 'Canine',
  '14': '1st Premolar',      '24': '1st Premolar',
  '15': '2nd Premolar',      '25': '2nd Premolar',
  '16': '1st Molar',         '26': '1st Molar',
  '17': '2nd Molar',         '27': '2nd Molar',
  '18': '3rd Molar',         '28': '3rd Molar',
  '31': 'Central Incisor',   '41': 'Central Incisor',
  '32': 'Lateral Incisor',   '42': 'Lateral Incisor',
  '33': 'Canine',            '43': 'Canine',
  '34': '1st Premolar',      '44': '1st Premolar',
  '35': '2nd Premolar',      '45': '2nd Premolar',
  '36': '1st Molar',         '46': '1st Molar',
  '37': '2nd Molar',         '47': '2nd Molar',
  '38': '3rd Molar',         '48': '3rd Molar'
}

// Tooth sizes (molars wider than incisors)
function getToothWidth(toothId: string): number {
  const num = parseInt(toothId.slice(1))
  if (num >= 6) return 32 // Molars
  if (num >= 4) return 26 // Premolars
  if (num === 3) return 24 // Canines
  return 22 // Incisors
}

function getToothHeight(toothId: string): number {
  const num = parseInt(toothId.slice(1))
  if (num >= 6) return 34
  if (num >= 4) return 36
  if (num === 3) return 40
  return 36
}

export function ToothChart({
  selectedTeeth,
  onToggleTooth,
  points,
  onAddPoint,
  onRemovePoint,
  color = '#60A5FA',
  interactive = true
}: ToothChartProps): React.JSX.Element {
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!interactive || !onAddPoint) return
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 600
      const y = ((e.clientY - rect.top) / rect.height) * 400
      onAddPoint(Math.round(x), Math.round(y))
    },
    [interactive, onAddPoint]
  )

  return (
    <div className="relative">
      <p className="text-[11px] font-medium text-muted-foreground/70 text-center mb-1">
        Tooth Chart (FDI)
      </p>
      <svg
        viewBox="0 0 600 400"
        className={`w-full max-w-[500px] mx-auto ${interactive ? 'cursor-crosshair' : ''}`}
        onClick={handleSvgClick}
      >
        {/* Background */}
        <rect width="600" height="400" fill="transparent" />

        {/* Midline */}
        <line
          x1="300"
          y1="40"
          x2="300"
          y2="360"
          stroke="hsl(210 80% 55% / 0.1)"
          strokeDasharray="4 4"
        />

        {/* Horizontal divider */}
        <line
          x1="30"
          y1="200"
          x2="570"
          y2="200"
          stroke="hsl(210 80% 55% / 0.15)"
          strokeWidth="1"
        />

        {/* Quadrant labels */}
        <text x="150" y="30" textAnchor="middle" fontSize="10" fill="hsl(210 80% 55% / 0.3)" fontWeight="500">
          Upper Right (Q1)
        </text>
        <text x="450" y="30" textAnchor="middle" fontSize="10" fill="hsl(210 80% 55% / 0.3)" fontWeight="500">
          Upper Left (Q2)
        </text>
        <text x="150" y="395" textAnchor="middle" fontSize="10" fill="hsl(210 80% 55% / 0.3)" fontWeight="500">
          Lower Right (Q4)
        </text>
        <text x="450" y="395" textAnchor="middle" fontSize="10" fill="hsl(210 80% 55% / 0.3)" fontWeight="500">
          Lower Left (Q3)
        </text>

        {/* Upper arch */}
        <ToothRow
          teeth={UPPER_RIGHT}
          startX={295}
          y={100}
          direction={-1}
          selectedTeeth={selectedTeeth}
          onToggleTooth={onToggleTooth}
          hoveredTooth={hoveredTooth}
          setHoveredTooth={setHoveredTooth}
          color={color}
          interactive={interactive}
          isUpper
        />
        <ToothRow
          teeth={UPPER_LEFT}
          startX={305}
          y={100}
          direction={1}
          selectedTeeth={selectedTeeth}
          onToggleTooth={onToggleTooth}
          hoveredTooth={hoveredTooth}
          setHoveredTooth={setHoveredTooth}
          color={color}
          interactive={interactive}
          isUpper
        />

        {/* Lower arch */}
        <ToothRow
          teeth={LOWER_RIGHT}
          startX={295}
          y={250}
          direction={-1}
          selectedTeeth={selectedTeeth}
          onToggleTooth={onToggleTooth}
          hoveredTooth={hoveredTooth}
          setHoveredTooth={setHoveredTooth}
          color={color}
          interactive={interactive}
          isUpper={false}
        />
        <ToothRow
          teeth={LOWER_LEFT}
          startX={305}
          y={250}
          direction={1}
          selectedTeeth={selectedTeeth}
          onToggleTooth={onToggleTooth}
          hoveredTooth={hoveredTooth}
          setHoveredTooth={setHoveredTooth}
          color={color}
          interactive={interactive}
          isUpper={false}
        />

        {/* Annotation points */}
        {points.map((point) => (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredPoint === point.id ? 8 : 6}
              fill={point.color || color}
              stroke="white"
              strokeWidth="2"
              style={{ cursor: interactive ? 'pointer' : 'default', transition: 'r 150ms' }}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e) => {
                e.stopPropagation()
                if (interactive && onRemovePoint) onRemovePoint(point.id)
              }}
            />
          </g>
        ))}

        {/* Hovered tooth tooltip */}
        {hoveredTooth && (
          <text
            x="300"
            y="210"
            textAnchor="middle"
            fontSize="11"
            fill="hsl(210 80% 55% / 0.6)"
            fontWeight="500"
          >
            #{hoveredTooth} — {TOOTH_NAMES[hoveredTooth] || ''}
          </text>
        )}
      </svg>
      {interactive && (
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
          Click teeth to select. Click empty area to place annotation points.
        </p>
      )}
    </div>
  )
}

function ToothRow({
  teeth,
  startX,
  y,
  direction,
  selectedTeeth,
  onToggleTooth,
  hoveredTooth,
  setHoveredTooth,
  color,
  interactive,
  isUpper
}: {
  teeth: string[]
  startX: number
  y: number
  direction: 1 | -1
  selectedTeeth: string[]
  onToggleTooth?: (id: string) => void
  hoveredTooth: string | null
  setHoveredTooth: (id: string | null) => void
  color: string
  interactive: boolean
  isUpper: boolean
}): React.JSX.Element {
  let currentX = startX

  return (
    <g>
      {teeth.map((toothId) => {
        const w = getToothWidth(toothId)
        const h = getToothHeight(toothId)
        const x = direction === 1 ? currentX : currentX - w
        currentX += direction * (w + 2)
        const isSelected = selectedTeeth.includes(toothId)
        const isHovered = hoveredTooth === toothId

        return (
          <g key={toothId}>
            {/* Tooth shape */}
            <rect
              x={x}
              y={y - h / 2}
              width={w}
              height={h}
              rx={4}
              fill={
                isSelected
                  ? `${color}40`
                  : isHovered
                    ? 'hsl(210 80% 55% / 0.08)'
                    : 'hsl(210 80% 55% / 0.03)'
              }
              stroke={isSelected ? color : 'hsl(210 80% 55% / 0.2)'}
              strokeWidth={isSelected ? 2 : 1}
              style={{ cursor: interactive ? 'pointer' : 'default', transition: 'all 150ms' }}
              onMouseEnter={() => setHoveredTooth(toothId)}
              onMouseLeave={() => setHoveredTooth(null)}
              onClick={(e) => {
                e.stopPropagation()
                if (interactive && onToggleTooth) onToggleTooth(toothId)
              }}
            />
            {/* Root indicator for upper teeth (lines going up) */}
            {isUpper && (
              <line
                x1={x + w / 2}
                y1={y - h / 2}
                x2={x + w / 2}
                y2={y - h / 2 - 12}
                stroke="hsl(210 80% 55% / 0.1)"
                strokeWidth="1"
              />
            )}
            {/* Root indicator for lower teeth (lines going down) */}
            {!isUpper && (
              <line
                x1={x + w / 2}
                y1={y + h / 2}
                x2={x + w / 2}
                y2={y + h / 2 + 12}
                stroke="hsl(210 80% 55% / 0.1)"
                strokeWidth="1"
              />
            )}
            {/* Tooth number */}
            <text
              x={x + w / 2}
              y={isUpper ? y - h / 2 - 16 : y + h / 2 + 22}
              textAnchor="middle"
              fontSize="8"
              fill={isSelected ? color : 'hsl(210 80% 55% / 0.3)'}
              fontWeight={isSelected ? '600' : '400'}
            >
              {toothId}
            </text>
          </g>
        )
      })}
    </g>
  )
}
