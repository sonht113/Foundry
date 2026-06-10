export function AppLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect
        x="14"
        y="28"
        width="72"
        height="72"
        rx="12"
        transform="rotate(45 50 64)"
        fill="url(#logo-grad)"
      />
      <g
        transform="translate(36, 38)"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 1 V24" strokeWidth="4.5" />
        <path d="M0 1 H22" strokeWidth="4.5" />
        <path d="M0 12 H16" strokeWidth="4.5" />
      </g>
      <circle cx="72" cy="18" r="3" fill="#A78BFA" opacity="0.85" />
    </svg>
  );
}
