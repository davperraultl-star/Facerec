interface AreaTagProps {
  name: string
  color: string | null
  units?: number | null
  cost?: number | null
  onRemove?: () => void
}

export function AreaTag({ name, color, units, cost, onRemove }: AreaTagProps): React.JSX.Element {
  const bgColor = color ? `${color}20` : 'hsl(var(--muted))'
  const textColor = color || 'hsl(var(--foreground))'
  const borderColor = color ? `${color}40` : 'hsl(var(--border))'

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color || 'currentColor' }}
      />
      {name}
      {units != null && <span className="opacity-70">{units}u</span>}
      {cost != null && <span className="opacity-70">${cost.toFixed(2)}</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 opacity-60 hover:opacity-100"
          style={{ color: textColor }}
        >
          ×
        </button>
      )}
    </span>
  )
}
