// Full class names, so Tailwind can find them.
import type { AqiBand } from './aqi'
import type { Level } from './verdict'

export const BAND_BG: Record<AqiBand, string> = {
  'good': 'bg-band-good',
  'fair': 'bg-band-fair',
  'moderate': 'bg-band-moderate',
  'poor': 'bg-band-poor',
  'very-poor': 'bg-band-very-poor',
  'extremely-poor': 'bg-band-extremely-poor',
}

export const LEVEL_STYLE: Record<Level, { accent: string, text: string, soft: string }> = {
  good: { accent: 'bg-level-good', text: 'text-level-good-text', soft: 'bg-level-good/12' },
  caution: { accent: 'bg-level-caution', text: 'text-level-caution-text', soft: 'bg-level-caution/15' },
  bad: { accent: 'bg-level-bad', text: 'text-level-bad-text', soft: 'bg-level-bad/12' },
}
