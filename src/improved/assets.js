// Runtime public assets must respect Vite's base, including /MobileS1/ on Pages.
const base = import.meta.env.BASE_URL;

export const LOGIN_ASSETS = {
  emblem: `${base}login/emblem.svg`,
  background: `${base}login/bg.webp`,
  gotix: `${base}login/gotix.svg`,
};
