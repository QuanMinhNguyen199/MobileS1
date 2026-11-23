// Runtime public assets must respect Vite's base, including /MobileS1/ on Pages.
const base = import.meta.env.BASE_URL;

export const LOGIN_ASSETS = {
  logo: `${base}app/logo.svg`,
  background: `${base}login/bg.webp`,
  gotix: `${base}login/gotix.svg`,
};
