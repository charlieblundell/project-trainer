import { Archivo, Source_Sans_3 } from "next/font/google";

/**
 * Type for the pages a first-time visitor sees.
 *
 * Archivo is loaded with its width axis so headlines can be set condensed,
 * the way printed training schedules and gym timetables are. Source Sans 3 is
 * plain and very readable at small sizes, which matters for an audience that
 * includes people who don't have young eyes.
 */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

/** Put on the outermost element of a marketing page to make both faces available. */
export const marketingFontClasses = `${display.variable} ${body.variable}`;
