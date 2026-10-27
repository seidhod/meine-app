"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "menu" | "help" | "playing" | "paused" | "over";
type Action = "start" | "flap" | "pause" | "menu" | "help";

type Gate = {
  x: number;
  center: number;
  collected: boolean;
  passed: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

type Game = {
  mode: Mode;
  y: number;
  velocity: number;
  gates: Gate[];
  particles: Particle[];
  score: number;
  tools: number;
  passed: number;
  best: number;
  record: boolean;
  time: number;
  distance: number;
  bonus: number;
};

type View = Pick<
  Game,
  "mode" | "score" | "tools" | "best" | "record"
>;

const W = 420;
const H = 700;
const FLOOR = 650;
const PX = 105;
const RADIUS = 17;
const GATE_WIDTH = 68;
const GAP = 198;
const SPACING = 265;
const RECORD_KEY = "flappy-paul-best-v1";

function freshGame(best = 0): Game {
  return {
    mode: "menu",
    y: 320,
    velocity: 0,
    gates: [],
    particles: [],
    score: 0,
    tools: 0,
    passed: 0,
    best,
    record: false,
    time: 0,
    distance: 0,
    bonus: 0,
  };
}

function hitsRectangle(
  cx: number,
  cy: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const nearestX = Math.max(x, Math.min(cx, x + width));
  const nearestY = Math.max(y, Math.min(cy, y + height));

  return (
    (cx - nearestX) ** 2 + (cy - nearestY) ** 2 <
    RADIUS ** 2
  );
}

function drawPaul(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  time: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Flügel.
  ctx.fillStyle = "#f6fdff";
  ctx.strokeStyle = "#b2d2df";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(
    -22,
    15,
    18,
    9,
    -0.5 + Math.sin(time * 18) * 0.25,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();

  // Shirt.
  ctx.fillStyle = "#3478f6";
  ctx.beginPath();
  ctx.roundRect(-16, 13, 33, 21, 9);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("P", 1, 29);

  // Ohren.
  ctx.fillStyle = "#efb78c";
  ctx.beginPath();
  ctx.arc(-23, 0, 6, 0, Math.PI * 2);
  ctx.arc(23, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Gesicht.
  ctx.fillStyle = "#ffd1a6";
  ctx.beginPath();
  ctx.arc(0, -3, 25, 0, Math.PI * 2);
  ctx.fill();

  // Blonde Haare.
  ctx.fillStyle = "#ffd347";
  ctx.beginPath();
  ctx.moveTo(-25, -7);
  ctx.bezierCurveTo(-30, -39, 21, -42, 26, -10);
  ctx.lineTo(17, -17);
  ctx.lineTo(11, -9);
  ctx.lineTo(3, -18);
  ctx.lineTo(-5, -10);
  ctx.lineTo(-13, -18);
  ctx.lineTo(-20, -7);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#e6ad28";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -24);
  ctx.quadraticCurveTo(-2, -32, 13, -24);
  ctx.stroke();

  // Brille.
  ctx.strokeStyle = "#24344b";
  ctx.fillStyle = "rgba(231,250,255,0.8)";
  ctx.lineWidth = 3;

  for (const x of [-11, 11]) {
    ctx.beginPath();
    ctx.roundRect(x - 9, -9, 18, 16, 5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-2, -3);
  ctx.lineTo(2, -3);
  ctx.moveTo(-25, -5);
  ctx.lineTo(-20, -4);
  ctx.moveTo(20, -4);
  ctx.lineTo(25, -5);
  ctx.stroke();

  // Augen.
  ctx.fillStyle = "#24344b";
  ctx.beginPath();
  ctx.arc(-9, -1, 2.5, 0, Math.PI * 2);
  ctx.arc(13, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Wangen.
  ctx.fillStyle = "rgba(238,128,109,0.4)";
  ctx.beginPath();
  ctx.ellipse(-16, 10, 5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(18, 10, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lächeln.
  ctx.strokeStyle = "#a85d4c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(3, 9, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.restore();
}

function drawTool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 4) * 4);

  ctx.fillStyle = "rgba(255,218,94,0.22)";
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffdc69";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#edf8ff";
  ctx.fillRect(-3, -20, 6, 27);

  ctx.fillStyle = "#9db5c9";
  ctx.fillRect(-5, -25, 10, 7);

  ctx.fillStyle = "#ff7840";
  ctx.beginPath();
  ctx.roundRect(-8, 1, 16, 23, 5);
  ctx.fill();

  ctx.fillStyle = "#ad3f25";
  ctx.fillRect(-3, 6, 2, 13);
  ctx.fillRect(2, 6, 2, 13);

  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  game: Game,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#79c8f4");
  sky.addColorStop(0.65, "#d2f0f6");
  sky.addColorStop(1, "#ffe4ad");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sonne.
  ctx.fillStyle = "#fff0ae";
  ctx.beginPath();
  ctx.arc(342, 115, 43, 0, Math.PI * 2);
  ctx.fill();

  // Wolken.
  ctx.fillStyle = "rgba(255,255,255,0.75)";

  for (let i = 0; i < 6; i++) {
    const x =
      ((i * 135 - game.distance * 0.15) % 810 + 810) %
        810 -
      90;
    const y = 110 + (i % 3) * 75;

    ctx.beginPath();
    ctx.ellipse(x, y, 42, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 15, y - 9, 22, 17, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 13, y - 13, 24, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hügel.
  ctx.fillStyle = "#9fc8be";
  ctx.beginPath();
  ctx.moveTo(0, FLOOR);
  ctx.lineTo(0, 490);
  ctx.bezierCurveTo(100, 390, 190, 560, 290, 450);
  ctx.bezierCurveTo(360, 390, 400, 450, W, 440);
  ctx.lineTo(W, FLOOR);
  ctx.closePath();
  ctx.fill();

  // Kleine Werkstattgebäude.
  for (let i = 0; i < 9; i++) {
    const x =
      ((i * 85 - game.distance * 0.3) % 765 + 765) %
        765 -
      85;
    const height = 75 + (i % 3) * 22;

    ctx.fillStyle = i % 2 ? "#85a9b4" : "#a1bdc4";
    ctx.fillRect(x, FLOOR - height, 72, height);

    ctx.fillStyle = "#e3f3df";

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(
          x + 10 + col * 19,
          FLOOR - height + 16 + row * 27,
          10,
          14,
        );
      }
    }
  }

  // Hindernisse.
  for (const gate of game.gates) {
    const top = gate.center - GAP / 2;
    const bottom = gate.center + GAP / 2;

    const metal = ctx.createLinearGradient(
      gate.x,
      0,
      gate.x + GATE_WIDTH,
      0,
    );
    metal.addColorStop(0, "#153b55");
    metal.addColorStop(0.45, "#367b99");
    metal.addColorStop(1, "#163a53");

    ctx.fillStyle = metal;
    ctx.fillRect(gate.x, 0, GATE_WIDTH, top);
    ctx.fillRect(
      gate.x,
      bottom,
      GATE_WIDTH,
      FLOOR - bottom,
    );

    ctx.fillStyle = "#ffca55";
    ctx.fillRect(gate.x, top - 18, GATE_WIDTH, 18);
    ctx.fillRect(gate.x, bottom, GATE_WIDTH, 18);

    ctx.fillStyle = "#7d5b2b";

    for (let i = 0; i < 4; i++) {
      ctx.fillRect(gate.x + 5 + i * 18, top - 15, 7, 12);
      ctx.fillRect(gate.x + 5 + i * 18, bottom + 3, 7, 12);
    }

    ctx.fillStyle = "#b8dce6";

    for (const y of [top - 34, bottom + 34]) {
      ctx.beginPath();
      ctx.arc(gate.x + 12, y, 3, 0, Math.PI * 2);
      ctx.arc(
        gate.x + GATE_WIDTH - 12,
        y,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    if (!gate.collected) {
      drawTool(
        ctx,
        gate.x + GATE_WIDTH / 2,
        gate.center,
        game.time,
      );
    }
  }

  // Boden.
  ctx.fillStyle = "#24394d";
  ctx.fillRect(0, FLOOR, W, H - FLOOR);

  ctx.fillStyle = "#ffcb55";
  ctx.fillRect(0, FLOOR, W, 9);

  ctx.fillStyle = "#a8792b";

  for (let x = -32; x < W + 32; x += 32) {
    ctx.fillRect(
      x - (game.distance % 32),
      FLOOR,
      14,
      9,
    );
  }

  ctx.fillStyle = "#496176";

  for (let x = -48; x < W + 48; x += 48) {
    ctx.fillRect(
      x - (game.distance % 48),
      FLOOR + 28,
      24,
      3,
    );
  }

  // Kleine Funken beim Einsammeln.
  for (const particle of game.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 0.6);
    ctx.fillStyle = "#ffdc64";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  const idle =
    game.mode === "menu" || game.mode === "help"
      ? Math.sin(game.time * 3) * 8
      : 0;

  const angle =
    game.mode === "playing"
      ? Math.max(-0.4, Math.min(0.9, game.velocity / 650))
      : 0;

  drawPaul(ctx, PX, game.y + idle, angle, game.time);

  if (game.bonus > 0) {
    ctx.save();
    ctx.fillStyle = "#fff9c9";
    ctx.strokeStyle = "#715725";
    ctx.lineWidth = 3;
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText("+5", PX + 46, game.y - 34);
    ctx.fillText("+5", PX + 46, game.y - 34);
    ctx.restore();
  }
}

function PaulPortrait() {
  return (
    <svg
      className="fp-portrait"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" fill="#ffce64" />
      <path
        d="M22 100V85Q50 63 78 85V100"
        fill="#397cf8"
      />
      <circle cx="20" cy="51" r="7" fill="#efb588" />
      <circle cx="80" cy="51" r="7" fill="#efb588" />
      <ellipse
        cx="50"
        cy="48"
        rx="31"
        ry="34"
        fill="#ffd1a6"
      />
      <path
        d="M19 44Q12 4 55 10Q85 10 82 42L69 31L61 41L50 29L40 41L30 32Z"
        fill="#ffe36b"
      />
      <g
        stroke="#25364e"
        strokeWidth="4"
        fill="#e7f7ff"
      >
        <rect x="23" y="41" width="24" height="21" rx="7" />
        <rect x="53" y="41" width="24" height="21" rx="7" />
        <path d="M47 48H53" />
      </g>
      <g fill="#25364e">
        <circle cx="36" cy="51" r="3" />
        <circle cx="66" cy="51" r="3" />
      </g>
      <path
        d="M41 68Q51 77 62 67"
        fill="none"
        stroke="#a15b48"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionRef = useRef<(action: Action) => void>(() => {});

  const [view, setView] = useState<View>({
    mode: "menu",
    score: 0,
    tools: 0,
    best: 0,
    record: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let best = 0;

    try {
      const saved = Number(localStorage.getItem(RECORD_KEY));
      if (Number.isFinite(saved) && saved >= 0) {
        best = saved;
      }
    } catch {
      // Das Spiel funktioniert auch ohne lokalen Speicher.
    }

    let game = freshGame(best);
    let animation = 0;
    let previousTime = 0;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * ratio;
    canvas.height = H * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    function publish() {
      setView({
        mode: game.mode,
        score: game.score,
        tools: game.tools,
        best: game.best,
        record: game.record,
      });
    }

    function focusGame() {
      canvas?.focus({ preventScroll: true });
    }

    function addGate(x: number) {
      const previous = game.gates.at(-1)?.center ?? 330;
      const center = previous + (Math.random() - 0.5) * 170;

      game.gates.push({
        x,
        center: Math.max(190, Math.min(FLOOR - 160, center)),
        collected: false,
        passed: false,
      });
    }

    function start() {
      game = freshGame(game.best);
      game.mode = "playing";
      game.velocity = -335;

      addGate(W + 80);
      addGate(W + 80 + SPACING);
      addGate(W + 80 + SPACING * 2);

      publish();
      focusGame();
    }

    function end() {
      if (game.mode !== "playing") return;

      game.mode = "over";
      game.record = game.score > game.best;
      game.best = Math.max(game.best, game.score);

      try {
        localStorage.setItem(RECORD_KEY, String(game.best));
      } catch {
        // Rekord bleibt ohne Speicher für diese Sitzung erhalten.
      }

      publish();
    }

    function act(action: Action) {
      if (action === "start") {
        start();
        return;
      }

      if (action === "menu") {
        game = freshGame(game.best);
        publish();
        return;
      }

      if (action === "help") {
        game.mode = "help";
        publish();
        return;
      }

      if (action === "pause") {
        if (game.mode === "playing") {
          game.mode = "paused";
        } else if (game.mode === "paused") {
          game.mode = "playing";
          focusGame();
        } else if (game.mode === "help") {
          game.mode = "menu";
        }

        publish();
        return;
      }

      if (game.mode === "playing") {
        game.velocity = -335;
        focusGame();
      } else if (game.mode === "paused") {
        game.mode = "playing";
        publish();
        focusGame();
      } else if (game.mode === "menu" || game.mode === "over") {
        start();
      }
    }

    actionRef.current = act;

    function update(dt: number) {
      if (game.mode === "paused" || game.mode === "over") {
        return;
      }

      game.time += dt;

      if (game.mode !== "playing") return;

      game.velocity += 970 * dt;
      game.y += game.velocity * dt;
      game.bonus = Math.max(0, game.bonus - dt);

      const speed = Math.min(225, 158 + game.passed * 2.5);
      game.distance += speed * dt;

      for (const gate of game.gates) {
        gate.x -= speed * dt;
      }

      for (const particle of game.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 200 * dt;
        particle.life -= dt;
      }

      game.particles = game.particles.filter(
        (particle) => particle.life > 0,
      );

      game.gates = game.gates.filter(
        (gate) => gate.x + GATE_WIDTH > -30,
      );

      const last = game.gates.at(-1);

      if (last && last.x < W + SPACING) {
        addGate(last.x + SPACING);
      }

      if (
        game.y - RADIUS < 0 ||
        game.y + RADIUS > FLOOR
      ) {
        end();
        return;
      }

      let changed = false;

      for (const gate of game.gates) {
        const top = gate.center - GAP / 2;
        const bottom = gate.center + GAP / 2;

        if (
          hitsRectangle(
            PX,
            game.y,
            gate.x,
            0,
            GATE_WIDTH,
            top,
          ) ||
          hitsRectangle(
            PX,
            game.y,
            gate.x,
            bottom,
            GATE_WIDTH,
            FLOOR - bottom,
          )
        ) {
          end();
          return;
        }

        const toolX = gate.x + GATE_WIDTH / 2;
        const toolY =
          gate.center + Math.sin(game.time * 4) * 4;

        if (
          !gate.collected &&
          Math.hypot(PX - toolX, game.y - toolY) < 35
        ) {
          gate.collected = true;
          game.tools += 1;
          game.score += 5;
          game.bonus = 0.65;
          changed = true;

          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;

            game.particles.push({
              x: toolX,
              y: toolY,
              vx: Math.cos(angle) * 90,
              vy: Math.sin(angle) * 90,
              life: 0.6,
            });
          }
        }

        if (
          !gate.passed &&
          gate.x + GATE_WIDTH < PX - RADIUS
        ) {
          gate.passed = true;
          game.passed += 1;
          game.score += 1;
          changed = true;
        }
      }

      if (changed) publish();
    }

    function frame(timestamp: number) {
      const dt = previousTime
        ? Math.min((timestamp - previousTime) / 1000, 0.04)
        : 0;

      previousTime = timestamp;

      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));

      for (let i = 0; i < steps; i++) {
        update(dt / steps);
      }

      drawScene(ctx!, game);
      animation = requestAnimationFrame(frame);
    }

    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("button, input, textarea, select, a")
      ) {
        return;
      }

      if (
        !["Space", "ArrowUp", "KeyP", "Escape"].includes(
          event.code,
        )
      ) {
        return;
      }

      event.preventDefault();
      if (event.repeat) return;

      act(
        event.code === "KeyP" || event.code === "Escape"
          ? "pause"
          : "flap",
      );
    }

    function onPointer(event: PointerEvent) {
      if (event.button !== 0) return;
      event.preventDefault();
      act("flap");
    }

    function pause() {
      if (game.mode === "playing") {
        game.mode = "paused";
        publish();
      }
    }

    function onVisibility() {
      if (document.hidden) pause();
    }

    publish();
    animation = requestAnimationFrame(frame);

    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(animation);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", pause);
      document.removeEventListener(
        "visibilitychange",
        onVisibility,
      );
      actionRef.current = () => {};
    };
  }, []);

  const act = (action: Action) => actionRef.current(action);

  return (
    <main className="fp-shell">
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: #0b1627;
        }

        .fp-shell, .fp-shell * {
          box-sizing: border-box;
        }

        .fp-shell {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          overflow: auto;
          padding: 12px;
          background:
            radial-gradient(ellipse at 25% 20%, #23486d, transparent 55%),
            radial-gradient(ellipse at 85% 85%, #29413e, transparent 45%),
            #0b1627;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .fp-game {
          position: relative;
          width: min(100%, calc((100svh - 24px) * 0.6), 460px);
          aspect-ratio: 3 / 5;
          overflow: hidden;
          flex-shrink: 0;
          border-radius: 25px;
          border: 1px solid #ffffff35;
          background: #8bd0ee;
          box-shadow:
            0 35px 100px #0007,
            0 0 0 6px #ffffff04;
          isolation: isolate;
        }

        .fp-canvas {
          display: block;
          width: 100%;
          height: 100%;
          touch-action: none;
          cursor: pointer;
          outline: none;
        }

        .fp-canvas:focus-visible {
          outline: 3px solid #ffe18b;
          outline-offset: -3px;
        }

        .fp-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          overflow-y: auto;
          background: linear-gradient(#0c21383b, #0c213870);
          backdrop-filter: blur(5px);
        }

        .fp-card {
          width: 100%;
          max-width: 335px;
          padding: clamp(16px, 3svh, 30px) 24px;
          border: 1px solid #ffffff26;
          border-radius: 26px;
          background: linear-gradient(155deg, #20354ff5, #101f34fa);
          box-shadow: 0 20px 50px #10203555;
          text-align: center;
        }

        .fp-label {
          margin: 0 0 12px;
          color: #f9ce74;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .fp-title {
          margin: 0;
          color: #fff;
          font-size: clamp(34px, 6svh, 52px);
          font-weight: 900;
          line-height: 0.98;
          letter-spacing: -2px;
        }

        .fp-title span {
          display: block;
          color: #ffd16b;
          font-size: 1.3em;
          text-shadow: 0 4px 0 #9e642a;
        }

        .fp-portrait {
          display: block;
          width: clamp(60px, 12svh, 96px);
          height: auto;
          margin: 18px auto 12px;
          filter: drop-shadow(0 7px 10px #0003);
        }

        .fp-copy {
          margin: 14px 0 20px;
          color: #c4d3e5;
          font-size: 13px;
          line-height: 1.65;
        }

        .fp-button {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding: 14px 12px;
          border: 0;
          border-radius: 13px;
          background: #ffd16b;
          color: #34280e;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 0 #b7812c;
        }

        .fp-button:hover {
          background: #ffdf97;
        }

        .fp-button:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #b7812c;
        }

        .fp-secondary {
          background: #ffffff09;
          color: #e6eef9;
          border: 1px solid #ffffff20;
          box-shadow: none;
        }

        .fp-secondary:hover {
          background: #ffffff17;
        }

        .fp-secondary:active {
          box-shadow: none;
        }

        .fp-button:focus-visible,
        .fp-pause:focus-visible {
          outline: 3px solid #fff;
          outline-offset: 3px;
        }

        .fp-hint {
          margin: 18px 0 0;
          color: #93aac4;
          font-size: 10px;
          line-height: 1.6;
        }

        .fp-best {
          display: inline-block;
          margin-top: 18px;
          padding: 7px 13px;
          border: 1px solid #ffd16b26;
          border-radius: 50px;
          color: #ffd16b;
          background: #ffd16b08;
          font-size: 11px;
        }

        .fp-hud {
          position: absolute;
          top: 17px;
          left: 17px;
          right: 17px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          pointer-events: none;
        }

        .fp-live-score {
          min-width: 95px;
          padding: 11px 15px;
          border: 1px solid #ffffff33;
          border-radius: 16px;
          background: #142942d9;
          box-shadow: 0 6px 20px #0001;
        }

        .fp-live-score small {
          display: block;
          color: #c2d4e7;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .fp-live-score strong {
          display: block;
          margin: 3px 0;
          color: #fff;
          font-size: 32px;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .fp-live-score span {
          color: #ffdb89;
          font-size: 11px;
        }

        .fp-pause {
          width: 43px;
          height: 43px;
          border: 1px solid #ffffff38;
          border-radius: 13px;
          background: #142942df;
          color: white;
          font-size: 22px;
          cursor: pointer;
          pointer-events: auto;
        }

        .fp-heading {
          margin: 8px 0 14px;
          color: #fff;
          font-size: clamp(25px, 4.5svh, 34px);
          font-weight: 900;
          letter-spacing: -1px;
        }

        .fp-symbol {
          display: block;
          margin-bottom: 12px;
          font-size: 38px;
        }

        .fp-result {
          margin: 20px 0;
          padding: 18px 12px;
          border: 1px solid #ffffff13;
          border-radius: 18px;
          background: #00000020;
        }

        .fp-result > span {
          color: #acc0d9;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .fp-result > strong {
          display: block;
          margin: 5px 0 14px;
          color: #ffda80;
          font-size: 58px;
          font-weight: 900;
          line-height: 1;
        }

        .fp-result-row {
          display: flex;
          justify-content: space-around;
          gap: 12px;
          color: #c2d1e3;
          font-size: 11px;
          line-height: 1.7;
        }

        .fp-result-row b {
          display: block;
          color: #fff;
          font-size: 20px;
        }

        .fp-rules {
          display: grid;
          gap: 14px;
          margin: 20px 0;
          text-align: left;
        }

        .fp-rule {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .fp-rule > span {
          display: grid;
          flex: 0 0 30px;
          height: 30px;
          place-items: center;
          border-radius: 10px;
          background: #ffd16b15;
          color: #ffd16b;
          font-size: 12px;
          font-weight: bold;
        }

        .fp-rule p {
          margin: 0;
          color: #bacce1;
          font-size: 12px;
          line-height: 1.6;
        }

        .fp-rule b {
          display: block;
          margin-bottom: 3px;
          color: #fff;
          font-size: 13px;
        }

        .fp-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }

        @media (max-height: 600px) {
          .fp-card {
            padding: 14px 18px;
          }

          .fp-portrait {
            width: 55px;
            margin: 10px auto;
          }

          .fp-copy {
            margin: 10px 0;
            font-size: 11px;
          }

          .fp-button {
            padding: 10px;
            font-size: 12px;
          }

          .fp-best, .fp-hint {
            margin-top: 10px;
          }

          .fp-rules {
            gap: 8px;
            margin: 12px 0;
          }
        }
      `}</style>

      <section className="fp-game" aria-label="Flappy Paul">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="fp-canvas"
          tabIndex={0}
          aria-label="Spielfeld. Mit Leertaste, Pfeil nach oben oder Antippen fliegen. Mit P pausieren."
        />

        {view.mode === "playing" && (
          <div className="fp-hud">
            <div className="fp-live-score">
              <small>PUNKTE</small>
              <strong>{view.score}</strong>
              <span>🪛 {view.tools}</span>
            </div>

            <button
              className="fp-pause"
              onClick={() => act("pause")}
              aria-label="Spiel pausieren"
            >
              Ⅱ
            </button>
          </div>
        )}

        {view.mode !== "playing" && (
          <div className="fp-overlay">
            <div className="fp-card">
              {view.mode === "menu" && (
                <>
                  <p className="fp-label">WERKSTATT ARCADE</p>

                  <h1 className="fp-title">
                    FLAPPY <span>PAUL</span>
                  </h1>

                  <PaulPortrait />

                  <p className="fp-copy">
                    Kleine Flügel. Große Mission.
                    <br />
                    Wie viele Werkzeuge schaffst du?
                  </p>

                  <button
                    className="fp-button"
                    onClick={() => act("start")}
                  >
                    ▶ Spiel starten
                  </button>

                  <button
                    className="fp-button fp-secondary"
                    onClick={() => act("help")}
                  >
                    So wird gespielt
                  </button>

                  <div className="fp-best">
                    🏆 Dein Rekord: {view.best}
                  </div>

                  <p className="fp-hint">
                    Leertaste · Klicken · Antippen
                  </p>
                </>
              )}

              {view.mode === "help" && (
                <>
                  <p className="fp-label">PAULS FLUGSCHULE</p>
                  <h2 className="fp-heading">So funktioniert’s</h2>

                  <div className="fp-rules">
                    <div className="fp-rule">
                      <span>1</span>
                      <p>
                        <b>Paul in der Luft halten</b>
                        Tippe ins Spielfeld oder drücke die
                        Leertaste beziehungsweise ↑. Jeder
                        Impuls lässt Paul steigen.
                      </p>
                    </div>

                    <div className="fp-rule">
                      <span>2</span>
                      <p>
                        <b>Durch die Lücken fliegen</b>
                        Vermeide Metallträger, Boden und obere
                        Spielfeldkante. Pro Hindernis gibt es
                        einen Punkt.
                      </p>
                    </div>

                    <div className="fp-rule">
                      <span>3</span>
                      <p>
                        <b>Schraubenzieher einsammeln</b>
                        Jeder Schraubenzieher bringt fünf
                        zusätzliche Punkte.
                      </p>
                    </div>

                    <div className="fp-rule">
                      <span>Ⅱ</span>
                      <p>
                        <b>Eine Pause machen</b>
                        Nutze den Pause-Button, P oder Esc.
                        Beim Verlassen des Tabs pausiert das
                        Spiel automatisch.
                      </p>
                    </div>
                  </div>

                  <button
                    className="fp-button"
                    onClick={() => act("start")}
                  >
                    Verstanden – los geht’s!
                  </button>

                  <button
                    className="fp-button fp-secondary"
                    onClick={() => act("menu")}
                  >
                    Zurück
                  </button>
                </>
              )}

              {view.mode === "paused" && (
                <>
                  <span className="fp-symbol">⏸</span>
                  <p className="fp-label">KURZE WERKSTATTPAUSE</p>
                  <h2 className="fp-heading">Durchatmen, Paul.</h2>

                  <p className="fp-copy">
                    Deine {view.score} Punkte warten auf dich.
                    <br />
                    Bereit für den nächsten Schraubenzieher?
                  </p>

                  <button
                    className="fp-button"
                    onClick={() => act("pause")}
                  >
                    ▶ Weiterfliegen
                  </button>

                  <button
                    className="fp-button fp-secondary"
                    onClick={() => act("start")}
                  >
                    ↻ Neu starten
                  </button>

                  <button
                    className="fp-button fp-secondary"
                    onClick={() => act("menu")}
                  >
                    Zum Hauptmenü
                  </button>
                </>
              )}

              {view.mode === "over" && (
                <>
                  <span className="fp-symbol">
                    {view.record ? "🏆" : "💫"}
                  </span>

                  <p className="fp-label">
                    {view.record
                      ? "NEUER PERSÖNLICHER REKORD!"
                      : "RUNDE BEENDET"}
                  </p>

                  <h2 className="fp-heading">
                    {view.record ? "Stark, Paul!" : "Autsch, Paul!"}
                  </h2>

                  <div className="fp-result">
                    <span>DEINE PUNKTE</span>
                    <strong>{view.score}</strong>

                    <div className="fp-result-row">
                      <div>
                        Schraubenzieher
                        <b>🪛 {view.tools}</b>
                      </div>

                      <div>
                        Bester Punktestand
                        <b>🏆 {view.best}</b>
                      </div>
                    </div>
                  </div>

                  <button
                    className="fp-button"
                    onClick={() => act("start")}
                  >
                    ↻ Noch eine Runde
                  </button>

                  <button
                    className="fp-button fp-secondary"
                    onClick={() => act("menu")}
                  >
                    Zum Hauptmenü
                  </button>

                  <p className="fp-hint">
                    Dein Rekord wird in diesem Browser
                    gespeichert, sofern Speicher verfügbar ist.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <span
          className="fp-sr-only"
          role="status"
          aria-live="polite"
        >
          {view.mode === "over"
            ? `Runde beendet. ${view.score} Punkte und ${view.tools} Schraubenzieher. Rekord: ${view.best}.`
            : view.mode === "paused"
              ? "Spiel pausiert."
              : view.mode === "playing"
                ? "Spiel gestartet."
                : "Flappy Paul Hauptmenü."}
        </span>
      </section>
    </main>
  );
}
