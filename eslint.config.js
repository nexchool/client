// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * The spacing scale: a 4pt grid, with 2 as the one sub-grid step for optical
 * nudges, plus the two scroll insets. Anything else is a guess.
 *
 * Typography and colour were guarded from the start; spacing was not, and it
 * drifted to 3, 5, 6, 10, 11, 14 and 26 across thirty files — each a
 * reasonable-looking local choice that added up to no rhythm at all.
 */
const SPACING_SCALE = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 96, 120];

const spacingRule = {
  selector:
    "Property[key.name=/^(padding|margin|gap|rowGap|columnGap)(Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?$/]" +
    ` > Literal${SPACING_SCALE.map((n) => `[value!=${n}]`).join('')}`,
  message:
    'Off-scale spacing. Use useTheme().spacing (xs 4 · sm 8 · md 16 · lg 24 · xl 32), ' +
    'or spacing.scrollBottom / spacing.scrollBottomWithFooter for list insets.',
};

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
        spacingRule,
      ],
    },
  },
  {
    // Spacing reaches further than the other two: the shared primitives in
    // common/** set the rhythm every screen inherits, so an off-scale gap
    // there is worse, not exempt. Typography and colour stay out of this
    // scope on purpose — common/theme/* is where those scales are *defined*,
    // and a definition setting a raw fontSize is doing its job.
    files: ['common/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', spacingRule],
    },
  },
]);
