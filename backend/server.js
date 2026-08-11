import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import documentRoutes from './routes/documents.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  process.env.CLIENT_URL,  // your deployed frontend URL, set on Render later
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
}));

app.use(express.json({ limit: '2mb' }));

app.use('/api/documents', documentRoutes);

app.get('/', (req, res) => res.send('MD-to-PDF service running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));