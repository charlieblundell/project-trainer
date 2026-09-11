/** The public address and description, for anything seen outside the app: link previews, search results, shares. */
export const SITE_URL = (process.env.APP_URL?.trim() || "https://project-trainer-inky.vercel.app").replace(/\/+$/, "");

export const SITE_NAME = "Your Personal Trainer";

export const SITE_DESCRIPTION =
  "A training plan written for your goal, your kit and your time, that moves every target from what you actually lift — with a coach that shows the research behind its advice.";
