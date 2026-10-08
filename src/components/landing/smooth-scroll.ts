"use client";

import { useEffect } from "react";

/**
 * "One screen at a time" scrolling for the landing (desktop), like the Figma prototype:
 * each wheel gesture / arrow key moves exactly one screen, with an eased glide.
 * Tall scroll scenes ([data-snap="scene"]) have two stops — start and end — and the glide between them
 * plays the scene's animation. Phones and small windows keep normal scrolling.
 */

let paused = false;
let goTo: ((target: number, ms?: number) => void) | null = null;

export const pauseScroll = () => {
  paused = true;
};
export const resumeScroll = () => {
  paused = false;
};

/** Glide to a section (side menu, Back to home). */
export function scrollToSection(el: HTMLElement) {
  const y = el.getBoundingClientRect().top + window.scrollY;
  if (goTo) goTo(y);
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Every resting position on the page, top to bottom. */
function stops() {
  const y0 = window.scrollY;
  const vh = window.innerHeight;
  const out: { y: number; scene: boolean }[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("[data-snap]")) {
    const top = Math.round(el.getBoundingClientRect().top + y0);
    const end = top + el.offsetHeight - vh;
    out.push({ y: top, scene: false });
    if (end > top + 40) out.push({ y: end, scene: el.dataset.snap === "scene" });
  }
  return out.sort((a, b) => a.y - b.y);
}

export function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    const enabled = () => window.innerWidth >= 1024 && window.innerHeight >= 560;

    let anim = 0;
    let animating = false;
    let lastWheel = 0;
    let needQuiet = false; // after a glide, wait for the trackpad's momentum to stop

    const glide = (target: number, ms?: number) => {
      cancelAnimationFrame(anim);
      const from = window.scrollY;
      const dist = target - from;
      if (Math.abs(dist) < 2) return;
      const duration = ms ?? Math.min(2400, 1150 + Math.abs(dist) * 0.45);
      const start = performance.now();
      animating = true;
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo(0, from + dist * easeInOut(t));
        if (t < 1) anim = requestAnimationFrame(frame);
        else {
          animating = false;
          needQuiet = true;
        }
      };
      anim = requestAnimationFrame(frame);
    };
    goTo = glide;

    const step = (dir: 1 | -1) => {
      const list = stops();
      const y = window.scrollY;
      const next = dir > 0 ? list.find((s) => s.y > y + 4) : [...list].reverse().find((s) => s.y < y - 4);
      if (!next) return;
      // Into or out of a scene: slower, so its animation reads.
      const prev = list.find((s) => Math.abs(s.y - y) <= 4);
      const scene = (dir > 0 && next.scene) || (dir < 0 && prev?.scene);
      glide(next.y, scene ? 2600 : undefined);
    };

    const onWheel = (e: WheelEvent) => {
      if (!enabled() || e.ctrlKey) return; // pinch-zoom stays native
      const target = e.target as HTMLElement | null;
      if (target?.closest("textarea, [data-native-scroll]")) return;
      e.preventDefault();
      const now = performance.now();
      const quietGap = now - lastWheel > 180;
      lastWheel = now;
      if (paused || animating) return;
      if (needQuiet && !quietGap) return;
      needQuiet = false;
      if (Math.abs(e.deltaY) < 6) return;
      step(e.deltaY > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (!enabled() || paused) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      const down = ["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey;
      const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (!down && !up && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      if (animating) return;
      if (e.key === "Home") return glide(0);
      if (e.key === "End") return glide(stops().at(-1)?.y ?? 0);
      step(down ? 1 : -1);
    };

    // Scrollbar drags or resizes: settle on the nearest stop once the page is still.
    let idle: ReturnType<typeof setTimeout>;
    const settle = () => {
      if (!enabled() || animating || paused) return;
      const y = window.scrollY;
      const nearest = stops().reduce((a, b) => (Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a), { y, scene: false });
      if (Math.abs(nearest.y - y) > 2) glide(nearest.y, 800);
    };
    const onScroll = () => {
      if (animating) return;
      clearTimeout(idle);
      idle = setTimeout(settle, 220);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(anim);
      clearTimeout(idle);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      goTo = null;
    };
  }, []);
}
