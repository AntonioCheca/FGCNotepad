export const THEME_MODE_PRELOAD_SCRIPT = `
(function () {
  try {
    var background = "#04141f";
    var foreground = "#e4f2f8";

    document.documentElement.dataset.fgcThemeMode = "dark";
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
