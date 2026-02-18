import { useState } from 'react'

interface ArchZoneDiagramProps {
  selectedZones: string[]
  onToggleZone?: (zoneId: string) => void
  color?: string
  interactive?: boolean
}

interface ZoneDefinition {
  id: string
  label: string
  shortLabel: string
  path: string
}

// Upper arch zones
const UPPER_ZONES: ZoneDefinition[] = [
  {
    id: 'upper_right_molars',
    label: 'Upper Right Molars',
    shortLabel: 'UR Mol',
    path: 'M 50 180 Q 55 140 80 110 L 130 120 Q 105 145 100 180 Z'
  },
  {
    id: 'upper_right_premolars',
    label: 'Upper Right Premolars',
    shortLabel: 'UR Pre',
    path: 'M 100 180 Q 105 145 130 120 L 170 135 Q 145 155 140 180 Z'
  },
  {
    id: 'upper_anteriors',
    label: 'Upper Anteriors',
    shortLabel: 'UA',
    path: 'M 140 180 Q 145 155 170 135 L 200 130 L 230 135 Q 255 155 260 180 Z'
  },
  {
    id: 'upper_left_premolars',
    label: 'Upper Left Premolars',
    shortLabel: 'UL Pre',
    path: 'M 260 180 Q 255 155 230 135 L 270 120 Q 295 145 300 180 Z'
  },
  {
    id: 'upper_left_molars',
    label: 'Upper Left Molars',
    shortLabel: 'UL Mol',
    path: 'M 300 180 Q 295 145 270 120 L 320 110 Q 345 140 350 180 Z'
  }
]

// Lower arch zones
const LOWER_ZONES: ZoneDefinition[] = [
  {
    id: 'lower_right_molars',
    label: 'Lower Right Molars',
    shortLabel: 'LR Mol',
    path: 'M 60 220 Q 65 260 90 285 L 135 275 Q 110 255 105 220 Z'
  },
  {
    id: 'lower_right_premolars',
    label: 'Lower Right Premolars',
    shortLabel: 'LR Pre',
    path: 'M 105 220 Q 110 255 135 275 L 170 265 Q 150 250 145 220 Z'
  },
  {
    id: 'lower_anteriors',
    label: 'Lower Anteriors',
    shortLabel: 'LA',
    path: 'M 145 220 Q 150 250 170 265 L 200 270 L 230 265 Q 250 250 255 220 Z'
  },
  {
    id: 'lower_left_premolars',
    label: 'Lower Left Premolars',
    shortLabel: 'LL Pre',
    path: 'M 255 220 Q 250 250 230 265 L 265 275 Q 290 255 295 220 Z'
  },
  {
    id: 'lower_left_molars',
    label: 'Lower Left Molars',
    shortLabel: 'LL Mol',
    path: 'M 295 220 Q 290 255 265 275 L 310 285 Q 335 260 340 220 Z'
  }
]

const ALL_ZONES = [...UPPER_ZONES, ...LOWER_ZONES]

