import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Scene3D({ points, step }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    rotX: 0.4,
    rotY: 0.6,
    zoom: 5,
    isDragging: false,
    isRightDrag: false,
    lastX: 0,
    lastY: 0,
    panX: 0,
    panY: 0,
  });

  // Inicijalizacija scene — pokrece se samo jednom
  useEffect(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    s.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    s.renderer.setPixelRatio(window.devicePixelRatio);
    s.renderer.setSize(W, H);
    s.renderer.setClearColor(0xf1f4f9, 1);
    s.renderer.shadowMap.enabled = true;
    s.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    s.scene = new THREE.Scene();

    s.camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
    s.camera.position.set(0, 0, s.zoom);

    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    s.scene.add(amb);
    const hemi = new THREE.HemisphereLight(0xddeeff, 0x8899aa, 0.4);
    s.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(4, 7, 5);
    s.scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xaabbcc, 0.25);
    dir2.position.set(-4, -2, -3);
    s.scene.add(dir2);

    drawGrid(s.scene);
    drawAxes(s.scene);
    render(s);

    // Mis eventi
    const onMouseDown = (e) => {
      s.isDragging = true;
      s.isRightDrag = e.button === 2;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };

    const onMouseUp = () => { s.isDragging = false; };

    const onMouseMove = (e) => {
      if (!s.isDragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      if (s.isRightDrag) { s.panX += dx * 0.005; s.panY -= dy * 0.005; }
      else { s.rotY += dx * 0.008; s.rotX += dy * 0.008; }
      render(s);
    };

    const onWheel = (e) => {
      e.preventDefault();
      s.zoom = Math.max(0.5, Math.min(15, s.zoom + e.deltaY * 0.01));
      render(s);
    };

    const onContextMenu = (e) => {
        e.preventDefault();
    }

    const onResize = () => {
      const W2 = canvas.offsetWidth;
      const H2 = canvas.offsetHeight;
      s.camera.aspect = W2 / H2;
      s.camera.updateProjectionMatrix();
      s.renderer.setSize(W2, H2);
      render(s);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      s.renderer.dispose();
    };
  }, []);

  // Azuriranje vizualizacije kada se promijeni step ili points
  useEffect(() => {
    const s = stateRef.current;

    if (!s.scene) {
        return;
    }

    clearVisualization(s.scene);

    if (points && points.length > 0) {
      drawPoints(s.scene, points, step);
      drawPointLabels(s.scene, points);
      if (step) {
        if (step.done) {
          drawFaces(s.scene, points, step.faces, "done");
        } else {
          drawFaces(s.scene, points, step.faces, "hull");
          if (step.lastFaces && step.lastFaces.length > 0) {
            drawLastFaceEdges(s.scene, points, step.lastFaces);
          }
        }
        drawFaces(s.scene, points, step.visibleFaces, "visible");
        drawHorizon(s.scene, points, step.horizonEdges);
      }
    }

    render(s);
  }, [points, step]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
    />
  );
}

// ── Pomocne funkcije za crtanje ──────────────────────────────

function render(s) {
  s.scene.rotation.x = s.rotX;
  s.scene.rotation.y = s.rotY;
  s.scene.position.x = s.panX;
  s.scene.position.y = s.panY;
  s.camera.position.set(s.panX, s.panY, s.zoom);
  s.camera.lookAt(s.panX, s.panY, 0);
  s.renderer.render(s.scene, s.camera);
}

function drawGrid(scene) {
  const mat = new THREE.LineBasicMaterial({ color: 0xc8d0e0, opacity: 1, transparent: false });
  const arr = [];

  for (let i = -3; i <= 3; i++) {
    arr.push(-3, 0, i,  3, 0, i);
    arr.push(i, 0, -3,  i, 0, 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  const grid = new THREE.LineSegments(geo, mat);
  grid.userData.isStatic = true;
  scene.add(grid);

  // Outer ring
  const ringArr = [];
  const seg = 64;
  const R = 3.2;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    ringArr.push(Math.cos(a0) * R, 0, Math.sin(a0) * R);
    ringArr.push(Math.cos(a1) * R, 0, Math.sin(a1) * R);
  }
  const rgeo = new THREE.BufferGeometry();
  rgeo.setAttribute("position", new THREE.Float32BufferAttribute(ringArr, 3));
  const ring = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: 0xb0bcd0 }));
  ring.userData.isStatic = true;
  scene.add(ring);
}

