// Vektorske operacije
export function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function norm(v) {
  const l = Math.sqrt(dot(v, v));
  return l < 1e-12 ? v : v.map((x) => x / l);
}

// Orient3D - osnova svih algoritama (Definicija 2.7.1 iz rada)
// Vraca pozitivnu vrijednost ako je D iznad ravni ABC,
// negativnu ako je ispod, 0 ako su koplanarni
export function orient3D(A, B, C, D) {
  const m = [sub(A, D), sub(B, D), sub(C, D)];
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

// Udaljenost tacke od ravni (Definicija 2.6.1 iz rada)
export function distToPlane(faceIndices, pts, p) {
  const [a, b, c] = faceIndices.map((i) => pts[i]);
  const n = cross(sub(b, a), sub(c, a));
  const l = Math.sqrt(dot(n, n));
  if (l < 1e-12) return 0;
  return dot(n, sub(p, a)) / l;
}

// Da li je ploha vidljiva iz tacke (Definicija 2.8.2 iz rada)
export function isFaceVisible(face, pts, pIdx) {
  const [a, b, c] = face;
  return orient3D(pts[a], pts[b], pts[c], pts[pIdx]) > 0;
}

// Pronalazak horizonta (Definicija 2.8.3 iz rada)
// Vraca ivice koje su granica izmedju vidljivih i nevidljivih ploha
export function findHorizon(visibleFaces) {
  const edgeCount = {};
  visibleFaces.forEach((f) => {
    [
      [f[0], f[1]],
      [f[1], f[2]],
      [f[2], f[0]],
    ].forEach(([u, v]) => {
      const k = u < v ? `${u},${v}` : `${v},${u}`;
      edgeCount[k] = (edgeCount[k] || 0) + 1;
    });
  });
  return Object.entries(edgeCount)
    .filter(([, cnt]) => cnt === 1)
    .map(([k]) => k.split(",").map(Number));
}

// Generisanje random tacaka u [-1, 1]^3
export function generateRandomPoints(n) {
  return Array.from({ length: n }, () => [
    (Math.random() - 0.5) * 2.4,
    (Math.random() - 0.5) * 2.4,
    (Math.random() - 0.5) * 2.4,
  ]);
}