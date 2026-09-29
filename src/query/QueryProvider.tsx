import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
  );

  useEffect(() => {
    const subscription =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (status) => {
            focusManager.setFocused(status === 'active');
          });
    return () => {
      subscription?.remove();
      focusManager.setFocused(undefined);
      client.clear();
    };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
