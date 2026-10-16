"use client";

import { useState } from "react";
import styles from "@/styles/landing.module.css";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set([0]));

  function toggle(i: number) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className={styles.faqList}>
      {items.map((item, i) => {
        const isOpen = openSet.has(i);
        return (
          <div key={item.q} className={styles.faqItem} data-open={isOpen}>
            <button className={styles.faqQ} onClick={() => toggle(i)} aria-expanded={isOpen}>
              <span>
                <span className={styles.tag}>{String(i + 1).padStart(2, "0")}</span>
                {item.q}
              </span>
              <span className={styles.faqChevron}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            <div className={styles.faqAWrap}>
              <div className={styles.faqA}>
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
