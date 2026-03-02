import { Router } from 'express';
import { authApiKey, requireScope } from '../middlewares/authApiKey';
import { publicApiRateLimiter } from '../middlewares/rateLimiter';
import { publicPropertyController } from '../controllers/PublicPropertyController';
import { publicPersonController } from '../controllers/PublicPersonController';
import { publicReminderController } from '../controllers/PublicReminderController';
import { publicFollowUpController } from '../controllers/PublicFollowUpController';

const router = Router();

// Apply global public API middlewares
router.use(authApiKey);
router.use(publicApiRateLimiter);

/**
 * Properties Endpoints
 */
router.get('/properties', requireScope('read:properties'), (req, res) => publicPropertyController.getAll(req, res));
router.get('/properties/:id', requireScope('read:properties'), (req, res) => publicPropertyController.getById(req, res));
router.post('/properties', requireScope('write:properties'), (req, res) => publicPropertyController.create(req, res));
router.patch('/properties/:id', requireScope('write:properties'), (req, res) => publicPropertyController.update(req, res));
router.delete('/properties/:id', requireScope('write:properties'), (req, res) => publicPropertyController.delete(req, res));

/**
 * Contacts Endpoints
 */
router.get('/contacts', requireScope('read:contacts'), (req, res) => publicPersonController.getAll(req, res));
router.get('/contacts/:id', requireScope('read:contacts'), (req, res) => publicPersonController.getById(req, res));
router.post('/contacts', requireScope('write:contacts'), (req, res) => publicPersonController.create(req, res));
router.patch('/contacts/:id', requireScope('write:contacts'), (req, res) => publicPersonController.update(req, res));
router.delete('/contacts/:id', requireScope('write:contacts'), (req, res) => publicPersonController.delete(req, res));

/**
 * Tasks Endpoints
 */
router.get('/tasks', requireScope('read:tasks'), (req, res) => publicReminderController.getAll(req, res));
router.get('/tasks/:id', requireScope('read:tasks'), (req, res) => publicReminderController.getById(req, res));

/**
 * Follow-up Endpoints
 */
router.get('/followups', requireScope('read:followups'), (req, res) => publicFollowUpController.getAll(req, res));
router.get('/followups/:id', requireScope('read:followups'), (req, res) => publicFollowUpController.getById(req, res));

// Add more entity routes here...
// router.get('/contacts', requireScope('read:contacts'), ...)

export default router;