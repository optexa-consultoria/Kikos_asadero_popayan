import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Inicializar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Habilita CORS
app.use(express.json()); // Parseo de bodies en formato JSON

// Configurar para servir archivos estáticos desde la carpeta frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// --- RUTAS DE FALLBACK PARA SPA / ESTÁTICOS ---

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Ruta de menú
app.get('/menu', (req, res) => {
  res.sendFile(path.join(frontendPath, 'menu.html'));
});

// Ruta de nosotros
app.get('/nosotros', (req, res) => {
  res.sendFile(path.join(frontendPath, 'nosotros.html'));
});

// Ruta protegida (el cliente hará la verificación de Supabase)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

// Ruta de login para el admin
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Catch-all para cualquier otra ruta (Redirige al home o 404)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(frontendPath, 'index.html'));
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Asadero Kikos corriendo en http://localhost:${PORT}`);
});
