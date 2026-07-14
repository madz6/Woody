/**
 * WOODY — BRAND PACKAGE
 * Public API. Import everything brand-related from here.
 *
 * @example
 *   import { color, font, ease, acoustic } from '@/brand'
 *   import { WoodyIcon, WoodyLockup }       from '@/brand'
 *   import { cssVars }                       from '@/brand'
 */

// Tokens — the canonical design values
export {
  color,
  font,
  space,
  radius,
  ease,
  duration,
  z,
  acoustic,
  artifact,
  cssVars,
} from './tokens'

// Type exports
export type {
  ColorToken,
  SpaceToken,
  RadiusToken,
  AcousticDim,
  SessionPalette,
  ArtifactFormat,
  AcousticPose,
} from './tokens'

// Brand components
export { WoodyIcon, WoodyWordmark, WoodyLockup } from '../components/brand/WoodyIcon'