export function ArchZoneDiagram({
  selectedZones,
  onToggleZone,
  color = '#60A5FA',
  interactive = true
}: ArchZoneDiagramProps): React.JSX.Element {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  const hoveredDef = hoveredZone ? ALL_ZONES.find((z) => z.id === hoveredZone) : null

  return (
    <div className="relative">
      <p className="text-[11px] font-medium text-muted-foreground/70 text-center mb-1">
        Arch Zones
      </p>
      <svg
        viewBox="0 0 400 400"
        className={`w-full max-w-[360px] mx-auto ${interactive ? 'cursor-pointer' : ''}`}
      >
        {/* Background */}
        <rect width="400" height="400" fill="transparent" />

        {/* Midline */}
        <line
          x1="200"
          y1="80"
          x2="200"
          y2="320"
          stroke="hsl(210 80% 55% / 0.08)"
          strokeDasharray="4 4"
        />

        {/* Horizontal divider */}
        <line
          x1="40"
          y1="200"
          x2="360"
          y2="200"
          stroke="hsl(210 80% 55% / 0.12)"
          strokeWidth="0.5"
        />

        {/* Arch labels */}
        <text
          x="200"
          y="95"
          textAnchor="middle"
          fontSize="10"
          fill="hsl(210 80% 55% / 0.25)"
          fontWeight="500"
        >
          Upper Arch
        </text>
        <text
          x="200"
          y="315"
          textAnchor="middle"
          fontSize="10"
          fill="hsl(210 80% 55% / 0.25)"
          fontWeight="500"
        >
          Lower Arch
        </text>

        {/* Arch outlines (decorative) */}
        <path
          d="M 45 180 Q 50 100 130 80 Q 200 65 270 80 Q 350 100 355 180"
          fill="none"
          stroke="hsl(210 80% 55% / 0.08)"
          strokeWidth="1"
        />
        <path
          d="M 55 220 Q 60 300 135 315 Q 200 330 265 315 Q 340 300 345 220"
          fill="none"
          stroke="hsl(210 80% 55% / 0.08)"
          strokeWidth="1"
        />

        {/* Zone shapes */}
        {ALL_ZONES.map((zone) => {
          const isSelected = selectedZones.includes(zone.id)
          const isHovered = hoveredZone === zone.id

          return (
            <path
              key={zone.id}
              d={zone.path}
              fill={
                isSelected
                  ? `${color}35`
                  : isHovered
                    ? 'hsl(210 80% 55% / 0.08)'
                    : 'hsl(210 80% 55% / 0.03)'
              }
              stroke={isSelected ? color : 'hsl(210 80% 55% / 0.2)'}
              strokeWidth={isSelected ? 2 : 1}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'all 150ms'
              }}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={(e) => {
                e.stopPropagation()
                if (interactive && onToggleZone) onToggleZone(zone.id)
              }}
            />
          )
        })}

        {/* Zone short labels */}
        {UPPER_ZONES.map((zone, i) => {
          const xPositions = [75, 125, 200, 275, 325]
          const isSelected = selectedZones.includes(zone.id)
          return (
            <text
              key={zone.id}
              x={xPositions[i]}
              y={155}
              textAnchor="middle"
              fontSize="8"
              fill={isSelected ? color : 'hsl(210 80% 55% / 0.25)'}
              fontWeight={isSelected ? '600' : '400'}
            >
              {zone.shortLabel}
            </text>
          )
        })}
        {LOWER_ZONES.map((zone, i) => {
          const xPositions = [80, 130, 200, 270, 320]
          const isSelected = selectedZones.includes(zone.id)
          return (
            <text
              key={zone.id}
              x={xPositions[i]}
              y={250}
              textAnchor="middle"
              fontSize="8"
              fill={isSelected ? color : 'hsl(210 80% 55% / 0.25)'}
              fontWeight={isSelected ? '600' : '400'}
            >
              {zone.shortLabel}
            </text>
          )
        })}

        {/* Hover tooltip */}
        {hoveredDef && (
          <g>
            <rect
              x="100"
              y="345"
              width="200"
              height="24"
              rx="4"
              fill="hsl(210 20% 12%)"
              opacity="0.85"
            />
            <text
              x="200"
              y="361"
              textAnchor="middle"
              fontSize="11"
              fill="hsl(210 80% 70%)"
              fontWeight="500"
            >
              {hoveredDef.label}
            </text>
          </g>
        )}

        {/* Right / Left labels */}
        <text
          x="30"
          y="200"
          textAnchor="middle"
          fontSize="9"
          fill="hsl(210 80% 55% / 0.2)"
          fontWeight="500"
          transform="rotate(-90, 30, 200)"
        >
          Right
        </text>
        <text
          x="370"
          y="200"
          textAnchor="middle"
          fontSize="9"
          fill="hsl(210 80% 55% / 0.2)"
          fontWeight="500"
          transform="rotate(90, 370, 200)"
        >
          Left
        </text>
      </svg>
      {interactive && (
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
          Click zones to select treatment areas.
        </p>
      )}
    </div>
  )
}
