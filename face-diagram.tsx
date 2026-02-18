import { useState, useCallback } from 'react'

interface InjectionPoint {
  id: string
  x: number
  y: number
  label?: string
  color?: string
}

interface FaceDiagramProps {
  view: 'front' | 'left' | 'right' | 'three_quarter'
  points: InjectionPoint[]
  onAddPoint?: (x: number, y: number) => void
  onRemovePoint?: (id: string) => void
  color?: string
  interactive?: boolean
}

const VIEW_LABELS = {
  front: 'Front View',
  left: 'Left Profile',
  right: 'Right Profile',
  three_quarter: '3/4 View'
}

export function FaceDiagram({
  view,
  points,
  onAddPoint,
  onRemovePoint,
  color = '#3B82F6',
  interactive = true
}: FaceDiagramProps): React.JSX.Element {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!interactive || !onAddPoint) return
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 400
      const y = ((e.clientY - rect.top) / rect.height) * 500
      onAddPoint(Math.round(x), Math.round(y))
    },
    [interactive, onAddPoint]
  )

  return (
    <div className="relative">
      <p className="text-[11px] font-medium text-muted-foreground/70 text-center mb-1">
        {VIEW_LABELS[view]}
      </p>
      <svg
        viewBox="0 0 400 500"
        className={`w-full max-w-[280px] mx-auto ${interactive ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
      >
        {/* Background */}
        <rect width="400" height="500" fill="transparent" />

        {/* Face outline based on view */}
        {view === 'front' && <FrontFace />}
        {view === 'left' && <LeftProfile />}
        {view === 'right' && <RightProfile />}
        {view === 'three_quarter' && <ThreeQuarterFace />}

        {/* Injection points */}
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
            {hoveredPoint === point.id && point.label && (
              <text
                x={point.x}
                y={point.y - 14}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="500"
              >
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      {interactive && (
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
          Click to place points. Click a point to remove.
        </p>
      )}
    </div>
  )
}

// Simplified anatomical face outlines as SVG paths

function FrontFace(): React.JSX.Element {
  return (
    <g stroke="hsl(210 80% 55% / 0.3)" strokeWidth="1.5" fill="none">
      {/* Head outline */}
      <ellipse cx="200" cy="220" rx="120" ry="160" />
      {/* Hairline */}
      <path d="M 100 140 Q 150 80 200 70 Q 250 80 300 140" strokeDasharray="4 3" />
      {/* Eyebrows */}
      <path d="M 130 190 Q 155 175 180 185" strokeWidth="2" />
      <path d="M 220 185 Q 245 175 270 190" strokeWidth="2" />
      {/* Eyes */}
      <ellipse cx="160" cy="210" rx="22" ry="10" />
      <ellipse cx="240" cy="210" rx="22" ry="10" />
      <circle cx="160" cy="210" r="5" fill="hsl(210 80% 55% / 0.15)" />
      <circle cx="240" cy="210" r="5" fill="hsl(210 80% 55% / 0.15)" />
      {/* Nose */}
      <path d="M 200 200 L 200 260 Q 185 275 178 268" />
      <path d="M 200 260 Q 215 275 222 268" />
      {/* Mouth */}
      <path d="M 170 310 Q 185 298 200 300 Q 215 298 230 310" />
      <path d="M 170 310 Q 200 330 230 310" />
      {/* Jaw / chin */}
      <path d="M 100 260 Q 110 340 160 370 Q 200 390 240 370 Q 290 340 300 260" strokeDasharray="4 3" />
      {/* Muscle regions - subtle guidelines */}
      <line x1="120" y1="170" x2="280" y2="170" strokeDasharray="2 4" opacity="0.3" />
      <text x="200" y="165" textAnchor="middle" fontSize="9" fill="hsl(210 80% 55% / 0.25)">Frontalis</text>
      <text x="200" y="195" textAnchor="middle" fontSize="9" fill="hsl(210 80% 55% / 0.25)">Glabella</text>
      <text x="115" y="215" textAnchor="middle" fontSize="8" fill="hsl(210 80% 55% / 0.2)">Crow&apos;s Feet</text>
      <text x="285" y="215" textAnchor="middle" fontSize="8" fill="hsl(210 80% 55% / 0.2)">Crow&apos;s Feet</text>
    </g>
  )
}

function LeftProfile(): React.JSX.Element {
  return (
    <g stroke="hsl(210 80% 55% / 0.3)" strokeWidth="1.5" fill="none">
      {/* Head profile outline */}
      <path d="M 250 70 Q 180 60 150 100 Q 120 150 120 200 Q 120 260 130 300 Q 140 340 180 370 Q 200 385 210 380 L 220 360 Q 230 340 225 320 L 240 310 Q 260 295 260 280 L 250 270 Q 240 250 240 240 L 250 230 Q 260 220 260 210 Q 260 200 250 195 L 240 190 Q 250 175 250 160 Q 250 140 260 120 Q 270 90 250 70" />
      {/* Eye */}
      <path d="M 235 210 Q 245 205 255 210 Q 245 215 235 210" />
      {/* Eyebrow */}
      <path d="M 230 195 Q 245 185 260 195" strokeWidth="2" />
      {/* Nose */}
      <path d="M 260 210 L 280 250 Q 275 265 260 270" />
      {/* Mouth */}
      <path d="M 245 310 Q 255 305 260 310 Q 255 315 245 312" />
      {/* Ear */}
      <path d="M 155 190 Q 140 200 138 220 Q 140 240 155 250" />
      {/* Muscle labels */}
      <text x="200" y="165" textAnchor="middle" fontSize="9" fill="hsl(210 80% 55% / 0.25)">Frontalis</text>
      <text x="170" y="220" textAnchor="middle" fontSize="8" fill="hsl(210 80% 55% / 0.2)">Temporal</text>
    </g>
  )
}

function RightProfile(): React.JSX.Element {
  return (
    <g stroke="hsl(210 80% 55% / 0.3)" strokeWidth="1.5" fill="none" transform="translate(400,0) scale(-1,1)">
      {/* Mirror of left profile */}
      <path d="M 250 70 Q 180 60 150 100 Q 120 150 120 200 Q 120 260 130 300 Q 140 340 180 370 Q 200 385 210 380 L 220 360 Q 230 340 225 320 L 240 310 Q 260 295 260 280 L 250 270 Q 240 250 240 240 L 250 230 Q 260 220 260 210 Q 260 200 250 195 L 240 190 Q 250 175 250 160 Q 250 140 260 120 Q 270 90 250 70" />
      <path d="M 235 210 Q 245 205 255 210 Q 245 215 235 210" />
      <path d="M 230 195 Q 245 185 260 195" strokeWidth="2" />
      <path d="M 260 210 L 280 250 Q 275 265 260 270" />
      <path d="M 245 310 Q 255 305 260 310 Q 255 315 245 312" />
      <path d="M 155 190 Q 140 200 138 220 Q 140 240 155 250" />
    </g>
  )
}

function ThreeQuarterFace(): React.JSX.Element {
  return (
    <g stroke="hsl(210 80% 55% / 0.3)" strokeWidth="1.5" fill="none">
      {/* 3/4 face outline - slightly turned */}
      <path d="M 230 70 Q 170 65 140 100 Q 110 150 110 210 Q 115 270 130 310 Q 145 350 185 375 Q 210 390 225 375 L 235 355 Q 240 335 235 320 L 250 305 Q 270 290 275 270 L 265 255 Q 255 240 260 230 Q 270 215 275 205 Q 275 195 265 190 Q 275 175 275 160 Q 275 130 280 110 Q 290 80 270 65 Q 250 60 230 70" />
      {/* Eye (near) */}
      <ellipse cx="175" cy="210" rx="20" ry="10" />
      {/* Eye (far, smaller) */}
      <ellipse cx="255" cy="208" rx="12" ry="8" />
      {/* Eyebrows */}
      <path d="M 145 195 Q 170 180 195 190" strokeWidth="2" />
      <path d="M 240 190 Q 255 183 270 190" strokeWidth="2" />
      {/* Nose */}
      <path d="M 225 200 L 240 255 Q 235 270 225 265" />
      {/* Mouth */}
      <path d="M 180 310 Q 200 300 220 305 Q 230 305 240 310" />
      <path d="M 180 310 Q 210 325 240 310" />
      {/* Ear */}
      <path d="M 115 190 Q 100 205 100 225 Q 105 245 115 255" />
      {/* Labels */}
      <text x="200" y="165" textAnchor="middle" fontSize="9" fill="hsl(210 80% 55% / 0.25)">Frontalis</text>
      <text x="215" y="195" textAnchor="middle" fontSize="9" fill="hsl(210 80% 55% / 0.25)">Glabella</text>
    </g>
  )
}

// Tab component for switching views
export function DiagramViewTabs({
  activeView,
  onChangeView,
  context = 'facial'
}: {
  activeView: string
  onChangeView: (view: string) => void
  context?: 'facial' | 'dental'
}): React.JSX.Element {
  const facialViews: { key: string; label: string }[] = [
    { key: 'front', label: 'Front' },
    { key: 'left', label: 'Left' },
    { key: 'right', label: 'Right' },
    { key: 'three_quarter', label: '3/4' }
  ]

  const dentalViews: { key: string; label: string }[] = [
    { key: 'tooth_chart', label: 'Tooth Chart' },
    { key: 'arch_zones', label: 'Arch Zones' }
  ]

  const views = context === 'dental' ? dentalViews : facialViews

  return (
    <div className="flex items-center gap-1 bg-surface-1/50 rounded-lg p-0.5">
      {views.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onChangeView(v.key)}
          className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
            activeView === v.key
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
