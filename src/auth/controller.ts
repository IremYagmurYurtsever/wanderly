import { ApiError, type ApiClient } from '../services/api/client';
import { authErrorMessage, validEmail, validateCredentials } from './validation';

export type Session = { uid: string; email: string; name: string };
type State = {
  session: Session | null;
  ready: boolean;
  busy: boolean;
  error: string;
  message: string;
  restoreFailed: boolean;
};
type TokenStore = {
  get: () => Promise<string | null>;
  set: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

function readUser(data: Record<string, unknown>): Session {
  const user = data.user as Record<string, unknown> | undefined;
  if (
    !user ||
    typeof user.id !== 'string' ||
    !user.id ||
    typeof user.email !== 'string' ||
    typeof user.name !== 'string'
  )
    throw new ApiError('INVALID_RESPONSE');
  return { uid: user.id, email: user.email, name: user.name };
}

export function createAuthController(
  api: ApiClient,
  store: TokenStore,
  setUserScope: (id: string | null) => void,
) {
  let state: State = {
    session: null,
    ready: false,
    busy: false,
    error: '',
    message: '',
    restoreFailed: false,
  };
  let token: string | null = null;
  const listeners = new Set<(state: State) => void>();
  let initialization: Promise<void> | undefined;
  let refreshing = false;
  function update(patch: Partial<State>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  }
  function publish(session: Session | null) {
    setUserScope(session ? `backend:${session.uid}` : null);
    update({ session });
  }
  async function forget() {
    token = null;
    publish(null);
    await store.clear();
  }
  async function authenticated(path: string, body?: unknown, method?: string) {
    if (!token) throw new ApiError('UNAUTHORIZED', 401);
    const requestToken = token;
    try {
      const result = await api.request(path, body, requestToken, method);
      if (requestToken !== token) throw new ApiError('SESSION_CHANGED');
      return result;
    } catch (error) {
      if (requestToken === token && error instanceof ApiError && error.status === 401)
        await forget();
      throw error;
    }
  }
  async function run(operation: () => Promise<void>) {
    if (state.busy) return false;
    update({ busy: true, error: '', message: '' });
    try {
      await operation();
      return true;
    } catch (error) {
      update({ error: authErrorMessage(error) });
      return false;
    } finally {
      update({ busy: false });
    }
  }
  async function restore() {
    update({ ready: false, restoreFailed: false, error: '' });
    try {
      token = await store.get();
      if (token) publish(readUser(await authenticated('/auth/me')));
      else publish(null);
    } catch (error) {
      publish(null);
      update({
        error: authErrorMessage(error),
        restoreFailed: !(error instanceof ApiError && error.status === 401),
      });
    } finally {
      update({ ready: true });
    }
  }
  return {
    request: authenticated,
    getState: () => state,
    subscribe(listener: (state: State) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    initialize() {
      return (initialization ??= restore());
    },
    retryRestore: () => run(restore),
    clearFeedback: () => update({ error: '', message: '' }),
    submit(email: string, password: string, signup: boolean, name: string, agreed: boolean) {
      const validation = validateCredentials(email, password, signup, name, agreed);
      if (validation) {
        update({ error: validation });
        return Promise.resolve(false);
      }
      return run(async () => {
        let registration: Record<string, unknown> | undefined;
        if (signup)
          registration = await api.request('/auth/register', { email, password, name, agreed });
        let result: Record<string, unknown>;
        try {
          result = await api.request('/auth/login', { email, password });
        } catch (error) {
          if (registration)
            update({
              message: 'Hesabın oluşturuldu. Oturum açılamadı; Giriş Yap ekranından yeniden dene.',
            });
          throw error;
        }
        const user = readUser(result);
        if (typeof result.token !== 'string' || !/^[a-f0-9]{64}$/.test(result.token))
          throw new ApiError('INVALID_RESPONSE');
        try {
          await store.set(result.token);
        } catch {
          await api.request('/auth/logout', {}, result.token).catch(() => undefined);
          throw new ApiError('STORAGE_ERROR');
        }
        token = result.token;
        publish(user);
        update({
          restoreFailed: false,
          message: typeof registration?.message === 'string' ? registration.message : '',
        });
      });
    },
    resetPassword(email: string) {
      if (!validEmail(email)) {
        update({ error: 'Geçerli bir e-posta adresi gir.', message: '' });
        return Promise.resolve(false);
      }
      return run(async () => {
        const result = await api.request('/auth/password/forgot', { email });
        update({
          message: typeof result.message === 'string' ? result.message : 'İstek tamamlandı.',
        });
      });
    },
    async revalidate() {
      if (!state.ready || state.busy || !token || state.restoreFailed || refreshing) return;
      refreshing = true;
      const currentToken = token;
      try {
        const user = readUser(await authenticated('/auth/me'));
        if (token === currentToken && !state.busy) publish(user);
      } catch (error) {
        if (token === currentToken) update({ error: authErrorMessage(error) });
      } finally {
        refreshing = false;
      }
    },
    logout: () =>
      run(async () => {
        try {
          if (token) await authenticated('/auth/logout', {});
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) throw error;
        }
        await forget();
        update({ restoreFailed: false });
      }),
  };
}
