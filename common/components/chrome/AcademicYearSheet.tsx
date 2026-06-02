import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AcademicYearSheet({ visible, onClose }: Props) {
  const { t } = useTranslation('common');
  const { palette, spacing, radius } = useTheme();
  const { selectedAcademicYearId, setSelectedAcademicYearId, academicYears } =
    useAcademicYearContext();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(11, 28, 48, 0.40)' }]}
        onPress={onClose}
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
          },
        ]}
      >
        <View
          style={[
            styles.handle,
            { backgroundColor: palette.outlineVariant, alignSelf: 'center' },
          ]}
        />
        <Text variant="headlineMd" color="onSurface" style={{ marginTop: spacing.md }}>
          {t('academicYearPicker.title', { defaultValue: 'Academic Year' })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t('academicYearPicker.subtitle', {
            defaultValue: 'Select the year to view data for.',
          })}
        </Text>

        <ScrollView
          style={{ marginTop: spacing.lg, maxHeight: 320 }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {academicYears.map((ay) => {
            const isSelected = ay.id === selectedAcademicYearId;
            return (
              <Pressable
                key={ay.id}
                onPress={() => {
                  setSelectedAcademicYearId(ay.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isSelected
                      ? palette.primaryContainer
                      : pressed
                      ? palette.surfaceContainer
                      : 'transparent',
                    borderRadius: radius.DEFAULT,
                    paddingVertical: 12,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Text
                  variant="bodyLg"
                  color={isSelected ? 'onPrimaryContainer' : 'onSurface'}
                  style={{ flex: 1 }}
                >
                  {ay.name}
                </Text>
                {isSelected ? (
                  <AppIcon name="checkmark" size="md" color="onPrimaryContainer" />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: spacing.md }}>
          <Button variant="ghost" fullWidth onPress={onClose}>
            {t('cancel', { defaultValue: 'Cancel' })}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: { width: 36, height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
