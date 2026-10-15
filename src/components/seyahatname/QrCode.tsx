import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** A QR code drawn as one SVG path, so it prints sharp at any size. */
export const QrCode: React.FC<{ value: string; size?: number; className?: string; label?: string }> = ({ value, size = 120, className, label }) => {
  const { path, count } = useMemo(() => {
    const code = qrcode(0, 'M');
    code.addData(value);
    code.make();
    const n = code.getModuleCount();
    let d = '';
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) if (code.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
    }
    return { path: d, count: n };
  }, [value]);
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${count + 4} ${count + 4}`} className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={count + 4} height={count + 4} fill="#fff" />
      <path d={path} fill="#111" />
    </svg>
  );
};
