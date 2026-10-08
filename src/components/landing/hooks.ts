"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Adds data-in while the element is on screen (drives .reveal, .words, .draw-*), and removes it once the
 * element has fully left, so the entrance plays again each time a screen comes back.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.2): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= threshold) el.setAttribute("data-in", "");
        else if (!e.isIntersecting) el.removeAttribute("data-in");
      },
      { threshold: [0, threshold] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/** Sets --v (−1 … 1, offset of the section from the screen centre) and --a = |v| on every [data-px] section. */
export function useParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of document.querySelectorAll<HTMLElement>("[data-px]")) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) continue;
        const v = Math.max(-1, Math.min(1, (r.top + Math.min(r.height, vh) / 2 - vh / 2) / vh));
        el.style.setProperty("--v", v.toFixed(4));
        el.style.setProperty("--a", Math.abs(v).toFixed(4));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
}

/**
 * Scroll progress through a tall scene: 0 when its top reaches the viewport top,
 * 1 when its bottom reaches the viewport bottom. Written to the CSS variable --p (no re-renders).
 */
export function useSceneProgress<T extends HTMLElement>(onProgress?: (p: number) => void): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      cb.current?.(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / span));
      el.style.setProperty("--p", p.toFixed(4));
      cb.current?.(p);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return ref;
}

/** Which [data-nav] section is crossing the middle of the screen. */
export function useActiveSection<T extends string>(ids: readonly T[]) {
  const [active, setActive] = useState<T>(ids[0]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(((e.target as HTMLElement).dataset.nav as T) ?? ids[0]);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-nav]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}
