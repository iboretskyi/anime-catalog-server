import { Router } from 'express';
import { isAuth } from '../helper';

import { addToLibrary,
  getUser,
  followUser,
  unfollowUser,
  postReaction,
  putReaction,
  deleteReaction,
} from '../controllers/user.controller';

const router = Router();

router.put('/add-to-library', isAuth, addToLibrary);

router.get('/get-user', isAuth, getUser);

router.put('/follow-user', isAuth, followUser);
router.put('/unfollow-user', isAuth, unfollowUser);

router.post('/post-reaction', isAuth, postReaction);
router.put('/put-reaction', isAuth, putReaction);
router.delete('/delete-reaction', isAuth, deleteReaction);

export default router;
