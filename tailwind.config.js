/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: {
    // The existing site pages have their own baseline styles (assets/site.css).
    // Preflight is a global CSS reset — leaving it on would bleed into and
    // fight with those pages wherever an island's stylesheet is loaded.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
