import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * SkillJumpGame
 * ------------------------------------------------------------------
 * A small, self-contained "doodle-jump"-style mini-game meant to sit
 * beside a portfolio's Projects section. The player character bounces
 * upward automatically; arrow keys steer it left/right onto floating
 * "code block" platforms, each labeled with a skill. Landing on a
 * platform collects that skill (once) and removes it from play.
 *
 * Fully isolated: all styles are scoped under the `skj-` prefix and
 * injected via a single <style> tag local to this component, so it
 * can be dropped into any project without touching global CSS.
 *
 * Usage:
 */

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface SkillJumpGameProps {
  /** Skills to scatter across platforms. Defaults to Martin's stack. */
  skills?: string[];
  /** Optional extra class name for outer layout control. */
  className?: string;
}

interface Platform {
  id: number;
  x: number; // left edge, in canvas px
  y: number; // world-space y (0 = start height, grows downward like normal canvas coords, but platforms live at negative-ish world y as you climb)
  width: number;
  skill: string;
  icon: string;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  color: string;
}

const DEFAULT_SKILLS = [
  "React",
  "TS",
  "JS",
  "Laravel",
  "PHP",
  "C#",
  "SQL",
  "Docker",
  "Git",
  "AI",
  "n8n",
  "API",
];

// Maps each skill to one of the requested "code glyph" icons.
const ICON_MAP: Record<string, string> = {
  React: "</>",
  TypeScript: "{}",
  JavaScript: "{}",
  Laravel: "",
  PHP: "{}",
  "C#": "{}",
  SQL: "{}",
  Docker: "",
  Git: "Git",
  OpenAI: "API",
  n8n: "{}",
};

