export default function StatBar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="statbar">
      <div className="statbar-label">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="statbar-track">
        <div className="statbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
