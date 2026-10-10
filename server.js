import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Healthcheck route for Cloud Run
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Serve Vite build artifacts
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Client-side SPA routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
