import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';

type Props = {
  recents: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClearAll: () => void;
};

/**
 * What the search screen shows before a character is typed.
 *
 * It used to show a grey magnifying glass and the words "Type to search" —
 * an instruction the person had already followed by opening the screen. The
 * same space now carries the searches they are most likely to want again;
 * looking up the same student twice in a morning is the ordinary case here.
 */
export function RecentSearches({ recents, onSelect, onRemove, onClearAll }: Props) {
  const { t } = useTranslation('search');
  const { palette, spacing, radius } = useTheme();

  if (recents.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
        <AppIcon name="search-outline" size="hero" color="outlineVariant" />
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.md }}>
          {t('prompt', { defaultValue: 'Search students, teachers, classes and fees' })}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        }}
      >
        <Text variant="overline" color="onSurfaceVariant">
          {t('recent.title', { defaultValue: 'Recent' })}
        </Text>
        <PressScale onPress={onClearAll} hitSlop={8}>
          <Text variant="labelSm" color="primary">
            {t('recent.clearAll', { defaultValue: 'Clear all' })}
          </Text>
        </PressScale>
      </View>

      {recents.map((term) => (
        <View key={term} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PressScale
            onPress={() => onSelect(term)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.full,
                backgroundColor: palette.surfaceContainerHigh ?? palette.surfaceContainer,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="time-outline" size="md" color="onSurfaceVariant" />
            </View>
            <Text variant="bodyMd" color="onSurface" numberOfLines={1} style={{ flex: 1 }}>
              {term}
            </Text>
          </PressScale>
          <AppIcon
            name="close"
            size="md"
            color="onSurfaceVariant"
            onPress={() => onRemove(term)}
            accessibilityLabel={t('recent.remove', {
              term,
              defaultValue: `Remove ${term} from recent searches`,
            })}
          />
        </View>
      ))}
    </View>
  );
}
