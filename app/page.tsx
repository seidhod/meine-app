"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Status = "ready" | "playing" | "paused" | "over";
type Action = "flap" | "pause" | "restart";

type Obstacle = {
  x: number;
  center: number;
  collected: boolean;
  passed: boolean;
};

type Game = {
  status: Status;
  y: number;
  velocity: number;
  obstacles: Obstacle[];
  score: number;
  tools: number;
  passed: number;
  best: number;
  time: number;
  distance: number;
};

const WIDTH = 420;
const HEIGHT = 640;
const FLOOR = 590;
const PLAYER_X = 104;
const RADIUS = 17;
const PIPE_WIDTH = 68;
const GAP = 186;
const SPACING = 255;
const STORAGE_KEY = "flappy-paul-best-v1";

function createGame(best = 0): Game {
  return {
    status: "ready",
    y: 290,
    velocity: 0,
    obstacles: [],
    score: 0,
    tools: 0,
    passed: 0,
    best,
    time: 0,
    distance: 0,
  };
}

function circleHitsRect(
  cx: number,
  cy: number,
  radius: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const nearestX = Math.max(x, Math.min(cx, x + width));
  const nearestY = Math.max(y, Math.min(cy, y + height));

  return (
    (cx - nearestX) ** 2 + (cy - nearestY) ** 2 <
    radius ** 2
  );
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.35, 0, 0, Math.PI * 2);
  ctx.ellipse(
    x - size * 0.35,
    y - size * 0.2,
    size * 0.45,
    size * 0.4,
    0,
    0,
    Math.PI * 2,
  );
  ctx.ellipse(
    x + size * 0.15,
    y - size * 0.3,
    size * 0.5,
    size * 0.5,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function drawScrewdriver(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 4) * 4);

  ctx.fillStyle = "rgba(255, 222, 89, 0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffd85c";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, 23, time, time + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.rotate(Math.PI / 4);

  // Metallschaft und flache Spitze.
  ctx.fillStyle = "#dce9f5";
  ctx.fillRect(-3, -19, 6, 25);

  ctx.fillStyle = "#9aafc4";
  ctx.fillRect(-5, -24, 10, 7);

  // Orangefarbener Griff.
  ctx.fillStyle = "#ff773d";
  ctx.beginPath();
  ctx.roundRect(-8, 1, 16, 22, 5);
  ctx.fill();

  ctx.fillStyle = "#a83b25";
  ctx.fillRect(-3, 5, 2, 13);
  ctx.fillRect(2, 5, 2, 13);

  ctx.restore();
}

