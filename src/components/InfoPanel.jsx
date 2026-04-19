const algoInfo = {
  incremental: {
    name: "Inkrementalni algoritam",
    complexity: "O(n²)",
    description:
      "Gradi konveksni omotač dodavanjem tačaka jednu po jednu. Za svaku novu tačku pronalazi vidljive plohe i horizont, briše vidljive plohe i kreira nove spajanjem horizonta sa novom tačkom.",
    steps: [
      "Pronađi 4 nekoplanarne tačke i formiraj tetraedar",
      "Za svaku preostalu tačku pronađi vidljive plohe",
      "Pronađi horizont — granicu vidljivog i nevidljivog dijela",
      "Obriši vidljive plohe i dodaj nove prema horizontu",
    ],
  },
  gift: {
    name: "Gift Wrapping (Jarvis March)",
    complexity: "O(nh)",
    description:
      "Analogno omotavanju poklona papirom — za svaku ivicu trenutnog omotača pronalazi tačku koja formira najmanju diedralnu plohu. Efikasan kada je broj ploha omotača h mali.",
    steps: [
      "Počni od najniže tačke kao sigurnog tjemena omotača",
      "Za svaku ivicu pronađi tačku s najmanjim diedralnim kutom",
      "Dodaj novu plohu i stavi nove ivice u red za obradu",
      "Ponavljaj dok sve ivice nisu obrađene",
    ],
  },
  quickhull: {
    name: "Quickhull 3D",
    complexity: "O(n log n)",
    description:
      "Dijeli i vladaj pristup sličan Quicksort algoritmu. Počinje od ekstremnih tačaka, zatim rekurzivno pronalazi najudaljenije tačke od svake plohe i proširuje omotač.",
    steps: [
      "Pronađi ekstremne tačke po svim osama",
      "Formiraj početni poliedar od ekstremnih tačaka",
      "Za svaku plohu pronađi najudaljeniju tačku",
      "Dodaj tačku i zamijeni vidljive plohe novima",
    ],
  },
};

export default function InfoPanel({ algorithm, step, stats, points }) {
  const info = algoInfo[algorithm] || null;

  const fmtTime = (ms) => {
    if (ms === null || ms === undefined) return "—";
    if (ms < 0.1) return "< 0.1 ms";
    if (ms < 1) return `${ms.toFixed(2)} ms`;
    return `${ms.toFixed(1)} ms`;
  };

  const fmtCoord = (v) => v.toFixed(3);

  const getPointCoords = (idx) => {
    if (idx === null || idx === undefined || !points || !points[idx]) { return null; }
    const [x, y, z] = points[idx];
    return `(${fmtCoord(x)}, ${fmtCoord(y)}, ${fmtCoord(z)})`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

      {/* Opis algoritma */}
      {info ? (
        <div style={sectionStyle}>
          <div style={labelStyle}>Algoritam</div>
          <div style={{ fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>
            {info.name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            Složenost: <span style={{ fontWeight: "500" }}>{info.complexity}</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "10px" }}>
            {info.description}
          </div>
          <div style={labelStyle}>Koraci algoritma</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {info.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                <span style={{
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "var(--color-background-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "500",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ lineHeight: "1.5" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={sectionStyle}>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            Odaberi algoritam da vidiš opis.
          </div>
        </div>
      )}

      {/* Trenutni korak */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Trenutni korak</div>
        {step ? (
          <div style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            lineHeight: "1.6",
            padding: "8px",
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            borderLeft: "2px solid var(--color-border-info)",
          }}>
            {step.desc}
            {step.activePoint !== null && step.activePoint !== undefined && getPointCoords(step.activePoint) && (
              <div style={{
                marginTop: "6px",
                paddingTop: "6px",
                borderTop: "1px solid var(--color-border-tertiary)",
                fontFamily: "monospace",
                fontSize: "11px",
              }}>
                <span style={{ color: "#f5a623", fontWeight: "600" }}>P{step.activePoint}</span>
                <span style={{ color: "var(--color-text-tertiary)" }}> = {getPointCoords(step.activePoint)}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            Generiši tačke i pokreni algoritam.
          </div>
        )}
      </div>

      {/* Statistike */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Statistike</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {[
            { label: "Tačke", value: stats.numPoints, accent: false },
            { label: "Tjemena", value: stats.numVerts, accent: true },
            { label: "Plohe", value: stats.numFaces, accent: true },
            { label: "Ivice", value: stats.numEdges, accent: true },
            { label: "Unutar", value: stats.numInside, accent: false },
            { label: "Računanje", value: fmtTime(stats.execTime), accent: false },
          ].map((item) => (
            <div key={item.label} style={{
              padding: "10px 8px",
              background: item.accent && item.value ? "var(--color-accent-dim)" : "var(--color-background-tertiary)",
              borderRadius: "var(--border-radius-md)",
              textAlign: "center",
              border: item.accent && item.value ? "1px solid var(--color-accent-border)" : "1px solid var(--color-border-tertiary)",
            }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: item.accent && item.value ? "var(--color-text-info)" : "var(--color-text-primary)" }}>
                {item.value ?? "—"}
              </div>
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
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const sectionStyle = {
  borderTop: "1px solid var(--color-border-tertiary)",
  padding: "14px 0",
};