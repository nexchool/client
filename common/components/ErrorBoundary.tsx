import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Button } from '@/common/components/Button';
import { AppIcon } from '@/common/components/AppIcon';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * The app's last line of defence against one bad render.
 *
 * React unmounts the whole tree when a render throws and nothing catches it,
 * which on a phone is not an error message — it is a white screen with no
 * back, no menu and no way out but force-quitting. A parent who hits that
 * cannot tell it from the app being broken for good.
 *
 * Sits at the root because that is the only place that can catch anything;
 * screens that can fail in a known way should still handle it themselves and
 * say something useful, rather than falling back to this.
 *
 * A class is not a style choice here — `getDerivedStateFromError` and
 * `componentDidCatch` have no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No crash reporter is wired up yet, so the console is where this goes.
    // Still worth doing: without it the only record of the failure is a user
    // reporting that the app "went blank".
    console.error('Unhandled render error', error, info.componentStack);
  }

  handleReload = () => {
    // Re-mounting the tree from scratch, which is what clearing the flag does,
    // is enough for the failures this catches — a screen rendered against a
    // payload it did not expect, most often. A crash that reproduces
    // immediately leaves the user back here rather than stranded on a blank
    // screen, which is still the better of the two.
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <AppCrashScreen onReload={this.handleReload} />;
    }
    return this.props.children;
  }
}

function AppCrashScreen({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation('common');
  const { palette, spacing } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.surface, padding: spacing.xl, gap: spacing.md },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: palette.errorContainer }]}>
        <AppIcon name="alert-circle-outline" size="xl" color="error" />
      </View>
      <Text variant="headlineMd" color="onSurface" style={styles.center}>
        {t('errorBoundary.title', { defaultValue: 'Something went wrong' })}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant" style={styles.center}>
        {t('errorBoundary.body', {
          defaultValue:
            'The app ran into an unexpected problem. Reloading usually fixes it. If it keeps happening, please tell your school office.',
        })}
      </Text>
      <View style={{ marginTop: spacing.sm }}>
        <Button variant="primary" size="md" onPress={onReload}>
          {t('errorBoundary.reload', { defaultValue: 'Reload' })}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
