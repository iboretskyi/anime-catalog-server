import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from 'multer';
import path from 'path';


import config from "./config";

import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import websiteRoutes from './routes/website.routes';

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, `${__dirname}\\images`),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  )
    cb(null, true);
  else cb(null, false);
};

const corsOptions = {
  origin: '*',
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

//settings
app.set("port", config.port);

// middlewares
app.use(express.json())
app.use(express.urlencoded());
// app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(cors(corsOptions));

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use(websiteRoutes);

export default app;
