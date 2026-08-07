// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

/**
 * `react-native-pdf` is native-only. StudentDocumentViewerModal already knows
 * that — it returns undefined on web before it ever calls `require` — but the
 * bundler does not run that check. Metro resolves every `require` it can see
 * statically, pulls the package in, and fails the whole web build on a React
 * Native internal the package imports.
 *
 * So the runtime guard was correct and the build still broke. Resolving the
 * package to an empty module on web lets that guard mean what it says, which
 * is what makes `expo start --web` usable — the quickest way to look at a
 * screen at many widths at once without a simulator per device.
 *
 * Native platforms are untouched: they resolve the real package as before.
 */
const NATIVE_ONLY_ON_WEB = ["react-native-pdf"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && NATIVE_ONLY_ON_WEB.includes(moduleName)) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
