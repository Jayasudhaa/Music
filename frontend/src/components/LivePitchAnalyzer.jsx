import React, { useRef, useState, useEffect } from "react";

/* =======================
   CONSTANTS
======================= */

const RATIOS = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8];
const NAMES = ["Sa", "Ri", "Ga", "Ma", "Pa", "Da", "Ni"];

const TOTAL_SWARAS = 21; // 3 octaves
const WINDOW_SECONDS = 6;

/* =======================
   COMPONENT
======================= */

export default function LivePitchAnalyzer({ selectedShruti = 293.66 }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  // ✅ FIX: keep SA in a ref so the running loop always sees the latest shruthi
  const saRef = useRef(selectedShruti / 2);

  // ✅ FIX: keep mutable data in refs (not re-created on render)
  const swaraDataRef = useRef([]);
  const lastIndexRef = useRef(null);

  const [live, setLive] = useState("—");
  const [running, setRunning] = useState(false);

  const MIN_RMS = 0.015;
  const MAX_JUMP = 3;

  /* =======================
     UPDATE SA WHEN SHRUTHI CHANGES
  ======================= */

  useEffect(() => {
    saRef.current = selectedShruti / 2;
    // Optional: clear old points so the graph re-anchors cleanly on shruthi change
    // swaraDataRef.current = [];
    // lastIndexRef.current = null;
  }, [selectedShruti]);

  /* =======================
     AUTOCORRELATION
  ======================= */

  const autocorrelate = (buf, sr) => {
    let best = 0;
    let bestLag = 0;

    for (let lag = 80; lag < 900; lag++) {
      let sum = 0;
      for (let i = 0; i < 900; i++) sum += buf[i] * buf[i + lag];
      if (sum > best) {
        best = sum;
        bestLag = lag;
      }
    }
    return bestLag ? sr / bestLag : null;
  };

  const freqToIndex = (freq) => {
    let best = null;
    let bestCents = 999999;

    // ✅ use latest SA from ref
    const SA = saRef.current;

    for (let o = -1; o <= 1; o++) {
      for (let i = 0; i < 7; i++) {
        const f = SA * RATIOS[i] * Math.pow(2, o);
        const cents = Math.abs(1200 * Math.log2(freq / f));
        if (cents < bestCents) {
          bestCents = cents;
          best = 7 * (o + 1) + i;
        }
      }
    }
    return best;
  };

  /* =======================
     DRAW GRAPH
  ======================= */

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");

    const now = performance.now() / 1000;

    g.clearRect(0, 0, canvas.width, canvas.height);

    const stepY = canvas.height / TOTAL_SWARAS;

    /* -------- GRID + LABELS -------- */

    g.font = "14px Arial";
    g.textAlign = "right";
    g.strokeStyle = "#222";
    g.fillStyle = "#aaa";

    for (let o = 1; o >= -1; o--) {
      for (let i = 6; i >= 0; i--) {
        const idx = 7 * (o + 1) + i;
        const y = canvas.height - (idx + 0.5) * stepY;

        g.beginPath();
        g.moveTo(70, y);
        g.lineTo(canvas.width, y);
        g.stroke();

        let label = NAMES[i];
        if (o === 1) label += "+";
        if (o === -1) label += "-";

        g.fillText(label, 65, y + 5);
      }
    }

    /* -------- SA REFERENCE LINE --------
       NOTE: This is "Sa row" (middle octave Sa).
       The *frequency* mapping for that row uses selectedShruti via saRef.current.
    */

    const saIndex = 7; // middle Sa row (S)
    const saY = canvas.height - (saIndex + 0.5) * stepY;

    g.strokeStyle = "#ffd700";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(70, saY);
    g.lineTo(canvas.width, saY);
    g.stroke();

    g.fillStyle = "#ffd700";
    g.textAlign = "right";
    g.fillText(`Sa (Shruthi: ${selectedShruti.toFixed(2)} Hz)`, canvas.width - 10, saY - 6);

    /* -------- TIME AXIS -------- */

    g.textAlign = "center";
    g.fillStyle = "#888";

    for (let i = 0; i <= WINDOW_SECONDS; i++) {
      const x = 70 + (i / WINDOW_SECONDS) * (canvas.width - 70);

      g.strokeStyle = "#222";
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, canvas.height);
      g.stroke();

      // countdown labels (right = now)
      g.fillText(`${WINDOW_SECONDS - i}s`, x, canvas.height - 5);
    }

    /* -------- PITCH CURVE -------- */

    const swaraData = swaraDataRef.current;

    for (let i = 1; i < swaraData.length; i++) {
      const p1 = swaraData[i - 1];
      const p2 = swaraData[i];

      // skip old points
      if (now - p2.t > WINDOW_SECONDS) continue;

      const x1 =
        70 +
        ((WINDOW_SECONDS - (now - p1.t)) / WINDOW_SECONDS) *
          (canvas.width - 70);

      const x2 =
        70 +
        ((WINDOW_SECONDS - (now - p2.t)) / WINDOW_SECONDS) *
          (canvas.width - 70);

      const y1 = canvas.height - (p1.v + 0.5) * stepY;
      const y2 = canvas.height - (p2.v + 0.5) * stepY;

      const octave = Math.floor(p2.v / 7) - 1;

      // 3 octave colors
      g.strokeStyle =
        octave === -1 ? "#00aaff" : // lower
        octave === 0 ? "#00ff99" :  // middle
        "#ffd700";                  // upper

      g.lineWidth = 2;

      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
  };

  /* =======================
     MAIN LOOP
  ======================= */

  const loop = () => {
    const analyser = analyserRef.current;
    const ctx = audioRef.current;

    if (!analyser || !ctx) return;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);

    if (rms > MIN_RMS) {
      const f = autocorrelate(buf, ctx.sampleRate);

      if (f && f > 80 && f < 1500) {
        const idx = freqToIndex(f);

        if (idx !== null) {
          const last = lastIndexRef.current;

          if (last === null || Math.abs(idx - last) <= MAX_JUMP) {
            swaraDataRef.current.push({
              t: performance.now() / 1000,
              v: idx,
            });

            // keep only last WINDOW_SECONDS worth of points (memory safe)
            const now = performance.now() / 1000;
            swaraDataRef.current = swaraDataRef.current.filter(p => now - p.t <= WINDOW_SECONDS);

            lastIndexRef.current = idx;

            const o = Math.floor(idx / 7) - 1;
            const n = NAMES[idx % 7];
            setLive(n + (o > 0 ? "+" : o < 0 ? "-" : ""));
          }
        }
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  };

  /* =======================
     START / STOP
  ======================= */

  const start = async () => {
    // reset buffers for a clean run
    swaraDataRef.current = [];
    lastIndexRef.current = null;
    setLive("—");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const mic = audioRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      mic.connect(analyserRef.current);

      setRunning(true);
      loop();
    } catch (e) {
      console.error(e);
      setRunning(false);
      setLive("Mic denied");
    }
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch {}

    audioRef.current?.close();
    audioRef.current = null;
    analyserRef.current = null;

    setRunning(false);
  };

  // stop on unmount
  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================
     UI
  ======================= */

  return (
    <div style={{ padding: 20, border: "3px solid #e74c3c", borderRadius: 8 }}>
      <h2>🎤 Live Pitch Analyzer</h2>

      {!running ? (
        <button onClick={start}>▶ Start</button>
      ) : (
        <button onClick={stop}>⏹ Stop</button>
      )}

      <div style={{ fontSize: 48, margin: 10, color: "#00ff99" }}>{live}</div>

      <canvas
        ref={canvasRef}
        width={1100}
        height={650}
        style={{
          background: "#000",
          border: "2px solid #333",
          borderRadius: 10,
        }}
      />
    </div>
  );
}
