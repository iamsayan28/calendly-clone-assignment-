import { Router } from 'express';
import {
  getSlots,
  createBooking,
  getReschedule,
  rescheduleBooking,
} from '../controllers/bookingController';

const router = Router();

// Public booking routes
router.get('/:slug/slots',       getSlots);
router.post('/:slug',            createBooking);

// Reschedule routes
router.get('/reschedule/:id',    getReschedule);
router.put('/reschedule/:id',    rescheduleBooking);

export default router;
