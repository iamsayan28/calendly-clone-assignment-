import { Router } from 'express';
import {
  getAvailability,
  setAvailability,
} from '../controllers/availabilityController';

const router = Router();

router.get('/:event_type_id', getAvailability);
router.post('/',              setAvailability);

export default router;
