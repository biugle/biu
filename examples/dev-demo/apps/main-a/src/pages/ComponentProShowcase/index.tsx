/**
 * Backward-compatible deep-link alias.
 *
 * Component demos now have one catalog and one documentation page.  Keep the
 * old module path importable for bookmarks and local integrations, but render
 * the unified catalog instead of maintaining a second UI/Pro implementation.
 */
export { default } from "../ComponentUIShowcase/index.js";
