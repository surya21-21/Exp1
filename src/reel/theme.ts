import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";

const inter = loadInter("normal", {weights: ["400", "500", "600", "700", "800"], subsets: ["latin"]});
const playfair = loadPlayfair("italic", {weights: ["500", "700"], subsets: ["latin"]});

export const SANS = inter.fontFamily;
export const SERIF = playfair.fontFamily;

// Dark stage, light Apple-style windows on top.
export const C = {
  bg0: "#07080d",
  bg1: "#12141f",
  text: "#ffffff",
  dim: "rgba(255,255,255,0.62)",
  window: "#ffffff",
  chrome: "#ececf0",
  border: "#d9dae0",
  ink: "#1d1d1f",
  ink2: "#6e6e73",
  link: "#0071e3",
  red: "#ff5f57",
  yellow: "#febc2e",
  green: "#28c840",
};

export const fmtNum = (n: number | null): string => {
  if (n === null || n === undefined) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n)}`;
};

export const fmtMoney = (n: number): string =>
  `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
