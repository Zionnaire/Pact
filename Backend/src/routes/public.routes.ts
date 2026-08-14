import { Router } from 'express';
import { smsStatusWebhook } from '../controllers/public.controller';
import { privacyPolicy, termsOfService, accountDeletionInfo } from '../controllers/legal.controller';

// The Paystack webhook route is registered separately in app.ts, ahead of
// the global JSON body parser, because HMAC verification needs the raw
// request bytes. Everything else that's genuinely public lives here.
const router = Router();

router.post('/sms/status', smsStatusWebhook);

router.get('/legal/privacy', privacyPolicy);
router.get('/legal/terms', termsOfService);
router.get('/legal/account-deletion', accountDeletionInfo);

export default router;
