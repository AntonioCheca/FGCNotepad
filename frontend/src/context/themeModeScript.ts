export const THEME_STORAGE_KEY = "fgc-theme-mode";

export const THEME_MODE_PRELOAD_SCRIPT = `
(function () {
  try {
    var key = "${THEME_STORAGE_KEY}";
    var storedMode = window.localStorage.getItem(key);
    var mode = storedMode === "light" || storedMode === "dark"
      ? storedMode
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var background = mode === "dark" ? "#04141f" : "#f8fafc";
    var foreground = mode === "dark" ? "#e4f2f8" : "#0f172a";

    document.documentElement.dataset.fgcThemeMode = mode;
    document.documentElement.style.backgroundColor = background;
    document.documentElement.style.color = foreground;

    var applyBodyTheme = function () {
      document.body.style.backgroundColor = background;
      document.body.style.color = foreground;
    };

    if (document.body) {
      applyBodyTheme();
    } else {
      document.addEventListener("DOMContentLoaded", applyBodyTheme, {once: true});
    }
  } catch (error) {
  }
})();
`;
