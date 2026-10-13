export const THEME_COOKIE = "az_theme";

/** Force light theme and clear any leftover dark preference. */
export const themeBootScript = `(function(){try{document.documentElement.setAttribute('data-theme','light');localStorage.setItem('az_theme','light');document.cookie='az_theme=light; path=/; max-age=31536000; samesite=lax';}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
