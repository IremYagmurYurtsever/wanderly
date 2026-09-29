import { Router, urlencoded } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthError } from '../auth/validation.js';
import { readActionToken, type ActionService } from '../auth/actions.js';

function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}

function page(token = '', message = '', complete = false) {
  const title = complete ? 'Hazırsın.' : 'Yeni bir başlangıç';
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wanderly — ${title}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#FAF8F4;color:#183D38;font:14px/1.7 system-ui,sans-serif;min-height:100svh;display:grid;place-items:center;padding:24px}main{width:100%;max-width:400px;padding:32px 8px}header{text-align:center;margin-bottom:36px}.brand{font-size:11px;letter-spacing:4px;color:#617F6D}h1{font:normal 38px Georgia,serif;margin-bottom:12px}p{color:#69756D}.demo{background:#EDF2EA;border:1px solid #DFE7DB;border-radius:12px;padding:14px;font-size:12px}label{display:block;font-size:11px;letter-spacing:1px;margin:24px 0 8px}input{width:100%;font:inherit;border:1px solid #E8E4DC;border-radius:12px;padding:14px;background:white;color:#183D38}button{width:100%;min-height:49px;background:#617F6D;color:white;border:0;border-radius:11px;font:600 14px system-ui;margin-top:24px;cursor:pointer}input:focus,button:focus-visible{outline:2px solid #183D38;outline-offset:3px}.message{border-left:3px solid #CF8067;padding:12px;background:#FFFDF9}footer{text-align:center;margin-top:32px;color:#69756D;font-size:12px}
  </style></head><body><main><header><div class="brand">WANDERLY</div><h1>${title}</h1><p>Anıların seni bekliyor.</p></header><p class="demo">DEMO MODU · Gerçek e-posta gönderilmedi. Bu sayfa yerel sunum içindir.</p>${message ? `<p class="message" role="status">${escapeHtml(message)}</p>` : ''}${!complete && token ? `<form method="post" action="/account/reset"><input type="hidden" name="token" value="${escapeHtml(token)}">${'<label for="password">YENİ ŞİFRE</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required placeholder="En az 8 karakter"><label for="confirmation">YENİ ŞİFRE TEKRAR</label><input id="confirmation" name="confirmation" type="password" autocomplete="new-password" minlength="8" maxlength="128" required>'}<button type="submit">Şifremi yenile</button></form>` : ''}<footer>${complete ? 'Bu sayfayı kapatıp Wanderly uygulamasına dönebilirsin.' : 'Bağlantını kimseyle paylaşma.'}</footer></main></body></html>`;
}

export function createAccountRouter(actions: ActionService) {
  const router = Router();
  router.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    );
    next();
  });
  router.use(
    rateLimit({
      windowMs: 15 * 60000,
      limit: 40,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: 'Çok fazla deneme. Bir süre sonra tekrar dene.',
    }),
  );
  router.use(urlencoded({ extended: false, limit: '4kb' }));
  {
    router.get('/reset', (request, response) => {
      try {
        response.type('html').send(page(readActionToken(request.query.token)));
      } catch {
        response
          .status(400)
          .type('html')
          .send(page('', 'Bağlantı geçersiz. Uygulamadan yeni bağlantı iste.'));
      }
    });
    router.post('/reset', async (request, response, next) => {
      let token = '';
      try {
        token = readActionToken(request.body?.token);
        if (request.body.password !== request.body.confirmation)
          throw new AuthError(400, 'PASSWORD_MISMATCH', 'Şifreler aynı olmalı.');
        const result = await actions.reset(token, request.body.password);
        response.type('html').send(page('', result.message, true));
      } catch (error) {
        if (error instanceof AuthError)
          response.status(error.status).type('html').send(page(token, error.message));
        else next(error);
      }
    });
  }
  return router;
}
