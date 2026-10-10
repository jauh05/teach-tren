import { colors } from '../../theme/tokens'
import type { TopicStatus } from '../../domain/topicStatus'

export type SealKind = 'check' | 'alert' | 'lock'

export interface TopicVisual {
  // Radius in world units. Diameter is 60 to 76 at 100% zoom (docs/role.md section 4.1).
  radius: number
  fill: string
  stroke: string
  strokeWidth: number
  dashed: boolean
  seal?: { kind: SealKind; badgeFill: string; iconColor: string }
  // Score shown in the middle of the topic (SEDANG). Otherwise it goes below the name.
  scoreInCenter: boolean
  labelColor: string
  labelWeight: number
  // Small label above the topic (the "baru" tag).
  tagLabel?: string
}

export const TOPIC_VISUALS: Record<TopicStatus, TopicVisual> = {
  DIKUASAI: {
    radius: 30,
    fill: colors.status.kuasai,
    stroke: '#FFFFFF',
    strokeWidth: 3,
    dashed: false,
    seal: { kind: 'check', badgeFill: '#FFFFFF', iconColor: colors.status.kuasai },
    scoreInCenter: false,
    labelColor: colors.ink,
    labelWeight: 400,
  },
  SEDANG: {
    radius: 38,
    fill: '#FDE68A',
    stroke: colors.status.sedang,
    strokeWidth: 2,
    dashed: false,
    scoreInCenter: true,
    labelColor: '#92400E',
    labelWeight: 600,
  },
  PERLU_DIULANG: {
    radius: 32,
    fill: '#FEE2E2',
    stroke: colors.status.ulang,
    strokeWidth: 2,
    dashed: false,
    seal: { kind: 'alert', badgeFill: colors.status.ulang, iconColor: '#FFFFFF' },
    scoreInCenter: false,
    labelColor: colors.status.ulang,
    labelWeight: 600,
  },
  BARU: {
    radius: 30,
    fill: '#CCFBF1',
    stroke: colors.status.baru,
    strokeWidth: 2,
    dashed: false,
    scoreInCenter: false,
    labelColor: '#0F766E',
    labelWeight: 400,
    tagLabel: 'baru',
  },
  BELUM_DIBUKA: {
    radius: 30,
    fill: '#FFFFFF',
    stroke: colors.status.belum,
    strokeWidth: 1.5,
    dashed: true,
    seal: { kind: 'lock', badgeFill: colors.status.belum, iconColor: '#FFFFFF' },
    scoreInCenter: false,
    labelColor: colors.muted,
    labelWeight: 400,
  },
  SARAN: {
    radius: 30,
    fill: '#F5F3FF',
    stroke: colors.status.saran,
    strokeWidth: 1.5,
    dashed: true,
    scoreInCenter: false,
    labelColor: '#6D28D9',
    labelWeight: 400,
  },
}

export function topicVisualOf(status: TopicStatus): TopicVisual {
  return TOPIC_VISUALS[status]
}
