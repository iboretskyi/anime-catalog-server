import { Router } from 'express';
import { body } from 'express-validator';

import { isAdmin, postAnime, putAnime } from '../controllers/admin.controller';
const { isAuth } = require('../helper');

const router = Router();

router.post(
  '/post-anime',
  isAuth,
  isAdmin,
  [
    body('title').trim().isLength({ min: 3 }),
    body('description').trim().isLength({ min: 5 }),
  ],
  postAnime
);
router.put(
  '/put-anime',
  isAuth,
  isAdmin,
  [
    body('title')
      .trim()
      .custom((value) => {
        if (value.length > 0 && value.length < 3)
          throw new Error('new title too short');
        return true;
      }),
    body('description')
      .trim()
      .custom((value) => {
        if (value.length > 0 && value.length < 5)
          throw new Error('new description too short');
        return true;
      }),
  ],
  putAnime
);

module.exports = router;