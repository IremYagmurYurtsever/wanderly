import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { authController } from './runtime';

export type { Session } from './controller';

export function useAuthentication() {
  const controller = authController;
  const [state, setState] = useState(controller.getState);
  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    void controller.initialize();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void controller.revalidate();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void controller.revalidate();
    }, 60000);
    return () => {
      unsubscribe();
      subscription.remove();
      clearInterval(interval);
    };
  }, [controller]);
  return { ...controller, ...state };
}
