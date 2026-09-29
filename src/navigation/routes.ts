import type { Screen } from '../types';

export const tabRoutes = {
  'Ana Sayfa': 'home',
  Gezilerim: 'trips',
  Keşfet: 'explore',
  Günlüğüm: 'journal',
  Profil: 'profile',
} as const satisfies Record<string, Screen>;
export type HomeTab = keyof typeof tabRoutes;
export const tabNames: HomeTab[] = ['Ana Sayfa', 'Gezilerim', 'Keşfet', 'Günlüğüm', 'Profil'];

export function previousScreen(screen: Screen): Screen | null {
  if (screen === 'welcome' || screen === 'home') return null;
  if (screen === 'signup' || screen === 'forgot-password') return 'signin';
  if (screen === 'signin') return 'welcome';
  return 'home';
}

export function createTabHandler(
  active: HomeTab,
  go: (screen: Screen) => void,
  onReselect: () => void,
) {
  return (tab: HomeTab) => {
    if (tab === active) onReselect();
    else go(tabRoutes[tab]);
  };
}
