"use client";

import { useRef, useState } from "react";
import styles from "@/styles/landing.module.css";

const MINI_QR_PATTERN = [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
const STAMP_ROTATIONS = [-6, 4, -3, 7, -5, 3];
const TOTAL_STAMPS = 6;

export function LoyaltyCardDemo() {
  const [count, setCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    // Tilt is a hover effect; on touch it would fight page scroll and get
    // stuck mid-rotation once the finger lifts, so only fine pointers
    // (mouse/trackpad) drive it. Touch devices get a CSS idle animation
    // instead (see .card / @keyframes cardIdle).
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wrap = wrapRef.current;
    const card = cardRef.current;
    const sheen = sheenRef.current;
    if (!wrap || !card || !sheen) return;
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 14;
    const ry = (px - 0.5) * 16;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    sheen.style.setProperty("--mx", `${px * 100}%`);
    sheen.style.setProperty("--my", `${py * 100}%`);
  }

  function handlePointerLeave() {
    const card = cardRef.current;
    if (card) card.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  function handleDemoClick() {
    setCount((c) => (c >= TOTAL_STAMPS ? 0 : c + 1));
  }

  const rewardUnlocked = count >= TOTAL_STAMPS;

  return (
    <div className={styles.heroStage}>
      <svg className={`${styles.floatDeco} ${styles.spark}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6L12 2z" />
      </svg>

      <div
        className={styles.cardWrap}
        ref={wrapRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <div className={styles.card} ref={cardRef}>
          <div className={styles.cardSheen} ref={sheenRef} />
          <div className={styles.cardTop}>
            <span className={styles.cardBrand}>
              Cafetería
              <br />
              Mi Tacita
            </span>
            <span className={styles.miniQr} aria-hidden="true">
              {MINI_QR_PATTERN.map((v, i) => (
                <i key={i} className={v ? "" : styles.off} />
              ))}
            </span>
          </div>

          <div className={styles.stampRow}>
            {STAMP_ROTATIONS.map((rot, i) => (
              <div
                key={i}
                className={`${styles.stamp} ${i < count ? styles.filled : ""}`}
                style={{ "--r": `${rot}deg` } as React.CSSProperties}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6L12 2z" />
                </svg>
              </div>
            ))}
          </div>

          <div className={styles.cardFoot}>
            <span className={styles.cardFootLabel}>Sellos</span>
            <span className={styles.cardCount}>{count}/{TOTAL_STAMPS}</span>
          </div>

          {rewardUnlocked && (
            <div className={styles.rewardFlare}>
              <strong>¡Café gratis desbloqueado!</strong>
              <span>Muéstralo en caja para canjear</span>
            </div>
          )}
        </div>

        <button className={styles.demoBtn} onClick={handleDemoClick}>
          {rewardUnlocked ? "Reiniciar demo" : "Simular compra"}
        </button>
        <p className={styles.demoHint}>Demo interactiva — así suma sellos un cliente real.</p>
      </div>
    </div>
  );
}
