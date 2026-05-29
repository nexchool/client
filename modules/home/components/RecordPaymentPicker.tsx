import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Input } from '@/common/components/Input';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { useStudentFees } from '@/modules/finance/hooks/useFinance';
import type { StudentFee } from '@/modules/finance/types';
import { formatCurrency } from '@/common/utils/formatCurrency';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function initials(name?: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '—';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase() || '—';
}

export function RecordPaymentPicker({ visible, onClose }: Props) {
  const { t } = useTranslation('home');
  const { palette, spacing, radius } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: unpaidFees = [], isLoading: loadingUnpaid } = useStudentFees({
    status: 'unpaid',
    search: searchQuery,
    include_items: false,
  });
  const { data: partialFees = [], isLoading: loadingPartial } = useStudentFees({
    status: 'partial',
    search: searchQuery,
    include_items: false,
  });
  const { data: overdueFees = [], isLoading: loadingOverdue } = useStudentFees({
    status: 'overdue',
    search: searchQuery,
    include_items: false,
  });

  const isLoading = loadingUnpaid || loadingPartial || loadingOverdue;

  // Combine and dedupe (overdue can overlap with unpaid in some schemas).
  const combined: StudentFee[] = React.useMemo(() => {
    const map = new Map<string, StudentFee>();
    for (const f of [...overdueFees, ...partialFees, ...unpaidFees]) {
      const outstanding = (f.total_amount ?? 0) - (f.paid_amount ?? 0);
      if (outstanding <= 0) continue;
      if (!map.has(f.id)) map.set(f.id, f);
    }
    return Array.from(map.values());
  }, [unpaidFees, partialFees, overdueFees]);

  const sheetMaxHeight = Dimensions.get('window').height * 0.85;

  const handleSelect = (fee: StudentFee) => {
    onClose();
    router.push({
      pathname: '/(protected)/finance/student-fees/[id]',
      params: { id: fee.id, action: 'record' },
    });
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderItem = ({ item }: { item: StudentFee }) => {
    const outstanding = (item.total_amount ?? 0) - (item.paid_amount ?? 0);
    return (
      <Pressable
        onPress={() => handleSelect(item)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: pressed
            ? palette.surfaceContainerLow
            : 'transparent',
        })}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: palette.primaryContainer },
          ]}
        >
          <Text variant="labelMd" color="onPrimaryContainer">
            {initials(item.student_name)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelMd" color="onSurface" numberOfLines={1}>
            {item.student_name ?? '—'}
          </Text>
          <Text
            variant="labelSm"
            color="onSurfaceVariant"
            style={{ marginTop: 2 }}
            numberOfLines={1}
          >
            {t('recordPayment.due', {
              defaultValue: '{{amount}} due',
              amount: formatCurrency(outstanding),
            })}
          </Text>
        </View>
        <AppIcon name="chevron-forward" size="sm" color="onSurfaceVariant" />
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
        onPress={handleClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
            maxHeight: sheetMaxHeight,
          },
        ]}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.outlineVariant,
            marginBottom: spacing.md,
          }}
        />
        <Text
          variant="headlineMd"
          color="onSurface"
          style={{ marginBottom: spacing.md }}
        >
          {t('recordPayment.title', { defaultValue: 'Record payment' })}
        </Text>

        <Input
          label=""
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('recordPayment.searchPlaceholder', {
            defaultValue: 'Search students',
          })}
        />

        <View style={{ marginTop: spacing.md, flex: 1 }}>
          {isLoading && combined.length === 0 ? (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="100%" height={56} radius={radius.md} />
              ))}
            </View>
          ) : combined.length === 0 ? (
            <EmptyState
              icon={<AppIcon name="cash-outline" size="xl" color="onSurfaceVariant" />}
              title={t('recordPayment.empty', {
                defaultValue: 'No outstanding fees',
              })}
            />
          ) : (
            <FlatList
              data={combined}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: palette.outlineVariant,
                    opacity: 0.5,
                  }}
                />
              )}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
