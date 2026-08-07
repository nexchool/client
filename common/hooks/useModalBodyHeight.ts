import { useWindowDimensions } from 'react-native';

/**
 * The tallest a modal's scrollable body may be on *this* phone.
 *
 * A modal is a header, a scrolling body and usually a footer with the button
 * that commits the thing. Giving the body a fixed height sizes it for whatever
 * phone the designer had: 420pt of body plus header, footer and safe areas
 * comes to roughly 600pt, which fits a 15 Pro and does not fit a 5.8" phone at
 * 568pt. The part that falls off the bottom is the footer — so on the small
 * phone the user can read the form and cannot submit it.
 *
 * So the height is a share of the window with the design value as a ceiling:
 * big phones get exactly what was drawn, small phones get a body that leaves
 * room for the button. It can only ever shrink, never grow.
 *
 * @param designHeight what the design asks for on a roomy phone
 * @param share how much of the window the body may take once chrome is allowed
 *   for. 0.55 leaves ~45% for header, footer, safe areas and a little backdrop.
 */
export function useModalBodyHeight(designHeight: number, share = 0.55): number {
  const { height } = useWindowDimensions();
  return Math.min(designHeight, Math.round(height * share));
}
