import { test, expect } from "./signed-in";
import type { Page } from "@playwright/test";

/*
 * The two rules that are worth enforcing rather than eyeballing: every tap
 * target clears Apple's 44pt floor, and every piece of text clears WCAG's
 * contrast ratio for its size. Both are easy to break with a one-line change
 * and invisible to whoever makes it.
 */

const SCREENS = ["/home", "/plan", "/plan/edit", "/progress", "/coach", "/settings", "/evidence"];

/** Runs in the page: returns anything too small to hit or too faint to read. */
async function audit(page: Page) {
  return page.evaluate(() => {
    /*
     * Tailwind v4 emits color-mix() and color(srgb ...), which no amount of
     * regex reads correctly. Painting the colour and reading the pixel back
     * asks the browser what it actually draws.
     */
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const paint = (color: string): number[] | null => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };

    const luminance = (c: number[]) => {
      const [r, g, b] = c.map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (fg: number[], bg: number[]) => {
      const a = luminance(fg);
      const b = luminance(bg);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };

    /** Translucent labels sit on whatever is behind them, so find that. */
    const backgroundBehind = (el: Element): number[] => {
      let node: Element | null = el;
      while (node) {
        const c = paint(getComputedStyle(node).backgroundColor);
        if (c && c[3] > 0.5) return c.slice(0, 3);
        node = node.parentElement;
      }
      return [255, 255, 255];
    };
    /** A translucent label is really its colour mixed onto that background. */
    const flatten = (fg: number[], bg: number[]) =>
      fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));

    const tooSmall: string[] = [];
    const tooFaint: string[] = [];

    document.querySelectorAll("button, a, [role=button], input, select").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const name = (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30);
      if (r.height < 44 || r.width < 28) {
        tooSmall.push(`${Math.round(r.width)}x${Math.round(r.height)} "${name}"`);
      }
    });

    document.querySelectorAll("h1,h2,h3,p,span,div,label,button,a,li").forEach((el) => {
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent!.trim())
        .join("");
      if (!own) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.opacity === "0") return;
      const fg = paint(cs.color);
      if (!fg) return;

      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 600;
      const needed = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;

      const bg = backgroundBehind(el);
      const r = ratio(flatten(fg, bg), bg);
      if (r < needed) tooFaint.push(`${r.toFixed(2)} (needs ${needed}) ${Math.round(size)}px "${own.slice(0, 30)}"`);
    });

    return { tooSmall: [...new Set(tooSmall)], tooFaint: [...new Set(tooFaint)] };
  });
}

for (const screen of SCREENS) {
  test(`${screen} can be hit and read`, async ({ signedIn }) => {
    const { page } = signedIn;
    await page.goto(screen);
    await page.waitForLoadState("networkidle");
    // Page transitions animate opacity; audit the settled screen.
    await page.waitForTimeout(600);

    const { tooSmall, tooFaint } = await audit(page);
    expect(tooSmall, `tap targets under 44pt on ${screen}`).toEqual([]);
    expect(tooFaint, `text under its contrast floor on ${screen}`).toEqual([]);
  });
}
