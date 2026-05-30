import React from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

export interface ProfileHeroCardProps {
  /** Remote avatar URL; falls back to a colored initial circle when absent. */
  avatarUri?: string | null;
  /** Used for the initial-letter fallback. */
  name: string;
  /** Secondary line, e.g. "Teacher · Springfield High". */
  subline?: string | null;
  /** When provided, tapping the avatar invokes this (photo upload flow). */
  onPressAvatar?: () => void;
  /** Shows a spinner overlay + disables avatar press while a photo upload runs. */
  uploading?: boolean;
  /** Bottom action button. Only rendered when a real edit/nav action exists. */
  actionLabel?: string;
  onPressAction?: () => void;
}

const AVATAR = 96;

/** Hero card: avatar + name + role/school subline + optional primary action. */
export function ProfileHeroCard({
  avatarUri,
  name,
  subline,
  onPressAvatar,
  uploading,
  actionLabel,
  onPressAction,
}: ProfileHeroCardProps) {
  const { palette, spacing, radius, elevation } = useTheme();
  const initial = (name.trim() || '?').charAt(0).toUpperCase();
  const trimmedUri = avatarUri?.trim();

  const avatar = trimmedUri ? (
    <Image
      source={{ uri: trimmedUri }}
      style={styles.avatar}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View style={[styles.avatar, { backgroundColor: palette.primaryContainer }]}>
      <Text variant="display" color="onPrimaryContainer" style={styles.initial}>
        {initial}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
        },
        elevation.card,
      ]}
    >
      {onPressAvatar ? (
        <Pressable
          onPress={onPressAvatar}
          disabled={uploading}
          style={styles.avatarWrap}
        >
          {avatar}
          {uploading ? (
            <View style={[styles.avatarOverlay]}>
              <ActivityIndicator color={palette.onPrimary} />
            </View>
          ) : (
            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor: palette.primary,
                  borderColor: palette.surfaceContainerLowest,
                },
              ]}
            >
              <AppIcon name="camera" size="sm" color="onPrimary" />
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.avatarWrap}>{avatar}</View>
      )}

      <Text
        variant="headlineLg"
        color="onSurface"
        style={{ marginTop: spacing.md, textAlign: 'center' }}
        numberOfLines={1}
      >
        {name}
      </Text>

      {subline ? (
        <Text
          variant="bodyMd"
          color="onSurfaceVariant"
          style={{ marginTop: spacing.xs, textAlign: 'center' }}
          numberOfLines={1}
        >
          {subline}
        </Text>
      ) : null}

      {actionLabel && onPressAction ? (
        <Pressable
          onPress={onPressAction}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? palette.onPrimaryContainer : palette.primary,
              borderRadius: radius.full,
              paddingHorizontal: spacing.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text variant="labelMd" color="onPrimary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { lineHeight: AVATAR },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR / 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  actionButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
