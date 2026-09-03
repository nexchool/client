import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Dialog, type DialogTone } from '@/common/components/Dialog';
import { ToastHost, type ToastItem, type ToastTone } from '@/common/components/Toast';

/** How long a toast stays before it withdraws itself. */
const TOAST_MS: Record<ToastTone, number> = {
  // Long enough to read twice: a failure is the one a person actually needs.
  error: 6000,
  success: 3000,
  info: 4000,
};

type ConfirmOptions = {
  title: string;
  description?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Hide the cancel action — an acknowledgement rather than a choice. */
  acknowledgeOnly?: boolean;
};

type ToastOptions = { action?: { label: string; onPress: () => void } };

type FeedbackApi = {
  /**
   * Ask a yes/no question. Resolves true when the affirmative was chosen and
   * false for cancel, the backdrop or the back button — so the caller reads as
   * `if (await confirm(...))` and the safe answer is the default.
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** A dialog with a single acknowledgement, for the rare notice that must be read. */
  notify: (options: Omit<ConfirmOptions, 'cancelLabel'>) => Promise<void>;
  toast: {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
  };
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

type PendingDialog = ConfirmOptions & { resolve: (value: boolean) => void };

/**
 * One place that owns the app's dialogs and toasts, so a screen asks a
 * question in a line rather than keeping a piece of modal state.
 *
 * `Alert.alert` is a callback API from before promises, and 121 call sites had
 * grown around it. `await confirm({...})` is a drop-in for the ones that ask
 * something; `toast.error(...)` for the far larger number that only announce.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<PendingDialog | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (tone: ToastTone, message: string, options?: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => {
        // Three is the point past which they stop being a report and start
        // being a wall; the oldest gives way.
        const next = [...current, { id, message, tone, action: options?.action }];
        return next.slice(-3);
      });
      timers.current[id] = setTimeout(() => dismissToast(id), TOAST_MS[tone]);
    },
    [dismissToast]
  );

  const settle = useCallback((value: boolean) => {
    setDialog((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const api = useMemo<FeedbackApi>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
      notify: (options) =>
        new Promise<void>((resolve) =>
          setDialog({ ...options, acknowledgeOnly: true, resolve: () => resolve() })
        ),
      toast: {
        success: (message, options) => pushToast('success', message, options),
        error: (message, options) => pushToast('error', message, options),
        info: (message, options) => pushToast('info', message, options),
      },
    }),
    [pushToast]
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <ToastHost items={toasts} onDismiss={dismissToast} />
      <Dialog
        visible={dialog !== null}
        onClose={() => settle(false)}
        title={dialog?.title ?? ''}
        description={dialog?.description}
        tone={dialog?.tone ?? 'default'}
        actions={
          dialog
            ? [
                ...(dialog.acknowledgeOnly
                  ? []
                  : [
                      {
                        label: dialog.cancelLabel ?? 'Cancel',
                        onPress: () => settle(false),
                      },
                    ]),
                {
                  label: dialog.confirmLabel ?? (dialog.acknowledgeOnly ? 'OK' : 'Confirm'),
                  onPress: () => settle(true),
                },
              ]
            : undefined
        }
      />
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}

/** `const { confirm, notify } = useDialog();` */
export function useDialog() {
  const { confirm, notify } = useFeedback();
  return { confirm, notify };
}

/** `const toast = useToast(); toast.error('Could not connect');` */
export function useToast() {
  return useFeedback().toast;
}
