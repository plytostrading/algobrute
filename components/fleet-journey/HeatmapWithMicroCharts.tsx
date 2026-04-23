'use client';

export interface HeatmapCell {
  rowKey: string;
  colKey: string;
  intensity: number;
  microValues?: number[];
  tooltipContent?: string;
  label?: string;
}

interface HeatmapWithMicroChartsProps {
  cells: HeatmapCell[];
  rowLabels: string[];
  colLabels: string[];
  intensityRange?: [number, number];
  rowHeader?: string;
  colHeader?: string;
}

/**
 * Dense heatmap where each cell contains both (a) a background-intensity
 * encoding the primary metric AND (b) an embedded micro-bar-chart encoding
 * a secondary series. Used for strategy × regime attribution and similar
 * 2D breakdowns where you want to see two dimensions of information per cell.
 */
export function HeatmapWithMicroCharts({
  cells,
  rowLabels,
  colLabels,
  intensityRange,
  rowHeader,
  colHeader,
}: HeatmapWithMicroChartsProps) {
  const byKey = new Map<string, HeatmapCell>();
  cells.forEach((c) => byKey.set(`${c.rowKey}::${c.colKey}`, c));

  const values = cells.map((c) => c.intensity);
  const [vMin, vMax] = intensityRange ?? [
    Math.min(0, ...values),
    Math.max(0, ...values) || 1,
  ];
  const span = vMax - vMin || 1;

  const toBgColor = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - vMin) / span));
    // Negative values = red, positive = green; neutral span = gray
    if (vMin < 0 && vMax > 0) {
      const zeroT = (0 - vMin) / span;
      if (t < zeroT) {
        const alpha = (1 - t / zeroT) * 0.5;
        return `rgba(239,68,68,${alpha.toFixed(3)})`;
      } else {
        const alpha = ((t - zeroT) / (1 - zeroT)) * 0.5;
        return `rgba(34,197,94,${alpha.toFixed(3)})`;
      }
    }
    return `rgba(59,130,246,${(t * 0.5).toFixed(3)})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-1 text-right align-bottom text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {rowHeader ?? ''}
            </th>
            {colLabels.map((c) => (
              <th
                key={c}
                className="px-1 py-1 text-center text-[10px] font-mono text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
          {colHeader && (
            <tr>
              <th colSpan={colLabels.length + 1} className="pb-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                {colHeader}
              </th>
            </tr>
          )}
        </thead>
        <tbody>
          {rowLabels.map((r) => (
            <tr key={r}>
              <td className="px-2 py-1 text-right font-mono text-[10px] text-muted-foreground">
                {r}
              </td>
              {colLabels.map((c) => {
                const cell = byKey.get(`${r}::${c}`);
                const bg = cell ? toBgColor(cell.intensity) : 'transparent';
                const microMax = cell?.microValues && cell.microValues.length > 0
                  ? Math.max(1, ...cell.microValues.map(Math.abs))
                  : 1;
                return (
                  <td
                    key={c}
                    className="border border-border p-0"
                    title={cell?.tooltipContent}
                    style={{ backgroundColor: bg, minWidth: 54 }}
                  >
                    <div className="flex flex-col gap-0.5 p-1">
                      <div className="text-center font-mono text-[10px] font-semibold text-foreground">
                        {cell?.label ?? '—'}
                      </div>
                      {cell?.microValues && cell.microValues.length > 0 && (
                        <svg
                          width="100%"
                          height="14"
                          preserveAspectRatio="none"
                          viewBox={`0 0 ${cell.microValues.length} ${microMax * 2}`}
                        >
                          {cell.microValues.map((v, i) => {
                            const val = Math.abs(v);
                            const color = v < 0 ? '#ef4444' : '#10b981';
                            return (
                              <rect
                                key={i}
                                x={i + 0.05}
                                y={microMax - (v < 0 ? 0 : val)}
                                width={0.9}
                                height={val}
                                fill={color}
                              />
                            );
                          })}
                        </svg>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
