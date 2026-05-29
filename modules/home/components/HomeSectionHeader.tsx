import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Link } from '@/common/components/Link';

type Props = {
  title: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
};

export function HomeSectionHeader({ title, viewAllLabel, onViewAll }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
        {title}
      </Text>
      {onViewAll && viewAllLabel ? (
        <View style={[styles.viewAll, { gap: 2 }]}>
          <Link onPress={onViewAll}>{viewAllLabel}</Link>
          <AppIcon name="chevron-forward" size="sm" color="primary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { flexDirection: 'row', alignItems: 'center' },
});
