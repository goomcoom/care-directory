const WIDTHS = ["92%", "78%", "88%", "64%", "84%", "70%"];

export function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton-line" style={{ width: WIDTHS[i % WIDTHS.length] }} />
      ))}
    </div>
  );
}
