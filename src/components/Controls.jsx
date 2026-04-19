export default function Controls({
  numPoints,
  onNumPointsChange,
  onGenerate,
  onReset,
  algorithm,
  onAlgorithmChange,
  onPrev,
  onNext,
  onTogglePlay,
  isPlaying,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
  hasPoints,
}) {
  const algorithms = [
    { id: "incremental", label: "Inkrementalni" },
    { id: "gift", label: "Gift Wrapping" },
    { id: "quickhull", label: "Quickhull" },
  ];

  const canPlay = hasPoints && totalSteps > 0 && currentStep < totalSteps - 1;
  const canNext = hasPoints && totalSteps > 0 && currentStep < totalSteps - 1;
  const canPrev = hasPoints && totalSteps > 0 && currentStep > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Algoritam */}
      <div>
        <div style={labelStyle}>Algoritam</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {algorithms.map((a) => (
            <button
              key={a.id}
              onClick={() => onAlgorithmChange(a.id)}
              style={{
                ...btnStyle,
                fontWeight: algorithm === a.id ? "600" : "400",
                background: algorithm === a.id ? "var(--color-accent-dim)" : "var(--color-background-secondary)",
                borderColor: algorithm === a.id ? "var(--color-accent-border)" : "var(--color-border-secondary)",
                color: algorithm === a.id ? "var(--color-text-info)" : "var(--color-text-secondary)",
                boxShadow: algorithm === a.id ? "0 0 0 1px var(--color-accent-border) inset" : "none",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tacke */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Broj tačaka: {numPoints}</div>
        <input
          type="range"
          min="6"
          max="40"
          value={numPoints}
          onChange={(e) => onNumPointsChange(parseInt(e.target.value))}
          style={{ width: "100%", marginBottom: "6px" }}
        />
        <button onClick={onGenerate} style={{ ...btnStyle, width: "100%", marginBottom: "6px", background: "var(--color-accent-dim)", borderColor: "var(--color-accent-border)", color: "var(--color-text-info)", fontWeight: "500" }}>
          Generiši tačke
        </button>
        <button
          onClick={onReset}
          disabled={!hasPoints}
          style={{ ...btnStyle, width: "100%", color: hasPoints ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" }}
        >
          Resetuj
        </button>
      </div>

      {/* Izvođenje */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Izvođenje</div>
        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          <button onClick={onPrev} disabled={!canPrev} style={{ ...btnStyle, flex: 1, fontSize: "14px", padding: "5px 0" }}>
            ‹
          </button>
          <button onClick={onTogglePlay} disabled={!canPlay} style={{ ...btnStyle, flex: 2, background: isPlaying ? "rgba(251,191,36,0.1)" : "var(--color-accent-dim)", borderColor: isPlaying ? "rgba(251,191,36,0.4)" : "var(--color-accent-border)", color: isPlaying ? "#fbbf24" : "var(--color-text-info)", fontWeight: "500" }}>
            {isPlaying ? "⏸  Pauza" : "▶  Play"}
          </button>
          <button onClick={onNext} disabled={!canNext} style={{ ...btnStyle, flex: 1, fontSize: "14px", padding: "5px 0" }}>
            ›
          </button>
        </div>
        <div style={labelStyle}>Brzina animacije</div>
        <input
          type="range"
          min="200"
          max="2000"
          step="100"
          value={speed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
          <span>Brzo</span>
          <span>Sporo</span>
        </div>
      </div>

      {/* Korak */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Napredak</div>
        <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
          {totalSteps > 0 ? `Korak ${currentStep + 1} / ${totalSteps}` : "—"}
        </div>
        {totalSteps > 0 && (
          <div style={{ marginTop: "6px", height: "3px", background: "var(--color-border-secondary)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                background: "linear-gradient(90deg, var(--color-accent), #60a5fa)",
                borderRadius: "2px",
                transition: "width 0.2s",
                boxShadow: "0 0 6px rgba(59,130,246,0.6)",
              }}
            />
          </div>
        )}
      </div>

      {/* Legenda */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Legenda</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {[
            { color: "#3b82f6", label: "Tacke skupa" },
            { color: "#ea580c", label: "Aktivna tacka" },
            { color: "#16a34a", label: "Tjeme omotaca" },
            { color: "rgba(59,130,246,0.16)", label: "Plohe omotaca", border: "1px solid #3b82f6" },
            { color: "#0ea5e9", label: "Posljednje dodane plohe", isLine: true },
            { color: "rgba(239,68,68,0.28)", label: "Vidljive plohe (brisu se)", border: "1px solid #ef4444" },
            { color: "#d97706", label: "Horizont", isLine: true },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {item.isLine ? (
                <div style={{ width: "14px", height: "3px", background: item.color, flexShrink: 0 }} />
              ) : (
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, border: item.border, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

const labelStyle = {
  fontSize: "10px",
  fontWeight: "600",
  color: "var(--color-text-tertiary)",
  marginBottom: "7px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const sectionStyle = {
  borderTop: "1px solid var(--color-border-tertiary)",
  paddingTop: "14px",
};

const btnStyle = {
  fontSize: "12px",
  padding: "6px 8px",
  borderRadius: "var(--border-radius-md)",
  cursor: "pointer",
  textAlign: "center",
  border: "1px solid var(--color-border-secondary)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-secondary)",
  transition: "all 0.15s",
};