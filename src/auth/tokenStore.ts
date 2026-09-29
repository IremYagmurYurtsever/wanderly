let token: string | null = null;
export const tokenStore = {
  async get() {
    return token;
  },
  async set(value: string) {
    token = value;
  },
  async clear() {
    token = null;
  },
};
