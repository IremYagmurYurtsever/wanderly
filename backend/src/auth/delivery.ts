export type ActionMessage = {
  email: string;
  kind: 'RESET_PASSWORD';
  link: string;
};
export type ActionDelivery = { send: (message: ActionMessage) => Promise<void> };

export function readDeliveryConfig(environment: NodeJS.ProcessEnv = process.env) {
  const mode = environment.MAIL_MODE ?? 'disabled';
  if (!['disabled', 'demo'].includes(mode))
    throw new Error('MAIL_MODE yalnızca demo veya disabled olabilir.');
  if (mode === 'demo' && environment.NODE_ENV === 'production') {
    throw new Error('Demo e-posta modu production ortamında kullanılamaz.');
  }
  const url = new URL(environment.PUBLIC_BASE_URL ?? 'http://localhost:3000');
  const local =
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    /^10\.\d+\.\d+\.\d+$/.test(url.hostname) ||
    /^192\.168\.\d+\.\d+$/.test(url.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(url.hostname);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('PUBLIC_BASE_URL yalnızca sunucunun kök HTTP(S) adresi olmalı.');
  }
  if (mode === 'demo' && !local)
    throw new Error('Demo bağlantıları yalnızca yerel geliştirme adresini kullanabilir.');
  return { mode, baseUrl: url.origin };
}

export function createDemoDelivery(write: (text: string) => void = console.log): ActionDelivery {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Production ortamında demo gönderimi kapalı.');
  return {
    async send(message) {
      write(
        `[WANDERLY DEMO — E-POSTA GÖNDERİLMEDİ]\nŞifre sıfırlama\nHesap: ${JSON.stringify(message.email)}\n${message.link}\nBu bağlantıyı paylaşma; yalnızca yerel sunum için kullan.`,
      );
    },
  };
}