const GRAVITY = 0.32;
const JUMP_VELOCITY = -9.2;
const MOVE_SPEED = 4.4;
const PLAYER_SIZE = 14;
const PLATFORM_HEIGHT = 18;
const VERTICAL_GAP = 78;
const CAMERA_TRIGGER_RATIO = 0.42; // once the player climbs above this fraction of canvas height, camera follows

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SkillJumpGame: React.FC<SkillJumpGameProps> = ({
  skills = DEFAULT_SKILLS,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Mutable game state kept in refs so the render loop doesn't fight React.
  const sizeRef = useRef({ w: 320, h: 420 });
  const keysRef = useRef({ left: false, right: false });
  const playerRef = useRef({ x: 150, y: 0, vy: JUMP_VELOCITY, vx: 0 });
  const cameraYRef = useRef(0);
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const statusRef = useRef<"playing" | "won" | "fell">("playing");

  // React state only for what the UI actually needs to re-render on.
  const [collected, setCollected] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "fell">("playing");
  const [runId, setRunId] = useState(0); // bumping this resets the game

  const total = skills.length;

  // -------------------------------------------------------------------
  // Build a fresh set of platforms + reset player/camera/particles
  // -------------------------------------------------------------------
  const setupGame = useCallback(
    (w: number, h: number) => {
      const platforms: Platform[] = [];
      // Ground platform (no skill) so the character has somewhere to start.
      platforms.push({
        id: -1,
        x: w / 2 - 34,
        y: h - 30,
        width: 68,
        skill: "",
        icon: "",
        collected: true,
      });

      let y = h - 30 - VERTICAL_GAP;
      for (let i = 0; i < skills.length; i++) {
        const platWidth = 45;
        const x = 16 + Math.random() * Math.max(1, w - 32 - platWidth);
        platforms.push({
          id: i,
          x,
          y,
          width: platWidth,
          skill: skills[i],
          icon: ICON_MAP[skills[i]] ?? "{}",
          collected: false,
        });
        y -= VERTICAL_GAP;
      }

      platformsRef.current = platforms;
      particlesRef.current = [];
      cameraYRef.current = 0;
      playerRef.current = {
        x: w / 2 - PLAYER_SIZE / 2,
        y: h - 30 - PLAYER_SIZE,
        vy: JUMP_VELOCITY,
        vx: 0,
      };
      statusRef.current = "playing";
      setStatus("playing");
      setCollected(0);
    },
    [skills]
  );

  // -------------------------------------------------------------------
  // Resize handling — keeps the canvas matched to its container
  // -------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(150, Math.floor(entry.contentRect.width));
        const h = Math.max(300, Math.floor(entry.contentRect.height));
        sizeRef.current = { w, h };

        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        setupGame(w, h);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // -------------------------------------------------------------------
  // Keyboard controls
  // -------------------------------------------------------------------
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
    };
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, []);

  // -------------------------------------------------------------------
  // Main render/physics loop
  // -------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const spawnParticles = (x: number, y: number) => {
      const colors = ["#e37f7f", "#c9d6d2"];
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 3 - 0.5,
          life: 1,
          color: colors[i % colors.length],
        });
      }
    };

    const tick = () => {
      const { w, h } = sizeRef.current;
      const player = playerRef.current;
      const keys = keysRef.current;

      if (statusRef.current === "playing") {
        // Horizontal movement, wrapping around the sides like classic
        // jumpers.
        if (keys.left) player.vx = -MOVE_SPEED;
        else if (keys.right) player.vx = MOVE_SPEED;
        else player.vx *= 0.8;

        player.x += player.vx;
        if (player.x + PLAYER_SIZE < 0) player.x = w;
        if (player.x > w) player.x = -PLAYER_SIZE;

        // Vertical physics
        player.vy += GRAVITY;
        player.y += player.vy;

        // Collision: only when falling, only against the platform top edge
        if (player.vy > 0) {
          for (const p of platformsRef.current) {
            const withinX =
              player.x + PLAYER_SIZE * 0.7 > p.x &&
              player.x + PLAYER_SIZE * 0.3 < p.x + p.width;
            const feetY = player.y + PLAYER_SIZE;
            const withinY =
              feetY >= p.y && feetY <= p.y + PLATFORM_HEIGHT + player.vy;
            if (withinX && withinY) {
              player.vy = JUMP_VELOCITY;
              player.y = p.y - PLAYER_SIZE;
              if (!p.collected && p.skill) {
                p.collected = true;
                spawnParticles(p.x + p.width / 2, p.y);
                setCollected((c) => {
                  const next = c + 1;
                  if (next >= total) {
                    statusRef.current = "won";
                    setStatus("won");
                  }
                  return next;
                });
              }
            }
          }
        }

        // Camera follows once the player climbs high enough
        const triggerY = h * CAMERA_TRIGGER_RATIO;
        const screenY = player.y - cameraYRef.current;
        if (screenY < triggerY) {
          cameraYRef.current -= triggerY - screenY;
        }

        // Fell below the visible world -> reset the fall gently
        if (player.y - cameraYRef.current > h + 80) {
          statusRef.current = "fell";
          setStatus("fell");
        }
      }

      // Update particles regardless of status so collect bursts finish
      particlesRef.current = particlesRef.current
        .map((pt) => ({
          ...pt,
          x: pt.x + pt.vx,
          y: pt.y + pt.vy,
          vy: pt.vy + 0.15,
          life: pt.life - 0.025,
        }))
        .filter((pt) => pt.life > 0);

      // ---------------- draw ----------------
      ctx.clearRect(0, 0, w, h);

      // flat background, matches a plain dark card — no gradient/grid noise
      ctx.clearRect(0, 0, w, h);

      const camY = cameraYRef.current;

      // platforms
      for (const p of platformsRef.current) {
        const drawY = p.y - camY;
        if (drawY < -40 || drawY > h + 40) continue;

        const isGround = p.id === -1;
        ctx.fillStyle = isGround ? "#121616" : "#101414";
        ctx.strokeStyle = isGround ? "#232b2b" : p.collected ? "#1a1f1f" : "#2a3535";
        ctx.lineWidth = 1;
        roundRect(ctx, p.x, drawY, p.width, PLATFORM_HEIGHT, 4);
        ctx.fill();
        ctx.stroke();

        if (!isGround) {
          ctx.font = "8px 'JetBrains Mono', monospace";
          ctx.fillStyle = p.collected ? "#423a3a" : "#e37f7f";
          ctx.textAlign = "left";
          ctx.fillText(p.icon, p.x + 6, drawY + PLATFORM_HEIGHT / 2 + 3);

          ctx.fillStyle = p.collected ? "#423a3a" : "#e3d7d7";
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.textAlign = "right";
          const label = p.collected ? "✓" : p.skill;
          ctx.fillText(label, p.x + p.width - 6, drawY + PLATFORM_HEIGHT / 2 + 3);
        }
      }

      // particles
      for (const pt of particlesRef.current) {
        ctx.globalAlpha = Math.max(pt.life, 0);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - camY * 0 - 2, pt.y - camY - 2, 4, 4);
        ctx.globalAlpha = 1;
      }

      // player (small pixel-art sprite drawn from a bitmap grid)
      drawPlayerSprite(ctx, player.x, player.y - camY, PLAYER_SIZE);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, total]);

  const handleRestart = () => {
    setRunId((id) => id + 1);
    const { w, h } = sizeRef.current;
    setupGame(w, h);
  };

  return (
    <div className={`skj-root ${className ?? ""}`} ref={containerRef}>
      <style>{SKJ_STYLES}</style>

      <div className="skj-hud">
        <span className="skj-hud-label">
          Skills collected: {collected}/{total}
          <span className="skj-cursor">_</span>
        </span>
      </div>

      <canvas ref={canvasRef} className="skj-canvas" />

      {status !== "playing" && (
        <div className="skj-overlay">
          <p className="skj-overlay-title">
            {status === "won" ? "All skills collected" : "Missed the platforms"}
          </p>
          <p className="skj-overlay-sub">
            {status === "won"
              ? `${total}/${total} — nice climb.`
              : "Give it another shot."}
          </p>
          <button className="skj-restart" onClick={handleRestart}>
            Restart
          </button>
        </div>
      )}

      <div className="skj-hint">← →</div>
    </div>
  );
};

