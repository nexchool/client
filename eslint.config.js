// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Design-system guard. Flipped to "error" after Workstream B migrated
    // every screen off raw styling (whole-app count reached 0). Raw
    // fontSize/fontFamily/hex in modules/** or app/** now fails the build.
    // Genuinely-required raw values (markdown-lib heading sizes, Android
    // notification-channel ARGB) are suppressed inline with an explanation.
    files: ['modules/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='fontSize']",
          message: 'Use the typography scale via <Text variant="..."> instead of a raw fontSize.',
        },
        {
          selector: "Property[key.name='fontFamily']",
          message: 'Font family is set by the typography role — do not set fontFamily directly.',
        },
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: 'Use a palette color token (useTheme().palette.*) instead of a hex literal.',
        },
      ],
    },
  },
]);
