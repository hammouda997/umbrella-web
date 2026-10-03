"use client";

import { useMemo } from "react";
import { code128Svg } from "@/lib/code128";

type Props = {
  code: string;
  className?: string;
  height?: number;
};

export function ParcelBarcode({ code, className, height = 64 }: Props) {
  const svg = useMemo(() => {
    try {
      return code128Svg(code, { height, moduleWidth: 1.5, includeText: true });
    } catch {
      return null;
    }
  }, [code, height]);

  if (!svg) {
    return (
      <p className="text-center font-mono text-sm text-ops-ink/60">{code}</p>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
