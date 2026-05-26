import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Link } from '@/common/components/Link';

type Props = {
  title: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
};

export function HomeSectionHeader({ title, viewAllLabel, onViewAll }: Props) {
  const { palette, typography } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[typography.headlineMd, { color: palette.onSurface }]} numberOfLines={1}>
        {title}
      </Text>
      {onViewAll && viewAllLabel ? (
        <View style={[styles.viewAll, { gap: 2 }]}>
          <Link onPress={onViewAll}>{viewAllLabel}</Link>
          <Ionicons name="chevron-forward" size={16} color={palette.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { flexDirection: 'row', alignItems: 'center' },
});
