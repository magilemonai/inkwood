import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import { startAmbient, stopAmbient } from "../audio";
import s from "../styles/Outro.module.css";

/**
 * Outro: a ~25-second animated panoramic landscape sequence.
 * Phase 1 (0-3s):   Dark. A horizon line draws itself across the middle.
 * Phase 2 (3-12s):  Landscape features bloom one by one from left to right.
 * Phase 3 (12-18s): The Great Tree grows from center, roots spread to connect all locations.
 * Phase 4 (18-25s): Golden ley-line energy flows through roots. Full radiance. Text + button.
 */

// Location vignettes arranged left-to-right across the panorama
const VIGNETTES = [
  { name: "Garden",  color: "#6bbf6b", x: 30  },
  { name: "Cottage", color: "#e89a30", x: 80  },
  { name: "Stars",   color: "#9090f8", x: 130 },
  { name: "Well",    color: "#50b8b8", x: 180 },
  { name: "Bridge",  color: "#7aaa6a", x: 230 },
  { name: "Library", color: "#c088b0", x: 280 },
  { name: "Stones",  color: "#88a8c8", x: 330 },
  { name: "Sanctum", color: "#d0b870", x: 380 },
];

const VIGNETTE_DUR = 1.1; // seconds each vignette takes to bloom

function sub(t: number, start: number, dur: number): number {
  return Math.min(1, Math.max(0, (t - start) / dur));
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export default function OutroSequence() {
  const restart = useGameStore((g) => g.restart);
  const [time, setTime] = useState(0);
  const [showText, setShowText] = useState(false);
  const showTextRef = useRef(false);

  // Keyboard: space/enter to restart when text is showing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && showTextRef.current) {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [restart]);

  // Start outro ambient audio (Act IV drone)
  useEffect(() => {
    startAmbient(3, 9);
    return () => { stopAmbient(); };
  }, []);

  // Animation loop — runs indefinitely until user restarts
  useEffect(() => {
    const start = performance.now();
    let frame: number;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - start) / 1000;
      if (now - lastUpdate > 66) {
        lastUpdate = now;
        // Let time advance freely — scene buildup phases (horizonDraw,
        // treeGrow, radiance, etc.) all use sub() which saturates at 1,
        // so the landscape still "holds" its final state. But pulse
        // oscillations (wisps, ley-energy dots, canopy spirit lights)
        // keep advancing, so the finale breathes rather than freezing
        // once "Begin Again" fades in.
        setTime(elapsed);
        if (elapsed >= 19 && !showTextRef.current) {
          showTextRef.current = true;
          setShowText(true);
        }
      }
      frame = requestAnimationFrame(tick); // loop forever
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Phase calculations
  const horizonDraw = sub(time, 0, 3);
  const treeGrow = sub(time, 12, 5);
  const rootSpread = sub(time, 13, 4);
  const canopyLight = sub(time, 15, 3);
  const radiance = sub(time, 18, 4);
  const leyFlow = sub(time, 18, 3);
  const skyBright = sub(time, 0, 25);

  // Sky color shifts from near-black to deep twilight blue to warm
  const skyLightness = 4 + skyBright * 5 + radiance * 3;
  const skySaturation = 6 + radiance * 8;

  return (
    <div className={s.container}>
      <svg
        viewBox="0 0 420 260"
        className={s.sceneWrap}
        style={{ width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow filters for each vignette */}
          {VIGNETTES.map((v, i) => (
            <radialGradient key={i} id={`vGlow${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={v.color} stopOpacity="0.35" />
              <stop offset="70%" stopColor={v.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={v.color} stopOpacity="0" />
            </radialGradient>
          ))}
          {/* Tree canopy gradient */}
          <radialGradient id="canopyGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#a8d898" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#6aaa58" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4a8a40" stopOpacity="0.1" />
          </radialGradient>
          {/* Golden radiance */}
          <radialGradient id="goldenRadiance" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#d8c890" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#d8c890" stopOpacity="0" />
          </radialGradient>
          {/* Star twinkle filter */}
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sky background */}
        <rect
          width="420" height="260"
          fill={`hsl(210, ${skySaturation}%, ${skyLightness}%)`}
        />

        {/* ═══ Phase 1: Horizon line ═══ */}
        {horizonDraw > 0 && (
          <line
            x1={210 - 210 * easeOut(horizonDraw)}
            y1="155"
            x2={210 + 210 * easeOut(horizonDraw)}
            y2="155"
            stroke="#3a4a3a"
            strokeWidth="1.5"
            opacity={0.5 + horizonDraw * 0.3}
          />
        )}

        {/* Ground fill below horizon — fades in with horizon */}
        {horizonDraw > 0.3 && (
          <rect
            x="0" y="155" width="420" height="105"
            fill={`hsl(140, ${8 + radiance * 6}%, ${6 + radiance * 3}%)`}
            opacity={sub(horizonDraw, 0.3, 0.7) * 0.8}
          />
        )}

        {/* ═══ Phase 2: Landscape vignettes bloom left to right ═══ */}

        {/* — Garden: rolling green hills — */}
        {(() => {
          const p = easeOut(sub(time, 3, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[0];
          return (
            <g opacity={p}>
              <ellipse cx={v.x + 15} cy="155" rx={28 * p} ry={14 * p} fill="url(#vGlow0)" />
              {/* Hill shapes */}
              <path
                d={`M${v.x - 15} 158 Q${v.x} ${158 - 22 * p} ${v.x + 18} 158
                    Q${v.x + 30} ${158 - 14 * p} ${v.x + 45} 158`}
                fill="none" stroke={v.color} strokeWidth="1.8" opacity={p * 0.7}
              />
              <path
                d={`M${v.x - 10} 158 Q${v.x + 5} ${158 - 18 * p} ${v.x + 22} 158`}
                fill={v.color} opacity={p * 0.12}
              />
              {/* Tiny flowers */}
              {[0, 8, 16, 25].map((dx, fi) => {
                const fp = sub(p, 0.5 + fi * 0.1, 0.3);
                return fp > 0 ? (
                  <circle key={fi} cx={v.x - 5 + dx} cy={153 - Math.sin(dx * 0.4) * 4}
                    r={1.2 * fp} fill={v.color} opacity={fp * 0.6} />
                ) : null;
              })}
            </g>
          );
        })()}

        {/* — Cottage: small house with glowing windows — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[1];
          return (
            <g opacity={p}>
              <ellipse cx={v.x} cy="155" rx={18 * p} ry={10 * p} fill="url(#vGlow1)" />
              {/* Walls */}
              <rect x={v.x - 8} y={148 - 12 * p} width={16 * p} height={12 * p}
                fill="hsl(25, 12%, 14%)" opacity={p * 0.85} rx="1" />
              {/* Roof */}
              <path
                d={`M${v.x - 10} ${148 - 12 * p} L${v.x} ${148 - 20 * p} L${v.x + 10} ${148 - 12 * p} Z`}
                fill="hsl(15, 15%, 18%)" opacity={p * 0.8}
              />
              {/* Windows — warm glow */}
              {[-3, 3].map((wx, wi) => (
                <g key={wi}>
                  <rect x={v.x + wx - 1.5} y={149 - 8 * p} width={3 * p} height={3 * p}
                    fill={v.color} opacity={p * 0.8} rx="0.5" />
                  <rect x={v.x + wx - 1.5} y={149 - 8 * p} width={3 * p} height={3 * p}
                    fill="white" opacity={p * 0.15} rx="0.5" />
                </g>
              ))}
              {/* Chimney smoke */}
              {p > 0.7 && (
                <path
                  d={`M${v.x + 5} ${148 - 20 * p} Q${v.x + 7} ${138 - 20 * p} ${v.x + 4} ${130 - 20 * p}`}
                  fill="none" stroke="#888" strokeWidth="0.8" opacity={(p - 0.7) * 0.3}
                />
              )}
            </g>
          );
        })()}

        {/* — Stars: appearing in the sky — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR * 2, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[2];
          const stars = [
            { x: v.x - 15, y: 30 }, { x: v.x + 5, y: 18 }, { x: v.x + 20, y: 38 },
            { x: v.x - 8, y: 50 }, { x: v.x + 12, y: 55 }, { x: v.x - 20, y: 65 },
            { x: v.x + 25, y: 25 }, { x: v.x, y: 42 },
          ];
          return (
            <g filter="url(#starGlow)">
              {stars.map((st, si) => {
                const sp = sub(p, si * 0.08, 0.3);
                if (sp <= 0) return null;
                const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + si * 1.3);
                return (
                  <circle key={si} cx={st.x} cy={st.y}
                    r={1 + twinkle * 0.5} fill={v.color}
                    opacity={sp * (0.4 + twinkle * 0.3)}
                  />
                );
              })}
            </g>
          );
        })()}

        {/* — Well: stone well with glowing water — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR * 3, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[3];
          return (
            <g opacity={p}>
              <ellipse cx={v.x} cy="155" rx={14 * p} ry={8 * p} fill="url(#vGlow3)" />
              {/* Well base — stone ring */}
              <ellipse cx={v.x} cy={152} rx={7 * p} ry={3 * p}
                fill="none" stroke="#8a9a8a" strokeWidth="1.5" opacity={p * 0.6} />
              <ellipse cx={v.x} cy={148} rx={7 * p} ry={3 * p}
                fill="none" stroke="#8a9a8a" strokeWidth="1.5" opacity={p * 0.6} />
              {/* Side walls */}
              <line x1={v.x - 7 * p} y1={148} x2={v.x - 7 * p} y2={152}
                stroke="#8a9a8a" strokeWidth="1.5" opacity={p * 0.5} />
              <line x1={v.x + 7 * p} y1={148} x2={v.x + 7 * p} y2={152}
                stroke="#8a9a8a" strokeWidth="1.5" opacity={p * 0.5} />
              {/* Glowing water inside */}
              <ellipse cx={v.x} cy={150} rx={5 * p} ry={2 * p}
                fill={v.color} opacity={p * 0.4} />
              <ellipse cx={v.x} cy={150} rx={3 * p} ry={1.2 * p}
                fill="white" opacity={p * 0.15} />
              {/* Roof beam */}
              <line x1={v.x - 5 * p} y1={142} x2={v.x + 5 * p} y2={142}
                stroke="#7a6a5a" strokeWidth="1" opacity={p * 0.5} />
              <line x1={v.x} y1={142} x2={v.x} y2={148}
                stroke="#7a6a5a" strokeWidth="0.8" opacity={p * 0.4} />
            </g>
          );
        })()}

        {/* — Bridge: arched bridge over a gap — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR * 4, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[4];
          return (
            <g opacity={p}>
              <ellipse cx={v.x} cy="155" rx={18 * p} ry={10 * p} fill="url(#vGlow4)" />
              {/* Gap/ravine */}
              <path
                d={`M${v.x - 14} 158 L${v.x - 6} 170 L${v.x + 6} 170 L${v.x + 14} 158`}
                fill="hsl(200, 8%, 5%)" opacity={p * 0.5}
              />
              {/* Arch */}
              <path
                d={`M${v.x - 14} 155 Q${v.x} ${155 - 16 * p} ${v.x + 14} 155`}
                fill="none" stroke={v.color} strokeWidth="2" opacity={p * 0.6}
              />
              {/* Bridge deck */}
              <path
                d={`M${v.x - 14} 155 Q${v.x} ${155 - 4 * p} ${v.x + 14} 155`}
                fill="none" stroke="#8a9a7a" strokeWidth="1.5" opacity={p * 0.5}
              />
              {/* Railings */}
              {[-10, -5, 0, 5, 10].map((rx, ri) => {
                const ry = -2 * Math.cos((rx / 14) * Math.PI * 0.5) * p;
                return (
                  <line key={ri}
                    x1={v.x + rx} y1={155 + ry}
                    x2={v.x + rx} y2={150 + ry}
                    stroke="#8a9a7a" strokeWidth="0.6" opacity={p * 0.3}
                  />
                );
              })}
            </g>
          );
        })()}

        {/* — Library: column with floating book shapes — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR * 5, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[5];
          return (
            <g opacity={p}>
              <ellipse cx={v.x} cy="155" rx={14 * p} ry={8 * p} fill="url(#vGlow5)" />
              {/* Column */}
              <rect x={v.x - 3} y={140 - 10 * p} width={6 * p} height={18 * p}
                fill="hsl(280, 8%, 16%)" opacity={p * 0.7} rx="1" />
              {/* Column capital */}
              <rect x={v.x - 5} y={138 - 10 * p} width={10 * p} height={3 * p}
                fill="hsl(280, 8%, 18%)" opacity={p * 0.6} rx="0.5" />
              {/* Floating books */}
              {[
                { dx: -8, dy: -20, rot: -15 },
                { dx: 6, dy: -25, rot: 10 },
                { dx: -4, dy: -32, rot: -5 },
                { dx: 8, dy: -18, rot: 20 },
              ].map((bk, bi) => {
                const bp = sub(p, 0.4 + bi * 0.12, 0.3);
                if (bp <= 0) return null;
                const floatY = Math.sin(time * 1.2 + bi * 1.8) * 2;
                return (
                  <rect key={bi}
                    x={v.x + bk.dx - 3} y={148 + bk.dy * p + floatY}
                    width={6} height={4}
                    fill={v.color} opacity={bp * 0.4}
                    rx="0.5"
                    transform={`rotate(${bk.rot * p}, ${v.x + bk.dx}, ${148 + bk.dy * p + floatY})`}
                  />
                );
              })}
            </g>
          );
        })()}

        {/* — Standing Stones: with ley glow — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR * 6, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[6];
          return (
            <g opacity={p}>
              <ellipse cx={v.x} cy="155" rx={18 * p} ry={10 * p} fill="url(#vGlow6)" />
              {/* Stones */}
              {[-12, -4, 4, 12].map((sx, si) => {
                const h = (10 + si * si * 0.3) * p;
                return (
                  <rect key={si}
                    x={v.x + sx - 2} y={155 - h}
                    width={4 * p} height={h}
                    fill="hsl(210, 10%, 18%)" opacity={p * 0.7}
                    rx="1"
                  />
                );
              })}
              {/* Ley glow between stones */}
              {p > 0.6 && (
                <path
                  d={`M${v.x - 12} ${148} Q${v.x} ${140} ${v.x + 12} ${148}`}
                  fill="none" stroke={v.color} strokeWidth="1.2"
                  opacity={(p - 0.6) * 0.5}
                />
              )}
            </g>
          );
        })()}

        {/* — Sanctum: moonbeam shafts in a clearing — */}
        {(() => {
          const p = easeOut(sub(time, 3 + VIGNETTE_DUR * 7, VIGNETTE_DUR));
          if (p <= 0) return null;
          const v = VIGNETTES[7];
          return (
            <g opacity={p}>
              <ellipse cx={v.x} cy="150" rx={16 * p} ry={12 * p} fill="url(#vGlow7)" />
              {/* Moon beams */}
              {[-8, 0, 8].map((bx, bi) => {
                const bp = sub(p, 0.3 + bi * 0.15, 0.4);
                if (bp <= 0) return null;
                return (
                  <g key={bi} opacity={bp * 0.35}>
                    <line
                      x1={v.x + bx + 2} y1={80}
                      x2={v.x + bx - 2} y2={155}
                      stroke={v.color} strokeWidth={3 * bp}
                      opacity={0.3}
                    />
                    <line
                      x1={v.x + bx + 1} y1={85}
                      x2={v.x + bx - 1} y2={155}
                      stroke="white" strokeWidth={1 * bp}
                      opacity={0.15}
                    />
                  </g>
                );
              })}
              {/* Ground clearing glow */}
              <ellipse cx={v.x} cy="155" rx={10 * p} ry={3 * p}
                fill={v.color} opacity={p * 0.15} />
              {/* Spirit silhouettes — 3 gathered in the clearing, the
                   Sanctum's signature element. Appear after moonbeams settle. */}
              {p > 0.6 && [-5, 0, 5].map((dx, si) => {
                const sp = sub(p, 0.6 + si * 0.08, 0.35);
                if (sp <= 0) return null;
                const cx = v.x + dx;
                const bob = Math.sin(time * 1.8 + si * 1.5) * 0.4;
                const cy = 152 + bob;
                return (
                  <g key={`ss${si}`} opacity={sp * 0.9}>
                    {/* Halo */}
                    <circle cx={cx} cy={cy - 2} r={2}
                      fill={v.color} opacity={sp * 0.25} />
                    {/* Head */}
                    <circle cx={cx} cy={cy - 2} r={0.8}
                      fill="#ffe8a8" opacity={sp * 0.75} />
                    {/* Robe */}
                    <path
                      d={`M${cx - 1} ${cy - 1}
                          C${cx - 1.3} ${cy + 0.5}, ${cx - 1.1} ${cy + 1.5}, ${cx - 0.8} ${cy + 2.5}
                          L${cx + 0.8} ${cy + 2.5}
                          C${cx + 1.1} ${cy + 1.5}, ${cx + 1.3} ${cy + 0.5}, ${cx + 1} ${cy - 1}
                          Z`}
                      fill={v.color} opacity={sp * 0.55}
                    />
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* ═══ Phase 3: Great Tree grows from center ═══
             Tree shifted up 25 SVG units so the "The forest remembers"
             text and Begin Again button read clean beneath the trunk. */}
        {treeGrow > 0 && (
          <g>
            {/* Roots spreading to connect locations */}
            {rootSpread > 0 && VIGNETTES.map((v, i) => {
              const rp = easeInOut(sub(rootSpread, i * 0.08, 0.5));
              if (rp <= 0) return null;
              const cx = 210;
              const cy = 175;
              // Bezier root from tree base toward each vignette
              const dx = v.x - cx;
              const midX = cx + dx * 0.5;
              const midY = cy + 8 + Math.abs(dx) * 0.04;
              const endX = cx + dx * rp;
              const endY = 155 + (cy - 155) * (1 - rp);
              return (
                <g key={`root${i}`}>
                  <path
                    d={`M${cx} ${cy} Q${midX} ${midY} ${endX} ${endY}`}
                    fill="none" stroke="hsl(30, 18%, 16%)" strokeWidth="2"
                    opacity={rp * 0.6}
                  />
                  {/* Ley energy on root */}
                  {leyFlow > 0 && (
                    <path
                      d={`M${cx} ${cy} Q${midX} ${midY} ${endX} ${endY}`}
                      fill="none" stroke="#d8c890" strokeWidth="1.2"
                      opacity={leyFlow * 0.25 * (0.5 + 0.5 * Math.sin(time * 3 + i * 0.8))}
                    />
                  )}
                </g>
              );
            })}

            {/* Trunk — base y=195 (shifted up 25 from previous 220) */}
            <path
              d={`M${202} ${195}
                  C${198} ${195 - 40 * treeGrow}, ${195} ${195 - 70 * treeGrow}, ${200} ${195 - 100 * treeGrow}
                  L${220} ${195 - 100 * treeGrow}
                  C${225} ${195 - 70 * treeGrow}, ${222} ${195 - 40 * treeGrow}, ${218} ${195}
                  Z`}
              fill={`hsl(30, ${15 + radiance * 5}%, ${12 + radiance * 3}%)`}
              opacity={treeGrow}
            />

            {/* Major branches */}
            {[
              { bx: -30, by: -85, cx1: -10, cy1: -70 },
              { bx: 30, by: -85, cx1: 10, cy1: -70 },
              { bx: -45, by: -65, cx1: -20, cy1: -55 },
              { bx: 45, by: -65, cx1: 20, cy1: -55 },
              { bx: -15, by: -95, cx1: -5, cy1: -80 },
              { bx: 15, by: -95, cx1: 5, cy1: -80 },
            ].map((br, bi) => {
              const bp = sub(treeGrow, 0.3 + bi * 0.05, 0.5);
              if (bp <= 0) return null;
              return (
                <path key={bi}
                  d={`M210 ${195 - 80 * treeGrow} Q${210 + br.cx1 * bp} ${195 + br.cy1 * bp} ${210 + br.bx * bp} ${195 + br.by * bp}`}
                  fill="none" stroke={`hsl(30, 15%, ${13 + radiance * 3}%)`}
                  strokeWidth={2 - bi * 0.15} opacity={bp * 0.7}
                />
              );
            })}

            {/* Canopy clusters — shifted up 25 with the trunk */}
            {[
              { cx: 170, cy: 90,  rx: 28, ry: 18 },
              { cx: 210, cy: 75,  rx: 35, ry: 22 },
              { cx: 250, cy: 90,  rx: 28, ry: 18 },
              { cx: 190, cy: 83,  rx: 22, ry: 16 },
              { cx: 230, cy: 83,  rx: 22, ry: 16 },
              { cx: 210, cy: 93,  rx: 18, ry: 12 },
            ].map((c, i) => {
              const cp = easeOut(sub(treeGrow, 0.4 + i * 0.06, 0.4));
              if (cp <= 0) return null;
              return (
                <ellipse key={i}
                  cx={c.cx} cy={c.cy}
                  rx={c.rx * cp} ry={c.ry * cp}
                  fill={`hsl(125, ${20 + canopyLight * 18}%, ${10 + canopyLight * 10}%)`}
                  opacity={cp * 0.75}
                />
              );
            })}

            {/* Canopy highlight glow */}
            {canopyLight > 0 && (
              <ellipse cx="210" cy="85"
                rx={60 * canopyLight} ry={35 * canopyLight}
                fill="url(#canopyGrad)" opacity={canopyLight * 0.5}
              />
            )}

            {/* Spirit lights in canopy — shifted up 25 */}
            {[
              { x: 180, y: 83 }, { x: 210, y: 73 }, { x: 240, y: 81 },
              { x: 195, y: 90 }, { x: 225, y: 87 }, { x: 210, y: 80 },
            ].map((sl, i) => {
              const sp = sub(treeGrow, 0.7, 0.3);
              if (sp <= 0) return null;
              const twinkle = 0.4 + 0.6 * Math.sin(time * 2.5 + i * 1.7);
              return (
                <g key={i} opacity={sp * twinkle * 0.6}>
                  <circle cx={sl.x} cy={sl.y} r="4" fill="#b8d8a8" opacity={0.1} />
                  <circle cx={sl.x} cy={sl.y} r="1.8" fill="#d8e8c8" opacity={0.5} />
                  <circle cx={sl.x} cy={sl.y} r="0.6" fill="white" opacity={0.6} />
                </g>
              );
            })}
          </g>
        )}

        {/* ═══ Phase 4: Golden radiance + ley energy ═══ */}
        {radiance > 0 && (
          <g>
            {/* Overall golden glow */}
            <ellipse cx="210" cy="155"
              rx={180 * radiance} ry={90 * radiance}
              fill="url(#goldenRadiance)"
            />

            {/* Pulsing energy dots along roots */}
            {leyFlow > 0 && VIGNETTES.map((v, i) => {
              const pulseT = ((time - 18) * 0.5 + i * 0.35) % 1;
              const cx = 210;
              const cy = 175;
              const dx = v.x - cx;
              const px = cx + dx * pulseT;
              const py = cy + (155 - cy) * pulseT + 8 * Math.sin(pulseT * Math.PI) * (1 + Math.abs(dx) * 0.003);
              return (
                <g key={`pulse${i}`}>
                  <circle cx={px} cy={py} r="3"
                    fill="#d8c890"
                    opacity={leyFlow * 0.3 * (1 - Math.abs(pulseT - 0.5) * 2)}
                  />
                  <circle cx={px} cy={py} r="1.2"
                    fill="white"
                    opacity={leyFlow * 0.2 * (1 - Math.abs(pulseT - 0.5) * 2)}
                  />
                </g>
              );
            })}

            {/* Gentle world pulse */}
            <ellipse cx="210" cy="140"
              rx={100 + Math.sin(time * 1.5) * 10}
              ry={50 + Math.sin(time * 1.5) * 5}
              fill="#d8c890"
              opacity={radiance * 0.03 * (0.7 + 0.3 * Math.sin(time * 1.5))}
            />
          </g>
        )}
      </svg>

      {/* Text overlay */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className={s.textOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.5 }}
          >
            <motion.p
              className={s.body}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              The forest remembers.
            </motion.p>

            <motion.div
              className={s.dotRow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 2 }}
            >
              {LEVELS.map((l, i) => (
                <div key={i} className={s.dot} style={{ background: l.accent }} />
              ))}
            </motion.div>

            <motion.button
              className={s.restartBtn}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 4 }}
              onClick={restart}
            >
              Begin Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
