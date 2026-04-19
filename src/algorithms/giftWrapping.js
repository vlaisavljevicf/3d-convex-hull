import { orient3D } from "../utils/geometry";

function dirEdgeKey(u, v) {
  return `${u},${v}`;
}

function faceKey(f) {
  return [...f].sort((a, b) => a - b).join(",");
}

// Pivot oko usmjerene ivice (u->v): traži w takvo da su sve ostale tačke
// na negativnoj strani ravni (u, v, w).
function pivotAroundEdge(pts, u, v) {
  const n = pts.length;
  let w = -1;

  for (let i = 0; i < n; i++) {
    if (i === u || i === v) {
      continue;
    }
    if (w === -1) {
      w = i;
      continue;
    }
    if (orient3D(pts[u], pts[v], pts[w], pts[i]) > 0) {
      w = i;
    }
  }

  return w;
}

export function computeGiftWrappingSteps(points) {
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
    desc: "Gift Wrapping (Jarvis March 3D): trazimo pocetne tacke za tetraedar.",
    faces: [],
    visibleFaces: [],
    horizonEdges: [],
    activePoint: null,
    hullVerts: [],
  });

  const EPS = 1e-9;
  let a = 0, b = 1, c = 2, d = 3;
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

  // Unutrašnja tačka tetraedra — koristi se za orijentaciju ploha prema van
  const interior = [
    (pts[a][0] + pts[b][0] + pts[c][0] + pts[d][0]) / 4,
    (pts[a][1] + pts[b][1] + pts[c][1] + pts[d][1]) / 4,
    (pts[a][2] + pts[b][2] + pts[c][2] + pts[d][2]) / 4,
  ];

  // Orijentiraj plohu tako da normala pokazuje prema van od unutrašnje tačke
  function orientFace(u, v, w) {
    if (orient3D(pts[u], pts[v], pts[w], interior) > 0) {
      return [v, u, w];
    }
    return [u, v, w];
  }

  // Počinjemo s jednom početnom plohom — red će otkriti sve ostale.
  // Ne koristimo cijeli tetraedar kako red ivica ne bi odmah bio zatvoren.
  const seedFace = orientFace(a, b, c);
  const faces = [seedFace];
  const hullVerts = new Set([a, b, c]);
  const seenFaceKeys = new Set([faceKey(seedFace)]);

  // Svaka ploha posjeduje 3 usmjerene ivice; obrnute ivice idu u red.
  const processedDirEdges = new Set();
  const edgeQueue = [];

  const [su, sv, sw] = seedFace;
  processedDirEdges.add(dirEdgeKey(su, sv));
  processedDirEdges.add(dirEdgeKey(sv, sw));
  processedDirEdges.add(dirEdgeKey(sw, su));

    // Obrnute ivice u red — pivot će pronaći susjedne plohe
  edgeQueue.push([sv, su]);
  edgeQueue.push([sw, sv]);
  edgeQueue.push([su, sw]);

  let lastAddedFaces = [seedFace];

  steps.push({
    desc: `Pocetna ploha (${su}, ${sv}, ${sw}) formirana. Pocinjemo Gift Wrapping.`,
    faces: faces.map((f) => [...f]),
    visibleFaces: [seedFace],
    horizonEdges: [],
    activePoint: sw,
    hullVerts: [...hullVerts],
    lastFaces: [[...seedFace]],
  });

  const maxIter = n * n * 6 + 500;
  let iter = 0;

  while (edgeQueue.length > 0 && iter < maxIter) {
    iter++;
    const [u, v] = edgeQueue.shift();

    if (processedDirEdges.has(dirEdgeKey(u, v))) {
      continue;
    }
    processedDirEdges.add(dirEdgeKey(u, v));

    const w = pivotAroundEdge(pts, u, v);
    if (w === -1) {
      continue;
    }

    // Ploha mora biti okrenuta prema van — unutrašnja tačka mora biti na negativnoj strani
    if (orient3D(pts[u], pts[v], pts[w], interior) > 0) {
      continue;
    }

    const fk = faceKey([u, v, w]);
    if (seenFaceKeys.has(fk)) {
      continue;
    }
    seenFaceKeys.add(fk);

    const newFace = [u, v, w];
    faces.push(newFace);
    lastAddedFaces = [newFace];
    hullVerts.add(u);
    hullVerts.add(v);
    hullVerts.add(w);

    // Označi sve usmjerene ivice nove plohe kao obrađene
    processedDirEdges.add(dirEdgeKey(u, v));
    processedDirEdges.add(dirEdgeKey(v, w));
    processedDirEdges.add(dirEdgeKey(w, u));

    steps.push({
      desc: `Ivica (${u} -> ${v}): pivot pronalazi tacku ${w}. Dodajemo plohu (${u}, ${v}, ${w}).`,
      faces: faces.map((f) => [...f]),
      visibleFaces: [newFace],
      horizonEdges: [[u, v]],
      activePoint: w,
      hullVerts: [...hullVerts],
      lastFaces: [[...newFace]],
    });

    // Dodaj obrnute ivice u red za daljnje otkrivanje
    for (const [p, q] of [[v, u], [w, v], [u, w]]) {
      if (!processedDirEdges.has(dirEdgeKey(p, q))) {
        edgeQueue.push([p, q]);
      }
    }

    steps.push({
      desc: `Ploha (${u}, ${v}, ${w}) dodana u omotac. Nove ivice dodane u red.`,
      faces: faces.map((f) => [...f]),
      visibleFaces: [],
      horizonEdges: [],
      activePoint: w,
      hullVerts: [...hullVerts],
      lastFaces: [[...newFace]],
    });
  }

  steps.push({
    desc: "Gift Wrapping zavrsen! Konveksni omotac je kompletan.",
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