export const THEME_COOKIE = "az_theme";

/** Inline boot script — place in <head> to avoid FOUC */
export const themeBootScript = `(function(){try{var k='az_theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){var m=document.cookie.match(/(?:^|; )az_theme=([^;]+)/);t=m?decodeURIComponent(m[1]):'dark';}if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
