export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  const port = Number(environment.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT, 1 ile 65535 arasında bir tam sayı olmalı.');
  }
  return {
    port,
    host: environment.HOST || '0.0.0.0',
    webOrigins: (environment.WEB_ORIGINS ?? 'http://localhost:8081,http://127.0.0.1:8081')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
