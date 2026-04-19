import { orient3D, findHorizon } from "../utils/geometry";

const EPS = 1e-9;

function faceKey(f) {
  return [...f].sort((a, b) => a - b).join(",");
}

function signedDist(pts, face, pIdx) {
  return orient3D(pts[face[0]], pts[face[1]], pts[face[2]], pts[pIdx]);
}

export function computeQuickhullSteps(points) {
  const pts = points;
  const n = pts.length;
  const steps = [];

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
    desc: "Quickhull: trazimo 4 nekoplanarne tacke i formiramo pocetni tetraedar.",
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
  let found = false;

  outer: for (a = 0; a < n - 3; a++) {
    for (b = a + 1; b < n - 2; b++) {
      for (c = b + 1; c < n - 1; c++) {
        for (d = c + 1; d < n; d++) {
          if (Math.abs(orient3D(pts[a], pts[b], pts[c], pts[d])) > EPS) {
            found = true;
            break outer;
          }
        }
      }
    }
  }

  if (!found) {
    steps.push({
      desc: "Sve tacke su koplanarne.",
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

  const initFaces = [
    orientFace(a, b, c),
    orientFace(a, c, d),
    orientFace(a, d, b),
    orientFace(b, d, c),
  ];

  const faces = [...initFaces];
  const outsideSets = initFaces.map(() => []);
  const deleted = new Set();
  const seenFaceKeys = new Set(initFaces.map(faceKey));
  const hullVerts = new Set([a, b, c, d]);
  let lastAddedFaces = [];

  const inTetra = new Set([a, b, c, d]);
  for (let i = 0; i < n; i++) {
    if (inTetra.has(i)) {
      continue;
    }
    for (let fi = 0; fi < faces.length; fi++) {
      if (signedDist(pts, faces[fi], i) > EPS) {
        outsideSets[fi].push(i);
        break;
      }
    }
  }

  steps.push({
    desc: `Pocetni tetraedar: tacke ${a}, ${b}, ${c}, ${d}. ${faces.length} plohe. Rasporedujemo preostale tacke.`,
    faces: faces.map((f) => [...f]),
    visibleFaces: [],
    horizonEdges: [],
    activePoint: null,
    hullVerts: [...hullVerts],
  });

  const queue = faces.map((_, i) => i).filter((fi) => outsideSets[fi].length > 0);
  const liveFaces = () => faces.filter((_, k) => !deleted.has(k));

  let iter = 0;
  const maxIter = n * n + 500;

  while (queue.length > 0 && iter < maxIter) {
    iter++;
    const fi = queue.shift();

    if (deleted.has(fi) || !outsideSets[fi] || outsideSets[fi].length === 0) {
      continue;
    }

    const face = faces[fi];
    let farthest = -1;
    let maxDist = EPS;

    for (const pi of outsideSets[fi]) {
      const dist = signedDist(pts, face, pi);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = pi;
      }
    }

    if (farthest === -1) {
      continue;
    }

    steps.push({
      desc: `Ploha (${face.join(", ")}): najudaljenija tacka ${farthest} (dist ${maxDist.toFixed(3)}). Trazimo vidljive plohe.`,
      faces: liveFaces().map((f) => [...f]),
      visibleFaces: [face],
      horizonEdges: [],
      activePoint: farthest,
      hullVerts: [...hullVerts],
    });

    const visibleIdx = faces
      .map((_, k) => k)
      .filter((k) => !deleted.has(k) && signedDist(pts, faces[k], farthest) > EPS);
    const visFaces = visibleIdx.map((k) => faces[k]);
    const horizonEdges = findHorizon(visFaces);

    steps.push({
      desc: `${visFaces.length} vidljivih ploha iz tacke ${farthest} (crveno). Horizont: ${horizonEdges.length} ivica (narandzasto).`,
      faces: liveFaces().map((f) => [...f]),
      visibleFaces: visFaces.map((f) => [...f]),
      horizonEdges,
      activePoint: farthest,
      hullVerts: [...hullVerts],
    });

    const orphans = [];
    for (const k of visibleIdx) {
      for (const pi of (outsideSets[k] || [])) {
        if (pi !== farthest) {
          orphans.push(pi);
        }
      }
      outsideSets[k] = [];
      deleted.add(k);
    }

    hullVerts.add(farthest);
    const newFaceIndices = [];

    for (const [u, v] of horizonEdges) {
      const nf = orientFace(u, v, farthest);
      const fk = faceKey(nf);
      if (!seenFaceKeys.has(fk)) {
        seenFaceKeys.add(fk);
        faces.push(nf);
        outsideSets.push([]);
        newFaceIndices.push(faces.length - 1);
      }
    }

    for (const pi of orphans) {
      for (const nfi of newFaceIndices) {
        if (signedDist(pts, faces[nfi], pi) > EPS) {
          outsideSets[nfi].push(pi);
          break;
        }
      }
    }

    lastAddedFaces = newFaceIndices.map((nfi) => [...faces[nfi]]);

    for (const nfi of newFaceIndices) {
      if (outsideSets[nfi].length > 0) {
        queue.push(nfi);
      }
    }

    steps.push({
      desc: `Tacka ${farthest} dodana na omotac. Kreirano ${newFaceIndices.length} novih ploha.`,
      faces: liveFaces().map((f) => [...f]),
      visibleFaces: [],
      horizonEdges: [],
      activePoint: farthest,
      hullVerts: [...hullVerts],
      lastFaces: lastAddedFaces,
    });
  }

  steps.push({
    desc: "Quickhull zavrsen! Konveksni omotac je kompletan.",
    faces: liveFaces().map((f) => [...f]),
    visibleFaces: [],
    horizonEdges: [],
    activePoint: null,
    hullVerts: [...hullVerts],
    lastFaces: lastAddedFaces,
    done: true,
  });

  return steps;
}