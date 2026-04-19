import { orient3D, isFaceVisible, findHorizon } from "../utils/geometry";

export function computeIncrementalSteps(points) {
  const pts = points;
  const n = pts.length;
  const steps = [];
  const EPS = 1e-9;

  if (n < 4) {
    steps.push({
      desc: "Premalo tacaka - potrebno je minimum 4.",
      faces: [],
      visibleFaces: [],
      horizonEdges: [],
      activePoint: null,
      hullVerts: [],
    });
    return steps;
  }

  steps.push({
    desc: "Inkrementalni algoritam: pocinjemo pronalaskom 4 nekoplanarne tacke za pocetni tetraedar.",
    faces: [],
    visibleFaces: [],
    horizonEdges: [],
    activePoint: null,
    hullVerts: [],
  });

  let a = 0;
  let b = 1;
  let c = 2;
  let d = 3;
  let foundInitial = false;

  outer: for (a = 0; a < n - 3; a++) {
    for (b = a + 1; b < n - 2; b++) {
      for (c = b + 1; c < n - 1; c++) {
        for (d = c + 1; d < n; d++) {
          if (Math.abs(orient3D(pts[a], pts[b], pts[c], pts[d])) > EPS) {
            foundInitial = true;
            break outer;
          }
        }
      }
    }
  }

  if (!foundInitial) {
    steps.push({
      desc: "Sve tacke su koplanarne - nije moguce formirati 3D konveksni omotac.",
      faces: [],
      visibleFaces: [],
      horizonEdges: [],
      activePoint: null,
      hullVerts: [],
      done: true,
    });
    return steps;
  }

  if (orient3D(pts[a], pts[b], pts[c], pts[d]) < 0) {
    [b, c] = [c, b];
  }

  const interior = [
    (pts[a][0] + pts[b][0] + pts[c][0] + pts[d][0]) / 4,
    (pts[a][1] + pts[b][1] + pts[c][1] + pts[d][1]) / 4,
    (pts[a][2] + pts[b][2] + pts[c][2] + pts[d][2]) / 4,
  ];

  const orientFace = (u, v, w) => {
    if (orient3D(pts[u], pts[v], pts[w], interior) > 0) {
      return [v, u, w];
    }
    return [u, v, w];
  };

  let faces = [
    orientFace(a, b, c),
    orientFace(a, c, d),
    orientFace(a, d, b),
    orientFace(b, d, c),
  ];

  const hullVerts = new Set([a, b, c, d]);
  let lastAddedFaces = [];

  steps.push({
    desc: `Pocetni tetraedar formiran od tacaka ${a}, ${b}, ${c}, ${d}. Ovo je nas pocetni konveksni omotac.`,
    faces: faces.map((f) => [...f]),
    visibleFaces: [],
    horizonEdges: [],
    activePoint: null,
    hullVerts: [...hullVerts],
  });

  for (let i = 0; i < n; i++) {
    if (i === a || i === b || i === c || i === d) {
      continue;
    }

    steps.push({
      desc: `Razmatramo tacku ${i}. Trazimo koje su plohe vidljive iz nje.`,
      faces: faces.map((f) => [...f]),
      visibleFaces: [],
      horizonEdges: [],
      activePoint: i,
      hullVerts: [...hullVerts],
    });

    const visibleIdx = faces
      .map((_, k) => k)
      .filter((k) => isFaceVisible(faces[k], pts, i));
    const visFaces = visibleIdx.map((k) => faces[k]);

    if (visFaces.length === 0) {
      steps.push({
        desc: `Tacka ${i} nije vidljiva ni iz jedne plohe - nalazi se unutar omotaca. Preskacemo je.`,
        faces: faces.map((f) => [...f]),
        visibleFaces: [],
        horizonEdges: [],
        activePoint: i,
        hullVerts: [...hullVerts],
      });
      continue;
    }

    const horizonEdges = findHorizon(visFaces);

    steps.push({
      desc: `Pronadeno ${visFaces.length} vidljivih ploha (crveno) i horizont od ${horizonEdges.length} ivica (narandzasto). Brisemo vidljive plohe.`,
      faces: faces.map((f) => [...f]),
      visibleFaces: visFaces.map((f) => [...f]),
      horizonEdges,
      activePoint: i,
      hullVerts: [...hullVerts],
    });

    faces = faces.filter((_, k) => !visibleIdx.includes(k));

    const newFaces = horizonEdges.map(([u, v]) => orientFace(u, v, i));
    for (const f of newFaces) {
      faces.push(f);
    }
    lastAddedFaces = newFaces;
    hullVerts.add(i);

    steps.push({
      desc: `Tacka ${i} dodana na omotac. Kreirano ${horizonEdges.length} novih ploha spajanjem horizonta sa tackom ${i}.`,
      faces: faces.map((f) => [...f]),
      visibleFaces: [],
      horizonEdges: [],
      activePoint: i,
      hullVerts: [...hullVerts],
      lastFaces: lastAddedFaces.map((f) => [...f]),
    });
  }

  steps.push({
    desc: "Inkrementalni algoritam zavrsen! Sve tacke su obradene. Konveksni omotac je kompletan.",
    faces: faces.map((f) => [...f]),
    visibleFaces: [],
    horizonEdges: [],
    activePoint: null,
    hullVerts: [...hullVerts],
    lastFaces: lastAddedFaces.map((f) => [...f]),
    done: true,
  });

  return steps;
}