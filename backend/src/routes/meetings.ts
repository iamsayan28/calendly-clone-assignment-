import { Router } from 'express';
import { getMeetings, cancelMeeting } from '../controllers/meetingsController';

const router = Router();

router.get('/',       getMeetings);
router.delete('/:id', cancelMeeting);

export default router;
