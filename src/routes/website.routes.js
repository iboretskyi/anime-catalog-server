import { Router } from 'express';

import { 
  getHome,
  getEachAnime,
  getEachReaction,
  getOtherUser
} from '../controllers/website.controller';
import { isAuth } from '../helper';

const router = Router();

router.get('/get-home/:limit/:status', getHome);
router.get('/get-each-anime/:animeId', getEachAnime);
router.get('/get-each-reaction/:reactionId', getEachReaction);
router.get('/get-other-user/:userId', getOtherUser);

export default router;