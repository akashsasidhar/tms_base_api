import { Router } from 'express';
import { ContactTypeService } from './contactType.service';
import { success, error } from '../../utils/response.util';

const router = Router();

/**
 * @route   GET /api/contact-types
 * @desc    Get all contact types
 * @access  Public (or protected if needed)
 */
router.get('/', async (_req, res) => {
  try {
    const contactTypes = await ContactTypeService.getAllContactTypes();
    success(res, contactTypes, 'Contact types retrieved successfully');
  } catch (err) {
    error(res, 'Failed to retrieve contact types', 500, [
      err instanceof Error ? err.message : 'Unknown error',
    ]);
  }
});

export default router;
