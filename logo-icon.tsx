export function LogoIcon({ className = 'h-7 w-7' }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Solid triangle */}
      <polygon points="50,3 97,95 3,95" fill="currentColor" />
      {/* Face profile silhouette line — white cutout through the triangle */}
      <path
        d="M56 18
           C54 22, 53 25, 54 28
           C55 30, 57 31, 58 33
           C60 35, 61 38, 60 41
           L58 44
           C56 46, 55 47, 55 49
           C55 51, 56 52, 57 53
           C59 54, 61 55, 62 57
           C63 59, 63 61, 62 63
           C61 65, 59 66, 57 68
           C55 70, 54 72, 54 74
           C54 76, 55 78, 56 80
           C57 82, 57 84, 56 86
           C55 88, 53 90, 51 92"
        fill="none"
        className="stroke-background"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
