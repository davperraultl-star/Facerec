interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted-foreground/10 ${className}`}
    />
  )
}
