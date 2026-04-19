import { useState, useEffect, useRef, useCallback } from "react";
import Scene3D from "./components/Scene3D";
import Controls from "./components/Controls";
import InfoPanel from "./components/InfoPanel";
import { generateRandomPoints } from "./utils/geometry";
import { computeIncrementalSteps } from "./algorithms/incremental";
import { computeGiftWrappingSteps } from "./algorithms/giftWrapping";
import { computeQuickhullSteps } from "./algorithms/quickhull";

const ALGO_FN = {
  incremental: computeIncrementalSteps,
  gift: computeGiftWrappingSteps,
  quickhull: computeQuickhullSteps,
};

export default function App() {
  const [numPoints, setNumPoints] = useState(15);
  const [points, setPoints] = useState([]);
  const [algorithm, setAlgorithm] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [execTime, setExecTime] = useState(null);
  const playTimerRef = useRef(null);

  // Generisanje tacaka
  const handleGenerate = useCallback(() => {
    stopPlay();
    const pts = generateRandomPoints(numPoints);
    setPoints(pts);
    setSteps([]);
    setCurrentStep(0);
    setExecTime(null);
    if (algorithm) {
      const t0 = performance.now();
      const newSteps = ALGO_FN[algorithm](pts);
      setExecTime(performance.now() - t0);
      setSteps(newSteps);
      setCurrentStep(0);
    }
  }, [numPoints, algorithm]);

  // Reset
  const handleReset = useCallback(() => {
    stopPlay();
    setPoints([]);
    setSteps([]);
    setCurrentStep(0);
    setExecTime(null);
  }, []);

  // Promjena algoritma
  const handleAlgorithmChange = useCallback((algo) => {
    stopPlay();
    setAlgorithm(algo);
    if (points.length > 0) {
      const t0 = performance.now();
      const newSteps = ALGO_FN[algo](points);
      setExecTime(performance.now() - t0);
      setSteps(newSteps);
      setCurrentStep(0);
    }
  }, [points]);

  // Navigacija koraka
  const handleNext = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Play / Pauza
  function stopPlay() {
    setIsPlaying(false);
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  }

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlay();
      return;
    }
    if (currentStep >= steps.length - 1) {
      return;
    }
    setIsPlaying(true);
  }, [isPlaying, currentStep, steps.length]);

  // Timer za play
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    playTimerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          stopPlay();
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => {
      clearInterval(playTimerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  // Statistike
  const step = steps[currentStep] || null;
  const stats = {
    numPoints: points.length || null,
    numFaces: step?.faces?.length ?? null,
    numVerts: step?.hullVerts?.length ?? null,
    numEdges: step?.faces
      ? Math.round((step.faces.length * 3) / 2)
      : null,
    numInside: (points.length && step?.hullVerts)
      ? points.length - step.hullVerts.length
      : null,
    execTime,
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "220px 1fr 260px",
      gridTemplateRows: "48px 1fr",
      height: "100vh",
      fontFamily: "var(--font-sans)",
      color: "var(--color-text-primary)",
      background: "var(--color-background-primary)",
    }}>

      {/* Header */}
      <div style={{
        gridColumn: "1 / -1",
        borderBottom: "1px solid var(--color-border-tertiary)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "12px",
        background: "var(--color-background-secondary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            width: "22px", height: "22px",
            borderRadius: "6px",
            background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px",
            boxShadow: "0 0 10px rgba(59,130,246,0.4)",
          }}>&#x25C6;</span>
          <span style={{ fontSize: "14px", fontWeight: "600", letterSpacing: "-0.01em" }}>
            Vizualizacija algoritama
          </span>
          <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", borderLeft: "1px solid var(--color-border-secondary)", paddingLeft: "10px" }}>
            3D konveksni omota&#269;
          </span>
        </div>
        <span style={{
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
          marginLeft: "auto",
          letterSpacing: "0.01em",
        }}>
          Dr&#382;i i vuci za rotaciju &#xB7; Scroll za zum &#xB7; Desni klik za pomak
        </span>
      </div>

      {/* Lijevi panel — Controls */}
      <div style={{
        borderRight: "1px solid var(--color-border-tertiary)",
        padding: "16px 14px",
        overflowY: "auto",
        background: "var(--color-background-secondary)",
      }}>
        <Controls
          numPoints={numPoints}
          onNumPointsChange={setNumPoints}
          onGenerate={handleGenerate}
          onReset={handleReset}
          algorithm={algorithm}
          onAlgorithmChange={handleAlgorithmChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={handleTogglePlay}
          isPlaying={isPlaying}
          speed={speed}
          onSpeedChange={setSpeed}
          currentStep={currentStep}
          totalSteps={steps.length}
          hasPoints={points.length > 0}
        />
      </div>

      {/* Sredina — 3D scena */}
      <div style={{ overflow: "hidden" }}>
        <Scene3D
          points={points}
          step={step}
        />
      </div>

      {/* Desni panel — InfoPanel */}
      <div style={{
        borderLeft: "1px solid var(--color-border-tertiary)",
        padding: "16px 14px",
        overflowY: "auto",
        background: "var(--color-background-secondary)",
      }}>
        <InfoPanel
          algorithm={algorithm}
          step={step}
          stats={stats}
          points={points}
        />
      </div>

    </div>
  );
}