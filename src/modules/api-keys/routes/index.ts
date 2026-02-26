import { Router } from 'express';
import { apiKeyController } from '../controllers/ApiKeyController';
import { authenticationToken as auth } from '@core/middlewares/authenticationToken';

const router = Router();

// Only authenticated users (Directors/Admins) should manage API Keys
router.use(auth);

router.post('/companies', (req, res) =>
  apiKeyController.createCompany(req, res),
);
router.post('/', (req, res) => apiKeyController.createKey(req, res));
router.get('/', (req, res) => apiKeyController.listKeys(req, res));
router.post('/:id/revoke', (req, res) => apiKeyController.revokeKey(req, res));

export default router;
