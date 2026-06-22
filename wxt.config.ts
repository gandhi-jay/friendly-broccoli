import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  outDir: ".",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Friendly Broccoli",
    permissions: ["storage", "webNavigation"],
    host_permissions: ["<all_urls>"],
    content_security_policy: {
      extension_pages: "script-src 'self'; frame-src https://www.gandhijay.com; object-src 'self'",
    },
  },
  webExt: {
    binaries: {
      chrome: "/Users/virali/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  },
  hooks: {
    "build:manifestGenerated": (_, manifest) => {
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true;
      }
    },
  },
});
