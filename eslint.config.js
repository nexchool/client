// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Design-system guard. Staged at "warn" — flips to "error" repo-wide
    // once Workstream B migrates all screens off raw styling.
    files: ['modules/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
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
