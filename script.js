/* ================================================================
   MÉTODOS DE BÚSQUEDA — motor de deck lateral cinematográfico
   ================================================================ */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ACCENTS = { purple: "#8b5cf6", lilac: "#b794ff", white: "#f4f3f8" };

  /* ================================================================
     1 · MAZO LATERAL
     ================================================================ */
  const track = $("#track");
  const slides = $$(".slide");
  const wipe = $("#wipe");
  const counter = $("#slide-count");
  const progress = $("#progress-bar");
  const hint = $("#hint");
  const rail = $("#rail");

  const RAIL_LABELS = ["Portada", "Planteamiento", "Secuencial", "Binaria", "Hash", "Comparativa", "Aplicaciones", "Conclusiones", "Referencias"];
  let index = 0;
  let locked = false;

  // índice lateral
  RAIL_LABELS.forEach((label, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<i></i><span>${String(i + 1).padStart(2, "0")} · ${label}</span>`;
    b.addEventListener("click", () => goTo(i));
    rail.appendChild(b);
  });
  const railBtns = $$("#rail button");

  // esquinas de encuadre en cada lámina
  slides.forEach((s) => {
    const c = document.createElement("div");
    c.className = "corners";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = "<i></i><i></i><i></i><i></i>";
    s.appendChild(c);
  });

  function goTo(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === index || locked) return;

    locked = true;

    // panel barrido (morado / blanco alternado) con color de la lámina destino
    wipe.classList.toggle("light", i % 2 === 1);
    wipe.classList.remove("run");
    void wipe.offsetWidth;            // reinicia la animación
    wipe.classList.add("run");

    // lámina saliente: desenfoque cinematográfico
    const old = slides[index];
    old.classList.remove("active");
    old.classList.add("leaving");
    setTimeout(() => old.classList.remove("leaving"), 950);

    // desplazamiento lateral del mazo
    track.style.transform = `translate3d(${-i * 100}vw, 0, 0)`;

    // revelados escalonados en la lámina destino
    setTimeout(() => slides[i].classList.add("active"), reduced ? 0 : 380);

    index = i;
    sync();

    setTimeout(() => { locked = false; }, reduced ? 60 : 1020);
  }

  function sync() {
    document.body.dataset.slide = index;
    counter.textContent = String(index + 1).padStart(2, "0");
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    railBtns.forEach((b, i) => b.classList.toggle("on", i === index));
    document.body.style.setProperty("--acc", ACCENTS[slides[index].dataset.accent]);
    if (index > 0) hint.classList.add("hide");
    onSlideEnter(index);
  }

  // rueda → lateral
  let wheelAcc = 0, wheelReset;
  window.addEventListener("wheel", (e) => {
    if (locked) return;
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    wheelAcc += d;
    clearTimeout(wheelReset);
    wheelReset = setTimeout(() => (wheelAcc = 0), 220);
    if (wheelAcc > 55) { goTo(index + 1); wheelAcc = 0; }
    else if (wheelAcc < -55) { goTo(index - 1); wheelAcc = 0; }
  }, { passive: true });

  // teclado
  window.addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); goTo(index + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); goTo(index - 1); }
    if (e.key === "Home") goTo(0);
    if (e.key === "End") goTo(slides.length - 1);
  });

  // táctil
  let tX = 0, tY = 0;
  window.addEventListener("touchstart", (e) => { tX = e.touches[0].clientX; tY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tX;
    const dy = e.changedTouches[0].clientY - tY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) goTo(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  $("#restart").addEventListener("click", () => goTo(0));

  /* ================================================================
     2 · TIPOGRAFÍA CINÉTICA (palabra por palabra)
     ================================================================ */
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = "1";
    const nodes = [...el.childNodes];
    el.textContent = "";
    let n = 0;
    const addWord = (content) => {
      const w = document.createElement("span"); w.className = "w";
      const i = document.createElement("span"); i.className = "wi";
      i.style.setProperty("--d", `${n * 65}ms`);
      if (typeof content === "string") i.textContent = content;
      else i.appendChild(content);
      w.appendChild(i); el.appendChild(w); n++;
    };
    nodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/\s+/).filter(Boolean).forEach(addWord);
      } else if (node.nodeType === 1 && node.tagName === "BR") {
        el.appendChild(node);
      } else if (node.nodeType === 1) {
        addWord(node);
      }
    });
  }
  $$("h2").forEach(splitWords);

  /* ================================================================
     3 · CURSOR, IMÁN, INCLINACIÓN Y PARALLAX
     ================================================================ */
  const cursor = $("#cursor");
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    const px = (e.clientX / innerWidth) * 2 - 1;
    const py = (e.clientY / innerHeight) * 2 - 1;
    document.documentElement.style.setProperty("--px", px.toFixed(3));
    document.documentElement.style.setProperty("--py", py.toFixed(3));
  });

  const HOVER = "a, button, input, .door, .real-card, .concl-card, .def, [data-tilt], [data-magnet], .mini";
  document.addEventListener("mouseover", (e) => { if (e.target.closest(HOVER)) cursor.classList.add("big"); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest(HOVER)) cursor.classList.remove("big"); });

  // inclinación 3D
  $$("[data-tilt]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  // efecto imán
  $$("[data-magnet]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.16}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  /* ================================================================
     4 · TIMECODE (HUD cinematográfico)
     ================================================================ */
  const tcEl = $("#timecode");
  const tcStart = Date.now();
  const pad = (v) => String(v).padStart(2, "0");
  setInterval(() => {
    const ms = Date.now() - tcStart;
    const hh = Math.floor(ms / 3600000);
    const mm = Math.floor(ms / 60000) % 60;
    const ss = Math.floor(ms / 1000) % 60;
    const ff = Math.floor((ms % 1000) / (1000 / 24));
    tcEl.textContent = `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  }, 80);

  /* ================================================================
     5 · PARTÍCULAS DE TINTA (fondo)
     ================================================================ */
  const fx = $("#fx");
  const fxc = fx.getContext("2d");
  let parts = [];

  function fitFx() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    fx.style.width = innerWidth + "px"; fx.style.height = innerHeight + "px";
    fxc.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: 42 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: 1 + Math.random() * 2.4, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      a: 0.05 + Math.random() * 0.14, d: 0.2 + Math.random() * 0.8, dash: Math.random() < 0.35
    }));
  }
  fitFx();

  function drawFx() {
    fxc.clearRect(0, 0, innerWidth, innerHeight);
    const ox = (mx / innerWidth - 0.5) * 26, oy = (my / innerHeight - 0.5) * 26;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = innerWidth + 20; if (p.x > innerWidth + 20) p.x = -20;
      if (p.y < -20) p.y = innerHeight + 20; if (p.y > innerHeight + 20) p.y = -20;
      fxc.globalAlpha = p.a;
      fxc.fillStyle = "#b794ff";
      const x = p.x + ox * p.d, y = p.y + oy * p.d;
      if (p.dash) { fxc.fillRect(x, y, p.r * 5, 1.4); }
      else { fxc.beginPath(); fxc.arc(x, y, p.r, 0, 7); fxc.fill(); }
    }
    fxc.globalAlpha = 1;
  }

  /* ================================================================
     6 · CONTEXTOS DE CANVAS (DPR) + utilidades
     ================================================================ */
  function ctx2d(id) {
    const c = $(id);
    if (!c) return null;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth || 560, h = c.clientHeight || 240;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  const INK = "#f4f3f8";
  const DIM = "#9b97ad";
  const CELL = "#1a1726";
  const PUR = "#8b5cf6";
  const LIL = "#b794ff";

  // rejilla técnica de fondo
  function gridBg(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(183,148,255,0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    ctx.restore();
  }

  // esquinas técnicas dentro del canvas
  function frameMarks(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(183,148,255,0.55)";
    ctx.lineWidth = 1.5;
    const m = 7, L = 12;
    [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y);
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ================================================================
     7 · FIG. 01 · SECUENCIAL
     ================================================================ */
  const scan = { phase: "run", step: 0, target: 0, nums: [], found: -1, acc: 0 };
  const SCAN_N = 20;

  function scanReset() {
    scan.nums = Array.from({ length: SCAN_N }, () => 10 + Math.floor(Math.random() * 890));
    scan.target = scan.nums[Math.floor(Math.random() * scan.nums.length)];
    scan.step = 0; scan.found = -1; scan.acc = 0; scan.phase = "run";
    $("#scan-target").textContent = scan.target;
    $("#scan-count").textContent = "0";
    $("#scan-status").textContent = "● evaluando";
  }

  function drawScan(dt) {
    const v = ctx2d("#cv-scan"); if (!v) return;
    const { ctx, w, h } = v;
    ctx.clearRect(0, 0, w, h);
    gridBg(ctx, w, h);
    frameMarks(ctx, w, h);
    scan.acc += dt;

    if (scan.phase === "run" && scan.acc > 330) {
      scan.acc = 0;
      $("#scan-count").textContent = ++scan.step;
      if (scan.nums[scan.step - 1] === scan.target) {
        scan.found = scan.step - 1; scan.phase = "found";
        $("#scan-status").textContent = "● objetivo localizado";
      } else if (scan.step >= SCAN_N) {
        scan.phase = "gone"; $("#scan-status").textContent = "● no encontrado";
      }
    } else if (scan.phase === "found" && scan.acc > 1600) { scanReset(); }
    else if (scan.phase === "gone" && scan.acc > 1400) { scanReset(); }

    // etiqueta técnica superior
    ctx.fillStyle = DIM; ctx.font = '10px "Space Mono", monospace'; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("FIG. 01 · BÚSQUEDA SECUENCIAL · O(n)", 14, 16);
    ctx.textAlign = "right";
    ctx.fillStyle = LIL;
    ctx.fillText("n = 20", w - 14, 16);

    // celdas
    const padX = 14, gap = 6;
    const cw = (w - padX * 2 - gap * (SCAN_N - 1)) / SCAN_N;
    const y = h / 2 - 26;
    for (let i = 0; i < SCAN_N; i++) {
      const x = padX + i * (cw + gap);
      const done = i < scan.step - 1 || (scan.phase !== "run" && i <= scan.step - 1);
      const cur = i === scan.step - 1 && scan.phase === "run";
      const hit = i === scan.found;
      ctx.save();
      if (hit || cur) { ctx.shadowColor = hit ? PUR : LIL; ctx.shadowBlur = 16; }
      ctx.beginPath();
      ctx.roundRect(x, y, cw, 56, 8);
      ctx.fillStyle = hit ? PUR : cur ? "rgba(139,92,246,0.25)" : done ? "rgba(244,243,248,0.06)" : CELL;
      ctx.fill();
      ctx.lineWidth = hit || cur ? 2 : 1.2;
      ctx.strokeStyle = hit || cur ? LIL : "rgba(244,243,248,0.3)";
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = hit ? "#0a090f" : INK;
      ctx.font = `700 ${cw < 34 ? 9 : 11}px "Space Mono", monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(scan.nums[i], x + cw / 2, y + 28);
      // índice de posición
      if (i % 5 === 0) {
        ctx.fillStyle = DIM; ctx.font = '9px "Space Mono", monospace';
        ctx.fillText(`[${i}]`, x + cw / 2, y + 70);
      }
    }

    // aguja del evaluador con resplandor y pulso
    if (scan.phase === "run" || scan.phase === "found") {
      const i = scan.phase === "found" ? scan.found : scan.step - 1;
      const x = padX + i * (cw + gap) + cw / 2;
      ctx.save();
      ctx.shadowColor = LIL; ctx.shadowBlur = 14;
      ctx.strokeStyle = LIL; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5, y - 28); ctx.lineTo(x + 5, y - 28); ctx.lineTo(x, y - 20); ctx.closePath();
      ctx.fillStyle = LIL; ctx.fill();
      ctx.restore();
      // anillo de pulso
      const pulse = (scan.acc % 700) / 700;
      ctx.strokeStyle = `rgba(183,148,255,${0.6 * (1 - pulse)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y + 28, 20 + pulse * 16, 0, 7); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(scan.phase === "found" ? "◆ localizado" : "evaluar", x, y - 38);
    }

    // barra de avance
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(244,243,248,0.1)";
    ctx.fillRect(padX, h - 24, w - padX * 2, 6);
    ctx.save();
    ctx.shadowColor = PUR; ctx.shadowBlur = 10;
    ctx.fillStyle = PUR;
    ctx.fillRect(padX, h - 24, ((scan.found >= 0 ? scan.found + 1 : scan.step) / SCAN_N) * (w - padX * 2), 6);
    ctx.restore();
    ctx.fillStyle = DIM; ctx.font = '10px "Space Mono", monospace'; ctx.textAlign = "left";
    ctx.fillText("recorrido de la estructura →", padX, h - 32);
    ctx.textAlign = "right"; ctx.fillStyle = LIL;
    ctx.fillText(`${Math.round(((scan.found >= 0 ? scan.found + 1 : scan.step) / SCAN_N) * 100)}%`, w - padX, h - 32);
  }

  /* ================================================================
     8 · FIG. 02 · BINARIA
     ================================================================ */
  const bin = { acc: 0, lo: 0, hi: 1023, target: 777, mid: 512, steps: 0, phase: "wait", done: false, hist: [] };

  function binReset() {
    bin.lo = 0; bin.hi = 1023; bin.target = 200 + Math.floor(Math.random() * 700);
    bin.steps = 0; bin.phase = "wait"; bin.acc = 0; bin.done = false; bin.hist = [1024];
    bin.mid = Math.floor((bin.lo + bin.hi) / 2);
    $("#bin-count").textContent = "0";
    $("#bin-window").textContent = "1024";
    $("#bin-status").textContent = "● calculando";
  }

  function drawBin(dt) {
    const v = ctx2d("#cv-bin"); if (!v) return;
    const { ctx, w, h } = v;
    ctx.clearRect(0, 0, w, h);
    gridBg(ctx, w, h);
    frameMarks(ctx, w, h);
    bin.acc += dt;

    const padX = 16, y = h / 2 + 2, span = w - padX * 2;
    const X = (n) => padX + (n / 1023) * span;

    // etiqueta técnica superior
    ctx.fillStyle = DIM; ctx.font = '10px "Space Mono", monospace'; ctx.textAlign = "left";
    ctx.fillText("FIG. 02 · DIVISIÓN DEL ESPACIO · O(log n)", 14, 16);
    ctx.textAlign = "right"; ctx.fillStyle = LIL;
    ctx.fillText("n = 1024", w - 14, 16);

    // zonas descartadas (trama diagonal)
    const x0 = X(bin.lo), x1 = X(bin.hi);
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, y - 44, Math.max(x0 - padX, 0), 88);
    ctx.rect(x1, y - 44, Math.max(w - padX - x1, 0), 88);
    ctx.clip();
    ctx.strokeStyle = "rgba(244,243,248,0.13)";
    ctx.lineWidth = 1;
    for (let d = -96; d < w + 96; d += 9) {
      ctx.beginPath(); ctx.moveTo(padX + d, y + 44); ctx.lineTo(padX + d + 96, y - 44); ctx.stroke();
    }
    ctx.restore();

    // eje con marcas
    ctx.strokeStyle = "rgba(244,243,248,0.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - padX, y); ctx.stroke();
    ctx.fillStyle = "rgba(244,243,248,0.4)";
    for (let n = 0; n <= 1023; n += 32) ctx.fillRect(X(n), y - 4, 1, 8);

    // ventana viva con resplandor
    ctx.save();
    ctx.shadowColor = LIL; ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(183,148,255,0.16)";
    ctx.fillRect(x0, y - 44, Math.max(x1 - x0, 3), 88);
    ctx.strokeStyle = LIL; ctx.lineWidth = 2;
    ctx.strokeRect(x0, y - 44, Math.max(x1 - x0, 3), 88);
    ctx.restore();
    ctx.fillStyle = LIL; ctx.font = '700 11px "Space Mono", monospace'; ctx.textAlign = "center";
    ctx.fillText(`ventana = ${bin.hi - bin.lo + 1}`, (x0 + x1) / 2, y + 58);

    // objetivo con resplandor
    ctx.save();
    ctx.shadowColor = PUR; ctx.shadowBlur = 16;
    ctx.fillStyle = PUR;
    ctx.beginPath(); ctx.arc(X(bin.target), y, 6, 0, 7); ctx.fill();
    ctx.restore();
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.fillText(`objetivo = ${bin.target}`, X(bin.target), y - 54);

    // punto medio
    if (!bin.done) {
      const xm = X(bin.mid);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xm, y - 32); ctx.lineTo(xm, y + 32); ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(xm, y, 5, 0, 7); ctx.fill();
      ctx.font = '700 12px "Space Grotesk", sans-serif';
      ctx.fillText(bin.target < bin.mid ? "mid > objetivo" : "mid < objetivo", xm, y - 38);
    } else {
      ctx.save();
      ctx.shadowColor = PUR; ctx.shadowBlur = 14;
      ctx.fillStyle = PUR; ctx.font = '700 13px "Space Grotesk", sans-serif';
      ctx.fillText(`◆ localizado en ${bin.steps} comparaciones`, w / 2, y - 38);
      ctx.restore();
    }

    // historial de ventanas
    ctx.fillStyle = DIM; ctx.font = '10px "Space Mono", monospace'; ctx.textAlign = "left";
    ctx.fillText(`hist: ${bin.hist.slice(-7).join(" → ")}${bin.hist.length > 7 ? " …" : ""}`, padX, h - 14);
    ctx.textAlign = "right"; ctx.fillStyle = LIL;
    ctx.fillText(`iteración ${bin.steps}`, w - padX, h - 14);

    // ciclo
    if (bin.phase === "wait" && bin.acc > 700) { bin.phase = "step"; bin.acc = 0; }
    else if (bin.phase === "step" && bin.acc > 850) {
      bin.acc = 0;
      if (bin.target === bin.mid) { bin.done = true; bin.phase = "done"; $("#bin-status").textContent = "● localizado"; }
      else if (bin.target < bin.mid) bin.hi = bin.mid - 1;
      else bin.lo = bin.mid + 1;
      bin.mid = Math.floor((bin.lo + bin.hi) / 2);
      bin.steps++;
      bin.hist.push(bin.hi - bin.lo + 1);
      $("#bin-count").textContent = bin.steps;
      $("#bin-window").textContent = bin.hi - bin.lo + 1;
    } else if (bin.phase === "done" && bin.acc > 2400) { binReset(); }
  }

  /* ================================================================
     9 · FIG. 03 · HASH
     ================================================================ */
  const hash = { keys: [], buckets: [[], [], [], []], i: 0, acc: 0, col: 0, phase: "fill", flash: -1, flashT: 0 };
  const HASH_KEYS = [17, 42, 8, 63, 25, 90, 31, 56, 12, 74, 5, 48];

  function hashReset() {
    hash.keys = [...HASH_KEYS]; hash.buckets = [[], [], [], []]; hash.i = 0;
    hash.col = 0; hash.phase = "fill"; hash.acc = 0; hash.flash = -1; hash.flashT = 0;
    $("#hash-col").textContent = "0";
    $("#hash-status").textContent = "● construyendo";
  }

  function drawHash(dt) {
    const v = ctx2d("#cv-hash"); if (!v) return;
    const { ctx, w, h } = v;
    ctx.clearRect(0, 0, w, h);
    gridBg(ctx, w, h);
    frameMarks(ctx, w, h);
    hash.acc += dt;
    if (hash.flash >= 0) hash.flashT += dt;

    const bw = (w - 36) / 4;
    const rectH = 64, baseY = h - 96;

    // etiqueta técnica superior
    ctx.fillStyle = DIM; ctx.font = '10px "Space Mono", monospace'; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("FIG. 03 · TABLA DE DISPERSIÓN · O(1)", 14, 16);
    ctx.textAlign = "right"; ctx.fillStyle = LIL;
    ctx.fillText(`m = 4 · ${hash.i}/${hash.keys.length} claves`, w - 14, 16);

    // caja de la función de dispersión
    const boxW = Math.min(w - 120, 300), bx = (w - boxW) / 2, by = 26, bh = 26;
    ctx.save();
    ctx.shadowColor = PUR; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.roundRect(bx, by, boxW, bh, 7);
    ctx.fillStyle = "rgba(139,92,246,0.2)"; ctx.fill();
    ctx.strokeStyle = PUR; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = INK; ctx.font = '700 12px "Space Mono", monospace';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    let eq = "h(k) = k mod m";
    if (hash.phase === "fill" && hash.i < hash.keys.length) {
      const k = hash.keys[hash.i];
      eq = `h(${k}) = ${k} mod 4 = ${k % 4}`;
    } else if (hash.phase === "query") {
      const k = hash.keys[Math.floor(hash.acc / 1300) % hash.keys.length];
      eq = `buscar(${k}) → casillero ${k % 4}`;
    }
    ctx.fillText(eq, w / 2, by + bh / 2 + 1);

    // casilleros
    for (let b = 0; b < 4; b++) {
      const x = 18 + b * bw;
      const isFlash = hash.flash === b && hash.flashT < 600;
      ctx.save();
      if (isFlash) { ctx.shadowColor = PUR; ctx.shadowBlur = 20; }
      ctx.strokeStyle = isFlash ? PUR : "rgba(244,243,248,0.5)";
      ctx.lineWidth = isFlash ? 2.4 : 1.6;
      ctx.setLineDash(isFlash ? [] : [6, 5]);
      ctx.strokeRect(x, baseY, bw - 8, rectH);
      ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = DIM; ctx.font = '700 10px "Space Mono", monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`casillero ${b}`, x + (bw - 8) / 2, baseY + rectH + 14);

      // claves apiladas
      hash.buckets[b].forEach((k, j) => {
        const yy = baseY + 8 + j * 15;
        ctx.save();
        if (isFlash) { ctx.shadowColor = PUR; ctx.shadowBlur = 12; }
        ctx.fillStyle = j > 0 ? PUR : LIL;
        ctx.beginPath(); ctx.roundRect(x + 6, yy, bw - 20, 13, 3); ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#0a090f"; ctx.font = '700 9px "Space Mono", monospace';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(k, x + (bw - 8) / 2, yy + 7);
      });
    }

    // clave en vuelo
    if (hash.phase === "fill" && hash.i < hash.keys.length) {
      const k = hash.keys[hash.i];
      const b = k % 4;
      const targetY = baseY + 8 + hash.buckets[b].length * 15;
      const startY = by + bh + 12;
      const t = Math.min(hash.acc / 620, 1);
      const yy = startY + (targetY - startY) * (1 - Math.pow(1 - t, 3));
      const x = 18 + b * bw;
      const cx0 = w / 2;
      const xx = cx0 + (x + (bw - 8) / 2 - cx0) * t;

      // línea de trayectoria punteada
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(183,148,255,0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx0, startY); ctx.lineTo(xx, yy); ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = PUR; ctx.shadowBlur = 16;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.roundRect(xx - 16, yy - 7, 32, 17, 4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#0a090f"; ctx.font = '700 11px "Space Mono", monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(k, xx, yy + 2);

      if (t >= 1) {
        if (hash.buckets[b].length > 0) { hash.col++; $("#hash-col").textContent = hash.col; }
        hash.buckets[b].push(k); hash.i++; hash.acc = 0;
        hash.flash = b; hash.flashT = 0;
      }
    } else if (hash.phase === "fill" && hash.i >= hash.keys.length) {
      hash.phase = "query"; hash.acc = 0; hash.flash = -1;
      $("#hash-status").textContent = "● consulta directa";
    } else if (hash.phase === "query") {
      const k = hash.keys[Math.floor(hash.acc / 1300) % hash.keys.length];
      const b = k % 4;
      const x = 18 + b * bw;
      ctx.save();
      ctx.shadowColor = LIL; ctx.shadowBlur = 22;
      ctx.fillStyle = "rgba(183,148,255,0.2)";
      ctx.fillRect(x - 3, baseY - 5, bw - 2, rectH + 10);
      ctx.strokeStyle = LIL; ctx.lineWidth = 2.4;
      ctx.strokeRect(x - 3, baseY - 5, bw - 2, rectH + 10);
      ctx.restore();
      ctx.fillStyle = LIL; ctx.font = '700 12px "Space Grotesk", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`◆ ${k} → 1 salto · O(1)`, w / 2, baseY - 16);
      if (hash.acc > 3600) hashReset();
    }

  }

  /* ================================================================
     10 · COMPARATIVA INTERACTIVA
     ================================================================ */
  const range = $("#size-range");
  const fmt = (n) => n.toLocaleString("es-MX");

  function updateCmp() {
    const n = +range.value;
    const seq = n;
    const binv = Math.max(1, Math.round(Math.log2(n)));
    const hashv = 1;
    $("#size-out").textContent = fmt(n);
    $("#val-seq").textContent = fmt(seq);
    $("#val-bin").textContent = fmt(binv);
    $("#val-hash").textContent = fmt(hashv);

    const maxLog = Math.log10(1000000 + 1);
    const w = (v) => Math.max(2, (Math.log10(v + 1) / maxLog) * 100);
    $("#bar-seq").style.width = w(seq) + "%";
    $("#bar-bin").style.width = w(binv) + "%";
    $("#bar-hash").style.width = w(hashv) + "%";
  }
  range.addEventListener("input", updateCmp);

  /* ================================================================
     11 · ARRANQUE
     ================================================================ */
  const onSlideEnter = (i) => {
    if (i === 5) updateCmp();
    if (i === 2 && !scan.nums.length) scanReset();
    if (i === 3 && !bin.steps && !bin.done) binReset();
    if (i === 4 && !hash.keys.length) hashReset();
  };

  /* ================================================================
     12 · BUCLE PRINCIPAL
     ================================================================ */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(now - last, 48); last = now;
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    drawFx();
    if (index === 2) drawScan(dt);
    if (index === 3) drawBin(dt);
    if (index === 4) drawHash(dt);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", fitFx);

  // arranque
  slides[0].classList.add("active");
  scanReset(); binReset(); hashReset(); updateCmp(); sync();
  requestAnimationFrame(loop);

  // obturador de apertura cinematográfico
  setTimeout(() => document.body.classList.add("ready"), reduced ? 0 : 250);
})();
