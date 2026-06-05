export function KanbanThumbnail() {
  return (
    <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-3 shadow-lg shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/80">
      <svg
        viewBox="0 0 720 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
      >
        <rect x="0" y="0" width="720" height="340" rx="8" fill="#09090b" />

        <rect x="0" y="0" width="720" height="32" rx="8" fill="#18181b" />
        <rect x="0" y="24" width="720" height="8" fill="#18181b" />
        <circle cx="16" cy="16" r="5" fill="#ef4444" />
        <circle cx="31" cy="16" r="5" fill="#f59e0b" />
        <circle cx="46" cy="16" r="5" fill="#22c55e" />

        <rect x="12" y="42" width="228" height="288" rx="8" fill="#18181b" />
        <rect x="12" y="42" width="228" height="4" rx="2" fill="#6366f1" />
        <text x="24" y="60" fill="#a1a1aa" fontFamily="sans-serif" fontSize="11" fontWeight="600">
          icon Todo
        </text>
        <rect x="168" y="48" width="14" height="14" rx="3" fill="#27272a" />
        <rect x="170" y="50" width="10" height="10" rx="2" fill="#6366f1" />

        <rect x="18" y="72" width="216" height="66" rx="6" fill="#27272a" />
        <rect x="26" y="80" width="8" height="8" rx="3" fill="#f87171" />
        <rect x="38" y="80" width="160" height="8" rx="3" fill="#d4d4d8" opacity="0.7" />
        <rect x="26" y="96" width="180" height="5" rx="2.5" fill="#52525b" />
        <rect x="26" y="106" width="120" height="5" rx="2.5" fill="#52525b" />
        <rect x="26" y="116" width="60" height="5" rx="2.5" fill="#52525b" />
        <rect x="180" y="126" width="46" height="16" rx="4" fill="#ef4444" opacity="0.15" />
        <rect x="182" y="130" width="42" height="8" rx="3" fill="#fca5a5" />
        <text x="185" y="137" fill="#ef4444" fontFamily="sans-serif" fontSize="7" fontWeight="600">
          high
        </text>

        <rect x="18" y="144" width="216" height="52" rx="6" fill="#27272a" />
        <rect x="26" y="152" width="8" height="8" rx="3" fill="#fbbf24" />
        <rect x="38" y="152" width="140" height="8" rx="3" fill="#d4d4d8" opacity="0.7" />
        <rect x="26" y="168" width="160" height="5" rx="2.5" fill="#52525b" />
        <rect x="26" y="178" width="100" height="5" rx="2.5" fill="#52525b" />

        <rect x="18" y="202" width="216" height="44" rx="6" fill="#27272a" />
        <rect x="26" y="210" width="8" height="8" rx="3" fill="#22c55e" />
        <rect x="38" y="210" width="130" height="8" rx="3" fill="#d4d4d8" opacity="0.7" />
        <rect x="26" y="226" width="110" height="5" rx="2.5" fill="#52525b" />

        <rect x="246" y="42" width="228" height="288" rx="8" fill="#18181b" />
        <rect x="246" y="42" width="228" height="4" rx="2" fill="#f59e0b" />
        <text x="258" y="60" fill="#a1a1aa" fontFamily="sans-serif" fontSize="11" fontWeight="600">
          icon In Progress
        </text>
        <rect x="358" y="48" width="14" height="14" rx="3" fill="#27272a" />
        <rect x="360" y="50" width="10" height="10" rx="2" fill="#f59e0b" />

        <rect x="252" y="72" width="216" height="78" rx="6" fill="#27272a" />
        <rect x="260" y="80" width="8" height="8" rx="3" fill="#38bdf8" />
        <rect x="272" y="80" width="150" height="8" rx="3" fill="#d4d4d8" opacity="0.7" />
        <rect x="260" y="96" width="180" height="5" rx="2.5" fill="#52525b" />
        <rect x="260" y="106" width="170" height="5" rx="2.5" fill="#52525b" />
        <rect x="260" y="116" width="90" height="5" rx="2.5" fill="#52525b" />
        <rect x="260" y="128" width="14" height="14" rx="3" fill="#3b82f6" opacity="0.2" />
        <rect x="260" y="128" width="14" height="14" rx="7" fill="#3b82f6" />
        <text x="268" y="138" fill="#93c5fd" fontFamily="sans-serif" fontSize="7">
          D
        </text>
        <rect x="278" y="128" width="18" height="18" rx="4" fill="#6366f1" opacity="0.15" />

        <rect x="252" y="156" width="216" height="44" rx="6" fill="#27272a" />
        <rect x="260" y="164" width="8" height="8" rx="3" fill="#a78bfa" />
        <rect x="272" y="164" width="120" height="8" rx="3" fill="#d4d4d8" opacity="0.7" />
        <rect x="260" y="180" width="140" height="5" rx="2.5" fill="#52525b" />

        <rect x="480" y="42" width="228" height="288" rx="8" fill="#18181b" />
        <rect x="480" y="42" width="228" height="4" rx="2" fill="#22c55e" />
        <text x="492" y="60" fill="#a1a1aa" fontFamily="sans-serif" fontSize="11" fontWeight="600">
          icon Done
        </text>
        <rect x="580" y="48" width="14" height="14" rx="3" fill="#27272a" />
        <rect x="582" y="50" width="10" height="10" rx="2" fill="#22c55e" />

        <rect x="486" y="72" width="216" height="52" rx="6" fill="#27272a" />
        <rect x="494" y="80" width="8" height="8" rx="3" fill="#22c55e" />
        <rect x="506" y="80" width="140" height="8" rx="3" fill="#d4d4d8" opacity="0.5" />
        <rect x="494" y="96" width="130" height="5" rx="2.5" fill="#52525b" opacity="0.5" />
        <rect x="494" y="106" width="160" height="5" rx="2.5" fill="#52525b" opacity="0.5" />
        <line x1="494" y1="76" x2="702" y2="122" stroke="#27272a" strokeWidth="1" />

        <rect x="486" y="130" width="216" height="66" rx="6" fill="#27272a" />
        <rect x="494" y="138" width="8" height="8" rx="3" fill="#22c55e" />
        <rect x="506" y="138" width="160" height="8" rx="3" fill="#d4d4d8" opacity="0.5" />
        <rect x="494" y="154" width="180" height="5" rx="2.5" fill="#52525b" opacity="0.5" />
        <rect x="494" y="164" width="120" height="5" rx="2.5" fill="#52525b" opacity="0.5" />
        <rect x="494" y="174" width="100" height="5" rx="2.5" fill="#52525b" opacity="0.5" />
        <rect x="494" y="184" width="14" height="14" rx="3" fill="#22c55e" opacity="0.2" />
        <path d="M496 191 L498 194 L504 187" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="494" y1="134" x2="702" y2="194" stroke="#27272a" strokeWidth="1" />

        <rect x="18" y="256" width="216" height="60" rx="6" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 3" />
        <text x="88" y="292" fill="#52525b" fontFamily="sans-serif" fontSize="10" textAnchor="middle">
          + Add Column
        </text>

        <rect x="12" y="322" width="60" height="12" rx="6" fill="#27272a" />
        <rect x="76" y="322" width="48" height="12" rx="6" fill="#1c1917" />
        <rect x="128" y="322" width="36" height="12" rx="6" fill="#1c1917" />
        <rect x="620" y="322" width="12" height="12" rx="3" fill="#27272a" />
        <rect x="636" y="322" width="12" height="12" rx="3" fill="#27272a" />
        <rect x="652" y="322" width="12" height="12" rx="3" fill="#27272a" />
        <rect x="668" y="322" width="12" height="12" rx="3" fill="#27272a" />
        <rect x="684" y="322" width="12" height="12" rx="3" fill="#27272a" />
        <rect x="700" y="322" width="12" height="12" rx="3" fill="#27272a" />

        <rect x="130" y="302" width="460" height="4" rx="2" fill="#1c1917" />
        <rect x="590" y="12" width="120" height="8" rx="4" fill="#27272a" />
      </svg>
    </div>
  );
}
