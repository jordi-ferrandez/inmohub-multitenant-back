import { Router } from 'express';
import { apiKeyController } from '../controllers/ApiKeyController';
import { authenticationToken as auth } from '@core/middlewares/authenticationToken';
import {
  validateCreateCompany,
  validateCreateApiKey,
  validateRevokeKeyParam,
} from '../validators';

const router = Router();

router.use(auth);

router.post('/companies', validateCreateCompany, (req, res) =>
  apiKeyController.createCompany(req, res),
);
router.post('/', validateCreateApiKey, (req, res) => apiKeyController.createKey(req, res));
router.get('/', (req, res) => apiKeyController.listKeys(req, res));
router.post('/:id/revoke', validateRevokeKeyParam, (req, res) => apiKeyController.revokeKey(req, res));

export default router;
