import { cn } from "@/lib/cn";

/** Flat warehouse / depot landmark (no caption). */
export function DepotIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <svg
        viewBox="0 0 128 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
      >
        <ellipse cx="64" cy="102" rx="52" ry="5" fill="#0A0A0A" opacity="0.1" />

        {/* main hall */}
        <path
          d="M10 52 H118 V96 H10 Z"
          fill="#F4F4F4"
          stroke="#1A1A1A"
          strokeWidth="2.4"
        />
        {/* pitched industrial roof */}
        <path
          d="M6 54 L64 22 L122 54 Z"
          fill="#E4E4E4"
          stroke="#1A1A1A"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* roof ridge highlight */}
        <path d="M64 22 L64 54" stroke="#1A1A1A" strokeWidth="1.5" opacity="0.25" />

        {/* red brand fascia */}
        <rect x="10" y="56" width="108" height="10" fill="#991211" />

        {/* loading dock bay */}
        <path d="M22 72 H58 V96 H22 Z" fill="#1A1A1A" />
        <path d="M26 76 H54 V92 H26 Z" fill="#CFCFCF" />
        <path d="M26 84 H54" stroke="#1A1A1A" strokeWidth="1.2" />

        {/* office windows */}
        <rect
          x="70"
          y="72"
          width="16"
          height="14"
          rx="1.5"
          fill="#C8DCE8"
          stroke="#1A1A1A"
          strokeWidth="1.4"
        />
        <rect
          x="92"
          y="72"
          width="16"
          height="14"
          rx="1.5"
          fill="#C8DCE8"
          stroke="#1A1A1A"
          strokeWidth="1.4"
        />

        {/* dock ramp */}
        <path d="M18 96 L22 88 H58 L62 96 Z" fill="#D8D8D8" stroke="#1A1A1A" strokeWidth="1.5" />

        {/* stacked boxes outside */}
        <rect x="100" y="84" width="14" height="12" rx="1" fill="#E5A622" stroke="#1A1A1A" strokeWidth="1.4" />
        <rect x="104" y="76" width="12" height="10" rx="1" fill="#F0C43A" stroke="#1A1A1A" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

/** Flat home landmark (no caption). */
export function HomeIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <svg
        viewBox="0 0 110 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
      >
        <ellipse cx="55" cy="94" rx="40" ry="4.5" fill="#0A0A0A" opacity="0.1" />
        <path
          d="M22 48 H88 V88 H22 Z"
          fill="#F4F4F4"
          stroke="#1A1A1A"
          strokeWidth="2.5"
        />
        <path
          d="M14 50 L55 16 L96 50 Z"
          fill="#E8E8E8"
          stroke="#1A1A1A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect
          x="72"
          y="24"
          width="12"
          height="22"
          fill="#D0D0D0"
          stroke="#1A1A1A"
          strokeWidth="2"
        />
        <path d="M46 62 H64 V88 H46 Z" fill="#991211" />
        <circle cx="60" cy="76" r="2" fill="#F4F4F4" />
        <rect
          x="28"
          y="58"
          width="14"
          height="14"
          rx="1.5"
          fill="#C8DCE8"
          stroke="#1A1A1A"
          strokeWidth="1.5"
        />
        <path d="M35 58 V72 M28 65 H42" stroke="#1A1A1A" strokeWidth="1.2" />
        <rect
          x="68"
          y="74"
          width="14"
          height="12"
          rx="1"
          fill="#E5A622"
          stroke="#1A1A1A"
          strokeWidth="1.5"
        />
        <path d="M68 78 H82" stroke="#1A1A1A" strokeWidth="1.2" />
      </svg>
    </div>
  );
}
