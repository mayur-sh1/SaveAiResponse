import express from 'express';
import { convertToPdf } from '../controllers/document.controller.js';

const router = express.Router();

router.post('/convert', convertToPdf);

export default router;