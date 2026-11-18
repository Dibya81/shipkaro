/**
 * Theme state. The theme lives on <html data-theme="dark|light"> and in
 * localStorage("theme"). CSS variables in globals.css do all the colouring;
 * components never read the theme directly.
 */

export type Theme = "dark" | "light";

export const THEME_KEY = "theme";
export const DEFAULT_THEME: Theme = "light";
const THEME_COLORS: Record<Theme, string> = { dark: "#0A0A0B", light: "#F5F5F2" };

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Kept tiny and dependency-free; it is inlined as a string.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"${THEME_COLORS.light}":"${THEME_COLORS.dark}")}}catch(e){}})();`;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Keep the mobile browser toolbar colour in step with the page. */
export function syncThemeColor(theme: Theme = readTheme()) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", THEME_COLORS[theme]));
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode: the theme still applies for this visit */
  }
  syncThemeColor(theme);
}

/** useSyncExternalStore subscription: fires when data-theme changes on <html>. */
export function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
