import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, withAlpha } from '@/common/theme';
import type { Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import {
  subscriptionAlertLevel,
  daysFromNow,
  type AlertLevel,
} from '@/modules/subscription/lib/subscriptionAlert';
import type { SubscriptionState } from '@/modules/subscription/services/subscriptionService';

const TONE: Record<
  AlertLevel,
  { accent: keyof Palette; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  none: { accent: 'success', icon: 'checkmark-circle' },
  due_soon: { accent: 'warning', icon: 'time' },
  overdue: { accent: 'warning', icon: 'alert-circle' },
  blocked: { accent: 'error', icon: 'alert-circle' },
};

function fmtDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type Headline = {
  /** The number a reader should see first. Null when there is no count. */
  figure: string | null;
  unit: string;
  lead: string;
  detail: string;
};

function headline(
  state: SubscriptionState,
  level: AlertLevel,
  t: (key: string, opts?: Record<string, unknown>) => string,
): Headline {
  const { subscription, term } = state;

  if (subscription.status === 'trial') {
    const left = subscription.trial_ends_at ? daysFromNow(subscription.trial_ends_at) : null;
    if (left != null && left > 0) {
      return {
        figure: String(left),
        unit: t(left === 1 ? 'unitDay' : 'unitDays'),
        lead: t('leadTrial'),
        detail: t('detailTrial', { date: fmtDay(subscription.trial_ends_at) }),
      };
    }
    return { figure: null, unit: '', lead: t('leadTrialEnded'), detail: subscription.message || t('detailTrialEnded') };
  }

  if (level === 'blocked') {
    const overdueBy = term?.due_on ? -(daysFromNow(term.due_on) ?? 0) : null;
    return {
      figure: overdueBy != null && overdueBy > 0 ? String(overdueBy) : null,
      unit: t(overdueBy === 1 ? 'unitDay' : 'unitDays'),
      lead: overdueBy != null && overdueBy > 0 ? t('leadOverdue') : t('leadSuspended'),
      detail: subscription.message || t('detailBlocked'),
    };
  }

  if (level === 'overdue' && term) {
    const left = term.days_left_in_grace;
    return {
      figure: left != null ? String(Math.max(left, 0)) : null,
      unit: t(left === 1 ? 'unitDay' : 'unitDays'),
      lead: t('leadGrace'),
      detail: t('detailGrace', { due: fmtDay(term.due_on), graceEnds: fmtDay(term.grace_ends_on) }),
    };
  }

  if (term && term.standing === 'current' && term.days_until_due != null) {
    const days = term.days_until_due;
    return {
      figure: String(days),
      unit: t(days === 1 ? 'unitDay' : 'unitDays'),
      lead: days === 0 ? t('leadDueToday') : t('leadDue'),
      detail:
        level === 'due_soon'
          ? t('detailDueSoon', { date: fmtDay(term.due_on) })
          : t('detailDue', { date: fmtDay(term.due_on) }),
    };
  }

  return { figure: null, unit: '', lead: t('leadActive'), detail: t('detailActive') };
}

const STATUS_LABEL_KEY: Record<AlertLevel, string> = {
  none: 'statusUpToDate',
  due_soon: 'statusDueSoon',
  overdue: 'statusOverdue',
  blocked: 'statusActionRequired',
};

/**
 * Where this school's subscription stands, as the first thing on the screen.
 *
 * Mirrors admin-web's `SubscriptionStatusHero` in content (same status
 * levels, same headline logic — `subscriptionAlertLevel` is a direct port),
 * not in markup: a chip + big figure here, a `DetailCard` for the three
 * dates, no progress bar (the web version's is a nice-to-have this screen
 * skips, not a requirement of the mobile ask).
 */
export function SubscriptionStatusHero({
  state,
  t,
}: {
  state: SubscriptionState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { palette, spacing, radius, iconSize } = useTheme();
  const level = subscriptionAlertLevel(state);
  const tone = TONE[level];
  const { figure, unit, lead, detail } = headline(state, level, t);
  const term = state.term;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing[4],
          borderRadius: radius.full,
          backgroundColor: withAlpha(palette[tone.accent], 0.15),
          marginBottom: spacing.md,
        }}
      >
        <Ionicons name={tone.icon} size={iconSize.sm} color={palette[tone.accent]} />
        <Text variant="labelSm" style={{ color: palette[tone.accent] }}>
          {t(STATUS_LABEL_KEY[level])}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.xs }}>
        {figure ? (
          <>
            <Text variant="display" style={{ color: palette[tone.accent] }}>
              {figure}
            </Text>
            <Text variant="titleSm" style={{ color: palette[tone.accent] }}>
              {unit}
            </Text>
            <Text variant="bodyMd" color="onSurfaceVariant">
              {lead}
            </Text>
          </>
        ) : (
          <Text variant="headlineLg" style={{ color: palette[tone.accent] }}>
            {lead}
          </Text>
        )}
      </View>

      <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
        {detail}
      </Text>

      {term && term.standing !== 'no_term' ? (
        <View style={{ marginTop: spacing.lg }}>
          <DetailCard title={t('termCardTitle')} accent={tone.accent}>
            <DetailRow icon="play-outline" label={t('started')} value={fmtDay(term.starts_on)} />
            <DetailRow icon="calendar-outline" label={t('paymentDue')} value={fmtDay(term.due_on)} />
            <DetailRow icon="hourglass-outline" label={t('graceUntil')} value={fmtDay(term.grace_ends_on)} />
          </DetailCard>
        </View>
      ) : null}
    </View>
  );
}
