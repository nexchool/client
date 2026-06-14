import React, { useEffect, useRef } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

const ITEM_H = 40;
const VISIBLE = 3; // odd count so one row sits centered

type WheelProps = {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  /** Render a value as 2-digit text. */
  format?: (v: number) => string;
};

function Wheel({ values, selected, onSelect, format = (v) => `${v}`.padStart(2, '0') }: WheelProps) {
  const { palette } = useTheme();
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(selected));

  // contentOffset only seeds the initial scroll; when the value changes after
  // mount (the sheet stays mounted across opens) re-sync so the centered row
  // matches the selected value and settle() can't commit a stale number.
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM_H, animated: false });
  }, [index]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(
      values.length - 1,
      Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_H))
    );
    onSelect(values[i]);
  };

  return (
    <View style={{ height: ITEM_H * VISIBLE, flex: 1 }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * ITEM_H }}
        onMomentumScrollEnd={settle}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
      >
        {values.map((v) => (
          <View key={v} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="titleSm" color={v === selected ? 'onSurface' : 'onSurfaceVariant'}>
              {format(v)}
            </Text>
          </View>
        ))}
      </ScrollView>
      {/* Center highlight band */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_H * Math.floor(VISIBLE / 2),
          left: 4,
          right: 4,
          height: ITEM_H,
          borderRadius: 8,
          backgroundColor: palette.primaryContainer,
          opacity: 0.35,
        }}
      />
    </View>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export type TimeRowProps = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
};

/** Themed hour/minute selector used by DatePicker's datetime mode. */
export function TimeRow({ hour, minute, onChange }: TimeRowProps) {
  const { palette, spacing, radius } = useTheme();
  // Snap stored minutes (e.g. 17 from an existing value) onto the 5-min wheel.
  const snappedMinute = MINUTES.reduce(
    (best, v) => (Math.abs(v - minute) < Math.abs(best - minute) ? v : best),
    MINUTES[0]
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        borderRadius: radius.lg,
        backgroundColor: palette.surfaceContainerHigh,
        paddingHorizontal: spacing.lg,
      }}
    >
      <Wheel values={HOURS} selected={hour} onSelect={(h) => onChange(h, snappedMinute)} />
      <Text variant="titleSm" color="onSurfaceVariant">
        :
      </Text>
      <Wheel values={MINUTES} selected={snappedMinute} onSelect={(m) => onChange(hour, m)} />
    </View>
  );
}
