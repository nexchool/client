import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { useStudentTransport } from '../hooks/useTransport';
import type { RouteStop } from '../types';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { ProfileAvatar } from '@/common/components/ProfileAvatar';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { callPhone, messagePhone } from '@/common/utils/phone';

export default function StudentTransportScreen() {
  const { t } = useTranslation('transport');
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useStudentTransport();

  const openTel = (phone: string | null | undefined) => {
    void callPhone(phone);
  };
  const openSms = (phone: string | null | undefined) => {
    void messagePhone(phone);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 3 }}
        refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      >
        <AppIcon name="chevron-back" size="lg" color="onSurface" onPress={() => router.back()} />

        <Text variant="display" color="onSurface">
          {t('title', { defaultValue: 'My Transport' })}
        </Text>

        {isLoading && !data ? (
          <Skeleton width="100%" height={200} radius={radius.xl} />
        ) : !data || data.enrolled === false ? (
          <View style={[elevation.card, { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl }]}>
            <EmptyState
              icon={<AppIcon name="bus-outline" size="xl" color="onSurfaceVariant" />}
              title={t('notEnrolled.title', { defaultValue: "You're not assigned to transport" })}
              description={t('notEnrolled.body', {
                defaultValue: "Contact your school's transport office to enroll.",
              })}
            />
          </View>
        ) : (
          <>
            <View
              style={[
                elevation.card,
                {
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  borderLeftWidth: 4,
                  borderLeftColor: palette.tertiary,
                  gap: spacing.md,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: palette.tertiaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="bus" size="lg" color="onTertiaryContainer" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="overline" color="onSurfaceVariant">
                    {t('busNumber', { defaultValue: 'Bus number' })}
                  </Text>
                  <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
                    {data.bus?.registration_number ?? '—'}
                  </Text>
                  {data.route ? (
                    <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
                      {data.route.name}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {data.driver ? (
              <View
                style={[
                  elevation.card,
                  { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <ProfileAvatar size={48} name={data.driver.name} />
                  <View style={{ flex: 1 }}>
                    <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
                      {data.driver.name}
                    </Text>
                    <Text variant="labelSm" color="onSurfaceVariant">
                      {t('driver', { defaultValue: 'Driver' })}
                    </Text>
                  </View>
                </View>
                {data.driver.phone ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <PressScale
                      onPress={() => openTel(data.driver?.phone)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.md,
                        backgroundColor: palette.surfaceContainerLow,
                        borderRadius: radius.lg,
                      }}
                    >
                      <AppIcon name="call-outline" size="sm" color="primary" />
                      <Text variant="labelMd" color="primary" numberOfLines={1} style={{ flex: 1 }}>
                        {data.driver.phone}
                      </Text>
                    </PressScale>
                    <PressScale
                      onPress={() => openSms(data.driver?.phone)}
                      style={{ padding: spacing.md, backgroundColor: palette.surfaceContainerLow, borderRadius: radius.lg }}
                    >
                      <AppIcon name="chatbubble-outline" size="sm" color="primary" />
                    </PressScale>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StopCard label={t('pickup', { defaultValue: 'Pickup' })} stop={data.pickup_stop} />
              <StopCard label={t('drop', { defaultValue: 'Drop' })} stop={data.drop_stop} />
            </View>

            {data.stops.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <Text variant="headlineMd" color="onSurface">
                  {t('route', { defaultValue: 'Route' })}
                </Text>
                <View
                  style={[
                    elevation.card,
                    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
                  ]}
                >
                  {data.stops.map((s) => {
                    const isUserStop = s.id === data.pickup_stop?.id;
                    return (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          padding: spacing.sm,
                          borderLeftWidth: isUserStop ? 3 : 0,
                          borderLeftColor: palette.primary,
                          paddingLeft: isUserStop ? spacing.md : spacing.sm,
                          opacity: s.is_passed_today ? 0.6 : 1,
                        }}
                      >
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: isUserStop ? palette.primary : palette.outlineVariant,
                          }}
                        />
                        <Text variant="bodyMd" color="onSurface" numberOfLines={1} style={{ flex: 1 }}>
                          {s.name}
                        </Text>
                        <Text variant="labelSm" color="onSurfaceVariant">
                          {s.scheduled_time ?? '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {data.exceptions.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <Text variant="headlineMd" color="onSurface">
                  {t('exceptions', { defaultValue: "Today's exceptions" })}
                </Text>
                {data.exceptions.map((ex, idx) => (
                  <View
                    key={idx}
                    style={[
                      elevation.card,
                      {
                        backgroundColor: palette.surfaceContainerLowest,
                        borderRadius: radius.lg,
                        padding: spacing.md,
                        borderLeftWidth: 4,
                        borderLeftColor: palette.warning,
                      },
                    ]}
                  >
                    <Text variant="overline" color="warning">
                      {ex.type}
                    </Text>
                    <Text variant="bodyMd" color="onSurface" style={{ marginTop: spacing.xs }}>
                      {ex.description}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StopCard({ label, stop }: { label: string; stop: RouteStop | null }) {
  const { palette, spacing, radius, elevation } = useTheme();
  if (!stop) {
    return (
      <View style={[elevation.card, { flex: 1, backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md }]}>
        <Text variant="overline" color="onSurfaceVariant">
          {label}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          —
        </Text>
      </View>
    );
  }
  return (
    <View style={[elevation.card, { flex: 1, backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md }]}>
      <Text variant="overline" color="onSurfaceVariant">
        {label}
      </Text>
      <Text variant="headlineMd" color="onSurface" numberOfLines={1} style={{ marginTop: spacing.xs }}>
        {stop.eta ?? stop.scheduled_time ?? '—'}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2} style={{ marginTop: 2 }}>
        {stop.name}
      </Text>
    </View>
  );
}
