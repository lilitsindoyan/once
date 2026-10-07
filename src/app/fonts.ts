import { Cormorant_Garamond, GFS_Didot, Montserrat, Noto_Sans_Armenian, Noto_Serif_Armenian } from "next/font/google";

/*
 * The Figma design uses Didot (display), Cormorant Garamond (nav, buttons) and Montserrat (body).
 * Didot is a commercial font: GFS Didot stands in until the client provides a web licence.
 * Noto Armenian covers Armenian text, which the brand fonts don't include.
 */
export const didot = GFS_Didot({ subsets: ["latin"], weight: "400", variable: "--font-didot", display: "swap" });
export const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
export const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], variable: "--font-montserrat", display: "swap" });
export const notoSansArmenian = Noto_Sans_Armenian({ subsets: ["armenian"], variable: "--font-noto-sans-armenian", display: "swap" });
export const notoSerifArmenian = Noto_Serif_Armenian({ subsets: ["armenian"], variable: "--font-noto-serif-armenian", display: "swap" });

export const fontVariables = [didot, cormorant, montserrat, notoSansArmenian, notoSerifArmenian]
  .map((f) => f.variable)
  .join(" ");