export default SkillJumpGame;

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 8x9 bitmap: 0 empty, 1 hood/hair, 2 skin, 3 shirt, 4 accent (screen glow)
const PLAYER_BITMAP: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 4, 4, 2, 1, 0],
  [0, 0, 3, 3, 3, 3, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 0],
  [0, 3, 3, 0, 0, 3, 3, 0],
  [0, 3, 3, 0, 0, 3, 3, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
];

const PLAYER_COLORS: Record<number, string> = {
  1: "#221c1c",
  2: "#c98c8c",
  3: "#443a3a",
  4: "#e37f7f",
};

function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const cell = size / 8;
  for (let row = 0; row < PLAYER_BITMAP.length; row++) {
    for (let col = 0; col < PLAYER_BITMAP[row].length; col++) {
      const val = PLAYER_BITMAP[row][col];
      if (!val) continue;
      ctx.fillStyle = PLAYER_COLORS[val];
      ctx.fillRect(x + col * cell, y + row * cell, cell + 0.5, cell + 0.5);
    }
  }
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

const SKJ_STYLES = `
.skj-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: visible;
}
.skj-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.skj-hud {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  pointer-events: none;
}

.skj-hud-label {
  font-size: 8px;
  color: #5f6e6a;
  letter-spacing: 0.02em;
}

.skj-cursor {
  color: #e37f7f;
  animation: skj-blink 1s steps(1) infinite;
  margin-left: 1px;
}

@keyframes skj-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.skj-hint {
  position: absolute;
  bottom: 8px;
  left: 12px;
  z-index: 2;
  font-size: 10px;
  color: #443a3a;
  pointer-events: none;
}

.skj-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(11, 15, 16, 0.9);
  text-align: center;
  padding: 16px;
}

.skj-overlay-title {
  color: #d7e3df;
  font-size: 13px;
  margin: 0;
}

.skj-overlay-sub {
  color: #6e5f5f;
  font-size: 11px;
  margin: 0 0 6px 0;
}

.skj-restart {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #e3d7d7;
  background: transparent;
  border: 1px solid #2a3535;
  border-radius: 5px;
  padding: 6px 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.skj-restart:hover {
  border-color: #e37f7f;
  color: #e37f7f;
}

.skj-restart:active {
  transform: translateY(0.5px);
}
`;
