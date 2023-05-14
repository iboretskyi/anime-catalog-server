import { Router } from 'express';
import { isAuth } from '../helper';

import { addToLibrary,
  getUser,
  followUser,
  unfollowUser,
  postReaction,
  putReaction,
  deleteReaction,
  putUpvote,
  putUnUpvote
} from '../controllers/user.controller';

const router = Router();

router.put('/add-to-library', isAuth, addToLibrary);

// router.get('/get-animelist', isAuth, userController.getAnimelist);

router.get('/get-user', isAuth, getUser);

router.put('/follow-user', isAuth, followUser);
router.put('/unfollow-user', isAuth, unfollowUser);

router.post('/post-reaction', isAuth, postReaction);
router.put('/put-reaction', isAuth, putReaction);
router.delete('/delete-reaction', isAuth, deleteReaction);

router.put('/upvote', isAuth, putUpvote);
router.put('/un-upvote', isAuth, putUnUpvote);

export default router;