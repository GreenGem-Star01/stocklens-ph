/**
 * Runs before paint to avoid a flash of the wrong theme on first load.
 * Reads the persisted Zustand settings blob (stocklens-settings).
 */
export function ThemeInitScript() {
  const script = `(function(){try{var raw=localStorage.getItem("stocklens-settings");if(!raw)return;var p=JSON.parse(raw);var state=p.state||p;var theme=state.theme;if(theme==null&&typeof state.darkMode==="boolean"){theme=state.darkMode?"dark":"light"}theme=theme||"light";var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark)}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