function drawAxes(scene) {
  const axes = [
    { from: [0,0,0], to: [1.8,0,0], color: 0xff4466, label: "X" },
    { from: [0,0,0], to: [0,1.8,0], color: 0x44dd88, label: "Y" },
    { from: [0,0,0], to: [0,0,1.8], color: 0x4499ff, label: "Z" },
  ];
  axes.forEach(({ from, to, color, label }) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
    const axis = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, opacity: 0.7, transparent: true }));
    axis.userData.isStatic = true;
    scene.add(axis);

    // Axis label sprite
    const cv = document.createElement("canvas");
    cv.width = 32; cv.height = 32;
    const cx = cv.getContext("2d");
    cx.font = "bold 22px monospace";
    cx.fillStyle = `#${color.toString(16).padStart(6, "0")}cc`;
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillText(label, 16, 16);
    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.position.set(to[0] * 1.15, to[1] * 1.15, to[2] * 1.15);
    sp.scale.set(0.18, 0.18, 1);
    sp.userData.isStatic = true;
    scene.add(sp);
  });
}

function clearVisualization(scene) {
  const toRemove = scene.children.filter((c) => !c.userData.isStatic);

  toRemove.forEach((c) => {
    scene.remove(c);
    if (c.geometry) { c.geometry.dispose(); }
    if (c.material) {
      if (c.material.map) { c.material.map.dispose(); }
      c.material.dispose();
    }
  });
}

function drawPoints(scene, points, step) {
  // On done step, compute hull membership directly from faces (most accurate)
  const hullSet = (step?.done && step?.faces)
    ? new Set(step.faces.flat())
    : new Set(step?.hullVerts || []);
  const activePoint = step?.activePoint ?? null;
  const isDone = step?.done ?? false;

  points.forEach((p, i) => {
    const isActive = i === activePoint;
    const isHull = hullSet.has(i);

    let color, emissiveColor, emissiveIntensity, radius;
    if (isActive) {
      color = 0xea580c;
      emissiveColor = 0xea580c;
      emissiveIntensity = 0.3;
      radius = 0.063;
    } else if (isHull) {
      color = isDone ? 0x16a34a : 0x22c55e;
      emissiveColor = isDone ? 0x16a34a : 0x22c55e;
      emissiveIntensity = 0.15;
      radius = 0.052;
    } else {
      color = 0x3b82f6;
      emissiveColor = 0x1d4ed8;
      emissiveIntensity = 0.08;
      radius = 0.042;
    }

    const geo = new THREE.SphereGeometry(radius, 14, 14);
    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity,
      shininess: 80,
      specular: 0xffffff,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p[0], p[1], p[2]);
    scene.add(mesh);
  });
}

function drawFaces(scene, points, faces, type) {
  if (!faces || faces.length === 0) {
    return;
  }

  const color = type === "visible" ? 0xef4444 : type === "done" ? 0x3b82f6 : 0x60a5fa;
  const opacity = type === "visible" ? 0.28 : type === "done" ? 0.45 : 0.16;
  const edgeOpacity = type === "visible" ? 0.6 : type === "done" ? 0.9 : 0.45;
  const edgeColor = type === "visible" ? 0xef4444 : type === "done" ? 0x1d4ed8 : 0x3b82f6;

  const positions = [];
  faces.forEach((f) => {
    const [a, b, c] = f.map((i) => points[i]);
    positions.push(...a, ...b, ...c);
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshPhongMaterial({
    color,
    opacity,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    shininess: type === "done" ? 50 : 15,
    specular: type === "done" ? 0x99bbff : 0x336699,
  });
  scene.add(new THREE.Mesh(geo, mat));

  // Ivice ploha
  const edgeArr = [];
  faces.forEach((f) => {
    const [a, b, c] = f.map((i) => points[i]);
    edgeArr.push(...a, ...b, ...b, ...c, ...c, ...a);
  });
  const egeo = new THREE.BufferGeometry();
  egeo.setAttribute("position", new THREE.Float32BufferAttribute(edgeArr, 3));
  scene.add(new THREE.LineSegments(egeo, new THREE.LineBasicMaterial({ color: edgeColor, opacity: edgeOpacity, transparent: true, depthWrite: false })));
}

function drawLastFaceEdges(scene, points, faces) {
  if (!faces || faces.length === 0) {
    return;
  }

  const arr = [];
  faces.forEach((f) => {
    const [a, b, c] = f.map((i) => points[i]);
    arr.push(...a, ...b, ...b, ...c, ...c, ...a);
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x38bdf8 })));
}

function drawPointLabels(scene, points) {
  if (!points || points.length === 0) {
    return;
  }

  points.forEach((p, i) => {
    const canvas = document.createElement("canvas");
    canvas.width = 56;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 56, 32);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.roundRect(2, 2, 52, 28, 5);
    ctx.fill();
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i), 28, 16);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(p[0] + 0.09, p[1] + 0.12, p[2]);
    sprite.scale.set(0.16, 0.09, 1);
    scene.add(sprite);
  });
}

function drawHorizon(scene, points, horizonEdges) {
  if (!horizonEdges || horizonEdges.length === 0) {
    return;
  }

  const arr = [];
  horizonEdges.forEach(([a, b]) => {
    arr.push(...points[a], ...points[b]);
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xff9900 })));
}