function drawPaul(ctx: CanvasRenderingContext2D, game: Game) {
  ctx.save();

  const idle =
    game.status === "ready" ? Math.sin(game.time * 3) * 7 : 0;

  ctx.translate(PLAYER_X, game.y + idle);

  const tilt =
    game.status === "playing"
      ? Math.max(-0.35, Math.min(0.85, game.velocity / 650))
      : 0;

  ctx.rotate(tilt);

  // Kleine Flügel hinter Paul.
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#a8cce1";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(
    -21,
    15,
    18,
    8,
    -0.5 + Math.sin(game.time * 18) * 0.25,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();

  // Blaues Shirt.
  ctx.fillStyle = "#317bfa";
  ctx.beginPath();
  ctx.roundRect(-15, 14, 31, 18, 8);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("P", 1, 28);

  // Ohren.
  ctx.fillStyle = "#efb888";
  ctx.beginPath();
  ctx.arc(-22, 0, 6, 0, Math.PI * 2);
  ctx.arc(22, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Kopf.
  ctx.fillStyle = "#ffd1a3";
  ctx.beginPath();
  ctx.arc(0, -3, 24, 0, Math.PI * 2);
  ctx.fill();

  // Blonde Haare.
  ctx.fillStyle = "#ffd34e";
  ctx.beginPath();
  ctx.moveTo(-24, -7);
  ctx.bezierCurveTo(-29, -34, 19, -40, 25, -11);
  ctx.lineTo(15, -17);
  ctx.lineTo(10, -9);
  ctx.lineTo(3, -18);
  ctx.lineTo(-5, -10);
  ctx.lineTo(-12, -18);
  ctx.lineTo(-20, -7);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#e4a82b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -23);
  ctx.quadraticCurveTo(-3, -31, 11, -24);
  ctx.stroke();

  // Brillengläser.
  ctx.fillStyle = "rgba(225,247,255,0.7)";
  ctx.strokeStyle = "#23334d";
  ctx.lineWidth = 3;

  for (const x of [-11, 11]) {
    ctx.beginPath();
    ctx.roundRect(x - 9, -9, 18, 15, 5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-2, -3);
  ctx.lineTo(2, -3);
  ctx.moveTo(-24, -5);
  ctx.lineTo(-20, -4);
  ctx.moveTo(20, -4);
  ctx.lineTo(24, -5);
  ctx.stroke();

  // Augen.
  ctx.fillStyle = "#23334d";
  ctx.beginPath();
  ctx.arc(-9, -1, 2.4, 0, Math.PI * 2);
  ctx.arc(13, -1, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Nase und Lächeln.
  ctx.strokeStyle = "#c88562";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(3, 3);
  ctx.lineTo(5, 8);
  ctx.lineTo(1, 8);
  ctx.stroke();

  ctx.strokeStyle = "#9b4d43";
  ctx.beginPath();
  ctx.arc(3, 9, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, game: Game) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#91d8ff");
  sky.addColorStop(0.7, "#d8f5ff");
  sky.addColorStop(1, "#fff0c2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Sonne.
  ctx.fillStyle = "#fff2a7";
  ctx.beginPath();
  ctx.arc(345, 90, 40, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const x =
      ((i * 145 - game.distance * 0.18) % 700 + 700) % 700 - 100;
    drawCloud(ctx, x, 90 + (i % 3) * 65, 35 + (i % 2) * 12);
  }

  // Werkstattgebäude im Hintergrund.
  for (let i = 0; i < 9; i++) {
    const x =
      ((i * 85 - game.distance * 0.3) % 765 + 765) % 765 - 85;
    const height = 65 + (i % 3) * 24;

    ctx.fillStyle = i % 2 === 0 ? "#9abac7" : "#b3cbd1";
    ctx.fillRect(x, FLOOR - height, 70, height);

    ctx.fillStyle = "#e5f5ef";
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(
          x + 9 + col * 19,
          FLOOR - height + 14 + row * 25,
          10,
          13,
        );
      }
    }
  }

  // Hindernisse.
  for (const obstacle of game.obstacles) {
    const top = obstacle.center - GAP / 2;
    const bottom = obstacle.center + GAP / 2;

    const metal = ctx.createLinearGradient(
      obstacle.x,
      0,
      obstacle.x + PIPE_WIDTH,
      0,
    );
    metal.addColorStop(0, "#184a67");
    metal.addColorStop(0.45, "#3987a4");
    metal.addColorStop(1, "#123b56");

    ctx.fillStyle = metal;
    ctx.fillRect(obstacle.x, 0, PIPE_WIDTH, top);
    ctx.fillRect(
      obstacle.x,
      bottom,
      PIPE_WIDTH,
      FLOOR - bottom,
    );

    // Gelbe Schutzkanten.
    ctx.fillStyle = "#ffca50";
    ctx.fillRect(obstacle.x, top - 18, PIPE_WIDTH, 18);
    ctx.fillRect(obstacle.x, bottom, PIPE_WIDTH, 18);

    ctx.fillStyle = "#815e25";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(obstacle.x + i * 18 + 4, top - 15, 7, 12);
      ctx.fillRect(obstacle.x + i * 18 + 4, bottom + 3, 7, 12);
    }

    // Schrauben auf den Metallträgern.
    ctx.fillStyle = "#a5d6e5";
    for (const y of [top - 35, bottom + 35]) {
      ctx.beginPath();
      ctx.arc(obstacle.x + 12, y, 3, 0, Math.PI * 2);
      ctx.arc(
        obstacle.x + PIPE_WIDTH - 12,
        y,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    if (!obstacle.collected) {
      drawScrewdriver(
        ctx,
        obstacle.x + PIPE_WIDTH / 2,
        obstacle.center,
        game.time,
      );
    }
  }

  // Werkstattboden.
  ctx.fillStyle = "#253b53";
  ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR);

  ctx.fillStyle = "#ffcb52";
  ctx.fillRect(0, FLOOR, WIDTH, 8);

  ctx.fillStyle = "#b88b32";
  const offset = game.distance % 32;
  for (let x = -32; x < WIDTH + 32; x += 32) {
    ctx.fillRect(x - offset, FLOOR, 14, 8);
  }

  ctx.fillStyle = "#56708a";
  for (let x = -48; x < WIDTH + 48; x += 48) {
    ctx.fillRect(
      x - (game.distance % 48),
      FLOOR + 25,
      25,
      3,
    );
  }

  drawPaul(ctx, game);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionRef = useRef<(action: Action) => void>(() => {});

  const [hud, setHud] = useState({
    status: "ready" as Status,
    score: 0,
    tools: 0,
    best: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let storedBest = 0;

    try {
      storedBest = Number(localStorage.getItem(STORAGE_KEY)) || 0;
      if (!Number.isFinite(storedBest) || storedBest < 0) {
        storedBest = 0;
      }
    } catch {
      // Das Spiel funktioniert auch ohne Browserspeicher.
    }

    let game = createGame(storedBest);
    let frameId = 0;
    let previousTime = 0;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    function publish() {
      setHud({
        status: game.status,
        score: game.score,
        tools: game.tools,
        best: game.best,
      });
    }

    function addObstacle(x: number) {
      const previous = game.obstacles.at(-1)?.center ?? 295;
      const next = previous + (Math.random() - 0.5) * 190;

      game.obstacles.push({
        x,
        center: Math.max(165, Math.min(FLOOR - 145, next)),
        collected: false,
        passed: false,
      });
    }

    function start() {
      game = createGame(game.best);
      game.status = "playing";
      game.velocity = -345;

      addObstacle(WIDTH + 65);
      addObstacle(WIDTH + 65 + SPACING);
      addObstacle(WIDTH + 65 + SPACING * 2);

      publish();
    }

    function finish() {
      if (game.status !== "playing") return;

      game.status = "over";
      game.best = Math.max(game.best, game.score);

      try {
        localStorage.setItem(STORAGE_KEY, String(game.best));
      } catch {
        // Falls Speichern blockiert ist, bleibt der Rekord
        // zumindest für die aktuelle Sitzung erhalten.
      }

      publish();
    }

    function act(action: Action) {
      if (action === "restart") {
        start();
        return;
      }

      if (action === "pause") {
        if (game.status === "playing") {
          game.status = "paused";
        } else if (game.status === "paused") {
          game.status = "playing";
        }

        publish();
        return;
      }

      if (game.status === "ready" || game.status === "over") {
        start();
      } else if (game.status === "playing") {
        game.velocity = -345;
      }
    }

    actionRef.current = act;

    function update(dt: number) {
      if (game.status === "paused" || game.status === "over") {
        return;
      }

      game.time += dt;

      if (game.status !== "playing") return;

      game.velocity += 1020 * dt;
      game.y += game.velocity * dt;

      const speed = Math.min(240, 170 + game.passed * 3);
      game.distance += speed * dt;

      for (const obstacle of game.obstacles) {
        obstacle.x -= speed * dt;
      }

      game.obstacles = game.obstacles.filter(
        (obstacle) => obstacle.x + PIPE_WIDTH > -30,
      );

      const last = game.obstacles.at(-1);
      if (last && last.x < WIDTH + SPACING) {
        addObstacle(last.x + SPACING);
      }

      // Boden und obere Spielfeldkante.
      if (
        game.y - RADIUS < 0 ||
        game.y + RADIUS > FLOOR
      ) {
        finish();
        return;
      }

      let changed = false;

      for (const obstacle of game.obstacles) {
        const top = obstacle.center - GAP / 2;
        const bottom = obstacle.center + GAP / 2;

        const hitsTop = circleHitsRect(
          PLAYER_X,
          game.y,
          RADIUS,
          obstacle.x,
          0,
          PIPE_WIDTH,
          top,
        );

        const hitsBottom = circleHitsRect(
          PLAYER_X,
          game.y,
          RADIUS,
          obstacle.x,
          bottom,
          PIPE_WIDTH,
          FLOOR - bottom,
        );

        if (hitsTop || hitsBottom) {
          finish();
          return;
        }

        const toolX = obstacle.x + PIPE_WIDTH / 2;
        const toolY =
          obstacle.center + Math.sin(game.time * 4) * 4;

        if (
          !obstacle.collected &&
          Math.hypot(PLAYER_X - toolX, game.y - toolY) < 36
        ) {
          obstacle.collected = true;
          game.tools += 1;
          game.score += 5;
          changed = true;
        }

        if (
          !obstacle.passed &&
          obstacle.x + PIPE_WIDTH < PLAYER_X - RADIUS
        ) {
          obstacle.passed = true;
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

      // Kleine Physikschritte für zuverlässigere Kollisionen.
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let i = 0; i < steps; i++) {
        update(dt / steps);
      }

      drawScene(ctx!, game);
      frameId = requestAnimationFrame(frame);
    }

    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("button, input, textarea, select, a")
      ) {
        return;
      }

      if (["Space", "ArrowUp", "KeyP", "Escape"].includes(event.code)) {
        event.preventDefault();
        if (event.repeat) return;

        act(
          event.code === "KeyP" || event.code === "Escape"
            ? "pause"
            : "flap",
        );
      }
    }

    function onPointer(event: PointerEvent) {
      if (event.button !== 0) return;
      event.preventDefault();
      canvas?.focus({ preventScroll: true });
      act("flap");
    }

    function pauseWhenHidden() {
      if (game.status === "playing") {
        game.status = "paused";
        publish();
      }
    }

    function onVisibility() {
      if (document.hidden) pauseWhenHidden();
    }

    publish();
    frameId = requestAnimationFrame(frame);

    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", pauseWhenHidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", pauseWhenHidden);
      document.removeEventListener("visibilitychange", onVisibility);
      actionRef.current = () => {};
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.gameSection}>
          <header className={styles.header}>
            <div className={styles.badge}>DAS WERKSTATT-ABENTEUER</div>
            <h1>
              FLAPPY <span>PAUL</span>
            </h1>
            <p>Blonde Haare. Große Brille. Noch größere Mission.</p>
          </header>

          <div className={styles.scoreboard}>
            <div>
              <span>PUNKTE</span>
              <strong>{hud.score}</strong>
            </div>
            <div>
              <span>WERKZEUGE</span>
              <strong>{hud.tools}</strong>
            </div>
            <div>
              <span>REKORD</span>
              <strong>{hud.best}</strong>
            </div>
          </div>

          <div className={styles.stage}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              width={WIDTH}
              height={HEIGHT}
              tabIndex={0}
              aria-label="Flappy Paul. Mit Leertaste, Pfeil nach oben oder Antippen fliegen. Mit P pausieren."
            />

            {hud.status !== "playing" && (
              <div className={styles.overlay}>
                <div className={styles.dialog}>
                  <span className={styles.dialogIcon}>
                    {hud.status === "over"
                      ? "💫"
                      : hud.status === "paused"
                        ? "⏸"
                        : "🪛"}
                  </span>

                  <h2>
                    {hud.status === "over"
                      ? "Autsch, Paul!"
                      : hud.status === "paused"
                        ? "Werkstattpause"
                        : "Bereit zum Abheben?"}
                  </h2>

                  <p>
                    {hud.status === "over"
                      ? `${hud.score} Punkte und ${hud.tools} Schraubenzieher. Schaffst du noch mehr?`
                      : hud.status === "paused"
                        ? "Kurz durchatmen. Deine Runde wartet auf dich."
                        : "Flieg durch die Lücken und sammle die Schraubenzieher!"}
                  </p>

                  <button
                    className={styles.primaryButton}
                    onClick={() =>
                      actionRef.current(
                        hud.status === "paused" ? "pause" : "restart",
                      )
                    }
                  >
                    {hud.status === "over"
                      ? "Noch eine Runde"
                      : hud.status === "paused"
                        ? "Weiterfliegen"
                        : "Los geht’s!"}
                  </button>

                  <small>
                    {hud.status === "paused"
                      ? "Oder P zum Fortsetzen drücken"
                      : "Leertaste · Klicken · Antippen"}
                  </small>
                </div>
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <button
              className={styles.secondaryButton}
              disabled={
                hud.status === "ready" || hud.status === "over"
              }
              onClick={() => actionRef.current("pause")}
            >
              {hud.status === "paused" ? "▶ Weiter" : "Ⅱ Pause"}
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => actionRef.current("restart")}
            >
              ↻ Neustart
            </button>
          </div>

          <p className={styles.status} role="status" aria-live="polite">
            {hud.status === "playing"
              ? "Paul ist unterwegs. Viel Erfolg!"
              : hud.status === "paused"
                ? "Das Spiel ist pausiert."
                : hud.status === "over"
                  ? `Runde beendet: ${hud.score} Punkte.`
                  : "Deine nächste Bestleistung wartet."}
          </p>
        </section>

        <aside className={styles.instructions}>
          <div className={styles.badge}>PAULS FLUGSCHULE</div>
          <h2>Kleine Flügel.<br />Große Pläne.</h2>
          <p className={styles.intro}>
            Paul muss durch die Werkstatt. Hilf ihm, zwischen den
            Metallträgern hindurchzufliegen und seine Werkzeuge
            einzusammeln.
          </p>

          <div className={styles.instructionItem}>
            <span className={styles.number}>01</span>
            <div>
              <h3>Abheben</h3>
              <p>
                Drücke <kbd>Leertaste</kbd> oder <kbd>↑</kbd>.
                Alternativ klickst du ins Spielfeld oder tippst
                es auf dem Handy an.
              </p>
            </div>
          </div>

          <div className={styles.instructionItem}>
            <span className={styles.number}>02</span>
            <div>
              <h3>Die Lücke treffen</h3>
              <p>
                Jeder Impuls trägt Paul nach oben. Dazwischen
                sinkt er. Vermeide Träger, Boden und die obere
                Spielfeldkante.
              </p>
            </div>
          </div>

          <div className={styles.instructionItem}>
            <span className={styles.number}>03</span>
            <div>
              <h3>Werkzeug einsammeln</h3>
              <p>
                Ein Hindernis bringt <strong>+1 Punkt</strong>.
                Jeder Schraubenzieher bringt zusätzlich
                <strong> +5 Punkte</strong>.
              </p>
            </div>
          </div>

          <div className={styles.tip}>
            <strong>Pauls Profi-Tipp</strong>
            <p>
              Kurze, gleichmäßige Impulse helfen mehr als wildes
              Tippen. Je weiter du kommst, desto schneller wird
              die Werkstatt!
            </p>
          </div>

          <p className={styles.note}>
            Pause mit <kbd>P</kbd> oder <kbd>Esc</kbd>. Beim
            Wechsel in einen anderen Tab pausiert die Runde
            automatisch. Dein Rekord wird in diesem Browser
            gespeichert, sofern Browserspeicher verfügbar ist.
          </p>
        </aside>
      </div>

      <footer className={styles.footer}>
        FLAPPY PAUL · Immer eine Schraubenzieherlänge voraus.
      </footer>
    </main>
  );
}
