import { Router } from 'express';
import { body } from 'express-validator';

import { signup, login } from '../controllers/auth.controller';

const router = Router();

router.post(
  '/signup',
  [
    body('email').isEmail(),
    body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3 }),
  ],
  signup
);

router.post('/login', login);

export default router;