import React from 'react'

interface AloraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { icon: 22, text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 30, text: 'text-xl', gap: 'gap-2' },
  lg: { icon: 38, text: 'text-3xl', gap: 'gap-2.5' },
  xl: { icon: 48, text: 'text-4xl', gap: 'gap-3' },
}

const AloraLogo: React.FC<AloraLogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const s = SIZES[size]

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Charcoal base */}
        <rect x="1.25" y="1.25" width="45.5" height="45.5" rx="10.75" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="2.5" />

        {/* Terra "A" — stacked geometric construction */}
        {/* Outer triangle */}
        <path
          d="M24 8L38 38H10L24 8Z"
          fill="#c44b2b"
        />

        {/* Inner cut-out triangle (creates the hollow A) */}
        <path
          d="M24 18L31 34H17L24 18Z"
          fill="#1a1a1a"
        />

        {/* Crossbar — cream colored, sits across the A */}
        <rect x="15" y="28" width="18" height="4" rx="1" fill="#f5f0e8" />

        {/* Apex dot — sun accent */}
        <circle cx="24" cy="11" r="2" fill="#FFD43B" />
      </svg>
      {showText && (
        <span className={`font-display font-bold tracking-tight ${s.text}`}>
          Alora
        </span>
      )}
    </span>
  )
}

export default AloraLogo
