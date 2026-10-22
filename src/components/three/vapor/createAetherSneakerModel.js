// AETHER AE-01 Vapor: code-built 3D sneaker (made for AETHER, no external files).
// Frame: +X toe, +Y up, +Z outer side. Ground at y = 0. Length is about 1.11 units.
import * as THREE from "three";
import PROFILES from "./profiles.json";
const prof = PROFILES;
const SVG = {
  upper: "M322 560 C300 470 310 382 360 330 C390 300 430 290 470 300 C560 335 640 345 700 330 L760 300 C800 290 830 300 860 320 L1000 400 C1100 450 1220 480 1300 520 C1360 550 1388 592 1382 632 L1180 566 L330 550 Z",
  heelCounter: "M322 562 C302 470 312 385 362 333 C382 315 405 305 432 303 C445 380 458 470 480 556 Z",
  heelStitch: "M440 318 C452 400 464 476 484 552",
  toeCap: "M1060 432 C1160 472 1260 497 1320 527 C1370 553 1390 596 1382 632 C1300 602 1200 582 1120 574 C1082 522 1066 472 1060 432 Z",
  toeStitch: "M1072 448 C1170 488 1260 512 1312 540 C1350 560 1368 588 1368 612",
  slash: "M500 528 L1000 405 L1028 436 L540 556 Z",
  slashEmber: "M570 554 L1040 446 L1048 459 L600 562 Z",
  eyestay: "M758 298 L860 318 L1012 404 L982 442 L840 370 L742 340 Z",
  collar: "M470 300 C560 336 640 346 700 330 L760 300"
};
const PERFS = [[1180, 520], [1210, 530], [1240, 540], [1270, 552], [1195, 545], [1225, 555], [1255, 565]];
const SEAMS = [[520, 360, 540, 540], [560, 368, 585, 542], [600, 372, 630, 544], [640, 372, 675, 546], [680, 366, 720, 548]];
const EYELETS = [[768, 322], [813, 342], [860, 364], [906, 388], [950, 414]];
const toWorld = ([X, Y]) => [(X - 840) / 1e3, (706 - Y) / 1e3];
const CAN = { x0: 270, y0: 190, w: 1140, h: 530, k: 2 };
const uvOf = (x, y) => {
  const X = x * 1e3 + 840, Y = 706 - y * 1e3;
  return [(X - CAN.x0) / CAN.w, 1 - (Y - CAN.y0) / CAN.h];
};
const PLAN = [[0, 0], [0.012, 0.06], [0.04, 0.1], [0.1, 0.122], [0.3, 0.128], [0.5, 0.142], [0.66, 0.163], [0.78, 0.158], [0.87, 0.138], [0.93, 0.108], [0.97, 0.072], [0.99, 0.038], [1, 0]];
function interp(table, u) {
  if (u <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (u <= table[i][0]) {
      const [a, va] = table[i - 1], [b, vb] = table[i];
      const t = (u - a) / (b - a), s = (1 - Math.cos(t * Math.PI)) / 2;
      return va + (vb - va) * s;
    }
  }
  return table[table.length - 1][1];
}
function span(poly, x) {
  const ys = [];
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    if (x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && x1 !== x2) ys.push(y1 + (x - x1) / (x2 - x1) * (y2 - y1));
  }
  if (ys.length < 2) return null;
  return [Math.min(...ys), Math.max(...ys)];
}
function xRange(poly) {
  const xs = poly.map((p) => p[0]);
  return [Math.min(...xs), Math.max(...xs)];
}
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const sgnPow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
function openingAt(x) {
  if (x < -0.47 || x > 0.17) return 0;
  const rear = smooth(-0.47, -0.43, x);
  const front = x < -0.15 ? 1 : 1 - smooth(-0.15, 0.17, x);
  return 0.072 * rear * Math.max(front, 0);
}
function loft(o) {
  const N = o.stations ?? 140, M = o.around ?? 40;
  const [xa, xb] = xRange(o.poly);
  const pad = (xb - xa) * 2e-3;
  const pos = [], uv = [], idx = [];
  const cols = o.open ? 2 * (M + 1) : M;
  const openSt = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = xa + pad + (xb - xa - 2 * pad) * u;
    let sp = span(o.poly, x) ?? [0, 0];
    if (o.topY) sp = o.topY(x, sp);
    const yb = sp[0] - (o.sink ?? 0), yt = sp[1];
    const hw = (o.halfWidth ? o.halfWidth(x, u) : interp(PLAN, u)) * o.widthScale;
    if (o.open) {
      const zTop = Math.min(openingAt(x), hw * 0.8);
      openSt.push(zTop > 1e-4);
      for (const side of [1, -1]) {
        for (let j = 0; j <= M; j++) {
          const jj = side === 1 ? j : M - j;
          const phi = jj / M * Math.PI / 2;
          const z = side * (zTop + (hw - zTop) * Math.pow(Math.cos(phi), 0.5));
          const y = yb + (yt - yb) * Math.pow(Math.sin(phi), 1.15);
          pos.push(x, y, z);
          uv.push(...uvOf(x, y));
        }
      }
    } else {
      const n = o.squareness ?? 4, ym = (yb + yt) / 2, hh = (yt - yb) / 2;
      for (let j = 0; j < M; j++) {
        const th = j / M * Math.PI * 2;
        const z = hw * sgnPow(Math.cos(th), 2 / n), y = ym + hh * sgnPow(Math.sin(th), 2 / n);
        pos.push(x, y, z);
        uv.push(...uvOf(x, y));
      }
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < cols - (o.open ? 1 : 0); j++) {
      if (o.open && j === M && (openSt[i] || openSt[i + 1])) continue;
      const j2 = o.open ? j + 1 : (j + 1) % M;
      const a = i * cols + j, b = i * cols + j2, c = (i + 1) * cols + j, d = (i + 1) * cols + j2;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (o.open) weldTopNormals(g, N, M, openSt);
  orientOutward(g);
  return g;
}
function weldTopNormals(g, N, M, openSt) {
  const n = g.getAttribute("normal"), cols = 2 * (M + 1);
  for (let i = 0; i <= N; i++) {
    if (openSt[i]) continue;
    const a = i * cols + M, b = a + 1;
    const v = new THREE.Vector3(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, v.x, v.y, v.z);
    n.setXYZ(b, v.x, v.y, v.z);
  }
}
function orientOutward(g) {
  const p = g.getAttribute("position"), n = g.getAttribute("normal");
  let score = 0;
  for (let i = 0; i < p.count; i += 7) score += Math.sign(p.getZ(i)) * n.getZ(i);
  if (score >= 0) return;
  const index = g.getIndex();
  for (let i = 0; i < index.count; i += 3) {
    const t = index.getX(i + 1);
    index.setX(i + 1, index.getX(i + 2));
    index.setX(i + 2, t);
  }
  index.needsUpdate = true;
  g.computeVertexNormals();
}
function canvasTex(draw) {
  const c = document.createElement("canvas");
  c.width = CAN.w * CAN.k;
  c.height = CAN.h * CAN.k;
  const ctx = c.getContext("2d");
  ctx.setTransform(CAN.k, 0, 0, CAN.k, -CAN.x0 * CAN.k, -CAN.y0 * CAN.k);
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const vGrad = (ctx, y0, y1, a, b) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
};
const hGrad = (ctx, x0, x1, a, b) => {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
};
const EMBER = (ctx, x0, x1) => hGrad(ctx, x0, x1, "#FF3D12", "#FF7A1A");
const OBS = (ctx, y0, y1) => vGrad(ctx, y0, y1, "#2B2B2B", "#0E0E0E");
const OVERLAY_REGIONS = [
  { id: "eyestay", name: "Eyestay / lacing system", path: SVG.eyestay },
  { id: "side-slash", name: "Signature rising slash", path: SVG.slash },
  { id: "side-slash", name: "Signature rising slash (ember line)", path: SVG.slashEmber },
  { id: "toe-cap", name: "Toe cap overlay", path: SVG.toeCap },
  { id: "heel-counter", name: "Heel counter overlay", path: SVG.heelCounter }
];
function upperTexture() {
  return canvasTex((ctx) => {
    ctx.fillStyle = vGrad(ctx, 280, 580, "#FFFFFF", "#E4E3DD");
    ctx.fillRect(CAN.x0, CAN.y0, CAN.w, CAN.h);
    ctx.strokeStyle = "rgba(190,189,183,0.8)";
    ctx.lineWidth = 2;
    for (const [a, b, c, d] of SEAMS) {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    }
    ctx.fillStyle = OBS(ctx, 300, 560);
    ctx.fill(new Path2D(SVG.heelCounter));
    ctx.fill(new Path2D("M270 280 L380 300 L432 303 C445 380 458 470 480 556 L270 575 Z"));
    ctx.fillStyle = OBS(ctx, 430, 630);
    ctx.fill(new Path2D(SVG.toeCap));
    ctx.fillStyle = OBS(ctx, 400, 560);
    ctx.fill(new Path2D(SVG.slash));
    ctx.fillStyle = EMBER(ctx, 570, 1048);
    ctx.fill(new Path2D(SVG.slashEmber));
    ctx.fillStyle = "#1A1A1A";
    ctx.fill(new Path2D(SVG.eyestay));
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = "#7A7A76";
    ctx.lineWidth = 2;
    ctx.stroke(new Path2D(SVG.heelStitch));
    ctx.stroke(new Path2D(SVG.toeStitch));
    ctx.setLineDash([]);
    ctx.fillStyle = "#3A3A38";
    for (const [x, y] of PERFS) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.stroke(new Path2D(SVG.collar));
  });
}
function midsoleTexture() {
  return canvasTex((ctx) => {
    ctx.fillStyle = vGrad(ctx, 556, 678, "#FAFAF7", "#D6D5CF");
    ctx.fillRect(CAN.x0, CAN.y0, CAN.w, CAN.h);
    ctx.strokeStyle = "#BDBCB6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(330, 630);
    ctx.bezierCurveTo(600, 645, 900, 642, 1350, 634);
    ctx.stroke();
    ctx.strokeStyle = "#ECEBE6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 592);
    ctx.bezierCurveTo(500, 600, 800, 602, 1200, 598);
    ctx.stroke();
    ctx.fillStyle = "#141414";
    ctx.beginPath();
    ctx.roundRect(372, 596, 230, 50, 25);
    ctx.fill();
    ctx.fillStyle = EMBER(ctx, 384, 590);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.roundRect(384, 605, 206, 32, 16);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#141414";
    ctx.lineWidth = 4;
    for (const x of [430, 480, 530]) {
      ctx.beginPath();
      ctx.moveTo(x, 605);
      ctx.lineTo(x, 637);
      ctx.stroke();
    }
  });
}
function outsoleTexture() {
  return canvasTex((ctx) => {
    ctx.fillStyle = "#121212";
    ctx.fillRect(CAN.x0, CAN.y0, CAN.w, CAN.h);
    ctx.strokeStyle = "#333331";
    ctx.lineWidth = 3;
    for (let k = 0; k < 12; k++) {
      const x = 380 + k * 80;
      ctx.beginPath();
      ctx.moveTo(x, 674);
      ctx.lineTo(x - 8, 702);
      ctx.stroke();
    }
  });
}
function tongueTexture() {
  return canvasTex((ctx) => {
    ctx.fillStyle = OBS(ctx, 200, 440);
    ctx.fillRect(CAN.x0, CAN.y0, CAN.w, CAN.h);
    ctx.fillStyle = EMBER(ctx, 770, 816);
    ctx.beginPath();
    ctx.moveTo(770, 222);
    ctx.lineTo(812, 220);
    ctx.lineTo(816, 262);
    ctx.lineTo(774, 264);
    ctx.closePath();
    ctx.fill();
  });
}
function markTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.scale(256 / 200, 256 / 200);
  ctx.fillStyle = "#F5F5F2";
  ctx.fill(new Path2D("M18 182 L88 18 L112 18 L182 182 L148 182 L100 70 L52 182 Z"));
  ctx.globalCompositeOperation = "destination-out";
  ctx.fill(new Path2D("M40 150 L198 104 L198 120 L34 166 Z"));
  ctx.globalCompositeOperation = "source-over";
  ctx.fill(new Path2D("M58 138 L196 98 L196 110 L54 150 Z"));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function createAetherSneakerModel() {
  const root = new THREE.Group();
  root.name = "aether-ae01-vapor";
  const parts = {};
  const node = (id, name, parent, explode, role = "explode-part") => {
    const n = new THREE.Group();
    n.name = id;
    n.userData = { id, name, actionProfile: { animationRole: role }, explode: new THREE.Vector3(...explode), home: new THREE.Vector3() };
    parent.add(n);
    parts[id] = n;
    return n;
  };
  const mesh = (g, m, parent, id) => {
    const me = new THREE.Mesh(g, m);
    me.castShadow = true;
    me.receiveShadow = true;
    me.name = id + "-mesh";
    me.userData.partId = id;
    parent.add(me);
    return me;
  };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const nMid = node("midsole", "Midsole (sole-unit root)", root, [0, -0.07, 0], "root");
  mesh(loft({ poly: prof.midsole, widthScale: 1, squareness: 6, around: 40, stations: 110 }), std({ map: midsoleTexture(), roughness: 0.6 }), nMid, "midsole");
  const nOut = node("outsole", "Rubber outsole", nMid, [0, -0.08, 0]);
  mesh(loft({ poly: prof.outsole, widthScale: 1.03, squareness: 8, around: 36, stations: 100 }), std({ map: outsoleTexture(), roughness: 0.9 }), nOut, "outsole");
  node("cushion-window", "Ember cushioning window (on midsole)", nMid, [0, 0, 0]).userData.realization = "canvas region on midsole";
  const nUp = node("upper", "Upper shell", nMid, [0, 0.05, 0]);
  const upperG = loft({ poly: prof.upper, widthScale: 0.93, open: true, sink: 0.035, stations: 124, around: 28 });
  mesh(upperG, std({ map: upperTexture(), roughness: 0.75 }), nUp, "upper");
  mesh(upperG, std({ color: 2763304, roughness: 0.95, side: THREE.BackSide }), nUp, "upper").name = "upper-lining";
  for (const r of OVERLAY_REGIONS) if (!parts[r.id]) node(r.id, r.name, nUp, [0, 0, 0]).userData.realization = "canvas region on upper";
  const nCol = node("collar", "Padded ankle collar", nUp, [0, 0.03, 0]);
  const upRange = xRange(prof.upper);
  const topAt = (x) => (span(prof.upper, x) ?? [0, 0])[1];
  const hwUpper = (x) => interp(PLAN, (x - upRange[0]) / (upRange[1] - upRange[0])) * 0.93;
  const edge = [];
  for (let x = -0.12; x >= -0.47; x -= 0.01) edge.push(new THREE.Vector3(x, topAt(x), Math.min(openingAt(x), hwUpper(x) * 0.8)));
  edge.push(new THREE.Vector3(-0.478, topAt(-0.47) - 4e-3, 0));
  for (let x = -0.47; x <= -0.12; x += 0.01) edge.push(new THREE.Vector3(x, topAt(x), -Math.min(openingAt(x), hwUpper(x) * 0.8)));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 120, 0.013, 12, false), std({ color: 1973790, roughness: 0.9 }), nCol, "collar");
  const nTon = node("tongue", "Tongue", nUp, [0.02, 0.18, 0]);
  const tonguePoly = prof.tongue;
  const tongueTop = (x) => {
    const blob = span(tonguePoly, x)?.[1] ?? 0;
    const w = 1 - smooth(-0.03, 0.03, x);
    return Math.max(topAt(x) + 0.012, topAt(x) + 0.012 + (blob - topAt(x) - 0.012) * w);
  };
  const tPoly = [];
  for (let x = -0.145; x <= 0.185; x += 5e-3) tPoly.push([x, tongueTop(x)]);
  for (let x = 0.185; x >= -0.145; x -= 5e-3) tPoly.push([x, 0.27]);
  mesh(
    loft({
      poly: tPoly,
      widthScale: 1,
      squareness: 3,
      around: 32,
      stations: 90,
      halfWidth: (x, u) => (Math.max(openingAt(x), 0.03) + 0.02) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1)), 0.25)
    }),
    std({ map: tongueTexture(), roughness: 0.85 }),
    nTon,
    "tongue"
  );
  const nTab = node("heel-tab", "Ember heel pull tab", nUp, [-0.12, 0.08, 0]);
  const tabShape = new THREE.Shape(prof["heel-tab"].map(([x, y]) => new THREE.Vector2(x, y)));
  const tabG = new THREE.ExtrudeGeometry(tabShape, { depth: 0.026, bevelEnabled: true, bevelThickness: 6e-3, bevelSize: 5e-3, bevelSegments: 3, curveSegments: 8 });
  tabG.translate(0, 0, -0.013);
  const emberMat = std({ color: 16731418, roughness: 0.45 });
  mesh(tabG, emberMat, nTab, "heel-tab").position.set(-0.012, -0.02, 0);
  const mx = -0.43, my = 0.235;
  const markZ = upperSurfaceZ(mx, my, hwUpper(mx), topAt(mx), (span(prof.upper, mx) ?? [0, 0])[0] - 0.035);
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshStandardMaterial({ map: markTexture(), transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
  mark.position.set(mx, my, markZ + 4e-3);
  mark.rotation.y = -0.35;
  mark.name = "heel-mark";
  mark.userData.partId = "heel-counter";
  parts["heel-counter"].add(mark);
  const nEye = parts["eyestay"];
  const nLace = node("laces", "Laces", nEye, [0, 0.28, 0]);
  const eyeMat = std({ color: 9079429, roughness: 0.35, metalness: 0.6 });
  const laceMat = std({ color: 16119282, roughness: 0.8 });
  const eyeG = new THREE.TorusGeometry(9e-3, 32e-4, 8, 20);
  const eyes = new THREE.InstancedMesh(eyeG, eyeMat, EYELETS.length * 2);
  eyes.name = "eyelets";
  eyes.userData.partId = "eyestay";
  eyes.castShadow = true;
  const dummy = new THREE.Object3D();
  EYELETS.forEach((e, i) => {
    const [x, y] = toWorld(e);
    const zE = upperSurfaceZ(x, y, hwUpper(x), topAt(x), (span(prof.upper, x) ?? [0, 0])[0] - 0.035) + 6e-3;
    for (const s of [1, -1]) {
      dummy.position.set(x, y, s * (zE - 4e-3));
      dummy.rotation.set(0, 0, 0);
      dummy.lookAt(x, y + 0.6, s * (zE + 1));
      dummy.updateMatrix();
      eyes.setMatrixAt(i * 2 + (s === 1 ? 0 : 1), dummy.matrix);
    }
    const mid = new THREE.Vector3(x + 0.03, Math.min(Math.max(tongueTop(x + 0.03), y) + 0.01, topAt(x + 0.03) + 0.035), 0);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, y, zE), new THREE.Vector3(x + 0.018, (y + mid.y) / 2 + 6e-3, zE * 0.75), mid, new THREE.Vector3(x + 0.018, (y + mid.y) / 2 + 6e-3, -zE * 0.75), new THREE.Vector3(x, y, -zE)]);
    const lace = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 9e-3, 8, false), laceMat);
    lace.scale.set(1, 1, 1);
    lace.castShadow = true;
    lace.name = `lace-${i}`;
    lace.userData.partId = "laces";
    nLace.add(lace);
  });
  nEye.add(eyes);
  root.traverse((o) => {
    if (o.userData.explode) o.userData.home = o.position.clone();
  });
  return { root, parts };
}
function upperSurfaceZ(x, y, hw, yt, yb) {
  const zTop = Math.min(openingAt(x), hw * 0.8);
  let best = hw, err = Infinity;
  for (let k = 0; k <= 200; k++) {
    const phi = k / 200 * Math.PI / 2;
    const yy = yb + (yt - yb) * Math.pow(Math.sin(phi), 1.15);
    if (Math.abs(yy - y) < err) {
      err = Math.abs(yy - y);
      best = zTop + (hw - zTop) * Math.pow(Math.cos(phi), 0.5);
    }
  }
  return best;
}
function setExplode(root, amount) {
  root.traverse((o) => {
    const e = o.userData.explode, h = o.userData.home;
    if (e && h) o.position.copy(h).addScaledVector(e, amount);
  });
}
export {
  OVERLAY_REGIONS,
  createAetherSneakerModel,
  setExplode
};
