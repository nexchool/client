import React from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { useStudentTransport } from '../hooks/useTransport';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { ProfileAvatar } from '@/common/components/ProfileAvatar';

export default function StudentTransportScreen() {
  const { t } = useTranslation('transport');
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useStudentTransport();

  const openTel = (phone: string | null | undefined) => {
    if (!phone) return;
    void Linking.openURL(`tel:${phone}`);
  };
  const openSms = (phone: string | null | undefined) => {
    if (!phone) return;
    void Linking.openURL(`sms:${phone}`);
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 3 }}
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
    >
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
      </Pressable>

      <Text style={[typography.display, { color: palette.onSurface }]}>
        {t('title', { defaultValue: 'My Transport' })}
      </Text>

      {isLoading && !data ? (
        <Skeleton width="100%" height={200} radius={radius.xl} />
      ) : !data || data.enrolled === false ? (
        <View style={[elevation.card, { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl }]}>
          <EmptyState
            icon={<Ionicons name="bus-outline" size={36} color={palette.onSurfaceVariant} />}
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
              <View style={{
                width: 48, height: 48, borderRadius: radius.md,
                backgroundColor: palette.tertiaryContainer,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="bus" size={28} color={palette.onTertiaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.labelSm, { color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>
                  {t('busNumber', { defaultValue: 'Bus number' })}
                </Text>
                <Text style={[typography.headlineLg, { color: palette.onSurface }]} numberOfLines={1}>
                  {data.bus?.registration_number ?? '—'}
                </Text>
                {data.route ? (
                  <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
                    {data.route.name}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {data.driver ? (
            <View style={[elevation.card, { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <ProfileAvatar size={48} name={data.driver.name} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.headlineMd, { color: palette.onSurface }]} numberOfLines={1}>
                    {data.driver.name}
                  </Text>
                  <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
                    {t('driver', { defaultValue: 'Driver' })}
                  </Text>
                </View>
              </View>
              {data.driver.phone ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Pressable
                    onPress={() => openTel(data.driver?.phone)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, backgroundColor: palette.surfaceContainerLow, borderRadius: radius.lg }}
                  >
                    <Ionicons name="call-outline" size={18} color={palette.primary} />
                    <Text style={[typography.labelMd, { color: palette.primary, flex: 1 }]} numberOfLines={1}>
                      {data.driver.phone}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openSms(data.driver?.phone)}
                    style={{ padding: spacing.md, backgroundColor: palette.surfaceContainerLow, borderRadius: radius.lg }}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={palette.primary} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StopCard label={t('pickup', { defaultValue: 'Pickup' })} stop={data.pickup_stop} palette={palette} spacing={spacing} radius={radius} typography={typography} elevation={elevation} />
            <StopCard label={t('drop', { defaultValue: 'Drop' })} stop={data.drop_stop} palette={palette} spacing={spacing} radius={radius} typography={typography} elevation={elevation} />
          </View>

          {data.stops.length > 0 ? (
            <View style={{ gap: spacing.md }}>
              <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
                {t('route', { defaultValue: 'Route' })}
              </Text>
              <View style={[elevation.card, { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm }]}>
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
                      <View style={{
                        width: 12, height: 12, borderRadius: 6,
                        backgroundColor: isUserStop ? palette.primary : palette.outlineVariant,
                      }} />
                      <Text style={[typography.bodyMd, { color: palette.onSurface, flex: 1 }]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
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
              <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
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
                  <Text style={[typography.labelSm, { color: palette.warning, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Inter_600SemiBold' }]}>
                    {ex.type}
                  </Text>
                  <Text style={[typography.bodyMd, { color: palette.onSurface, marginTop: 4 }]}>
                    {ex.description}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function StopCard({ label, stop, palette, spacing, radius, typography, elevation }: {
  label: string;
  stop: any;
  palette: any; spacing: any; radius: any; typography: any; elevation: any;
}) {
  if (!stop) {
    return (
      <View style={[elevation.card, { flex: 1, backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md }]}>
        <Text style={[typography.labelSm, { color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>{label}</Text>
        <Text style={[typography.bodyMd, { color: palette.outline, marginTop: 4 }]}>—</Text>
      </View>
    );
  }
  return (
    <View style={[elevation.card, { flex: 1, backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md }]}>
      <Text style={[typography.labelSm, { color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>{label}</Text>
      <Text style={[typography.headlineMd, { color: palette.onSurface, marginTop: 4 }]} numberOfLines={1}>
        {stop.eta ?? stop.scheduled_time ?? '—'}
      </Text>
      <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant, marginTop: 2 }]} numberOfLines={2}>
        {stop.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({});
