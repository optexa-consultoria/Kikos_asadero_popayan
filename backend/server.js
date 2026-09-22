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

// Encabezados de seguridad (mantener iguales a los de frontend/vercel.json)
const SUPABASE = 'dmqmpkrfpetdvkkwgduk.supabase.co';
const ENCABEZADOS_SEGURIDAD = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https://${SUPABASE}`,
    "font-src 'self'",
    `connect-src 'self' https://${SUPABASE} wss://${SUPABASE}`,
    'frame-src https://www.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

// Middlewares
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set(ENCABEZADOS_SEGURIDAD);
  next();
});
app.use(cors()); // Habilita CORS
app.use(express.json()); // Parseo de bodies en formato JSON

// Servir archivos estáticos desde la carpeta frontend (con URLs limpias: /admin → admin.html)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath, { extensions: ['html'] }));

// --- RUTAS AMIGABLES → vistas del router SPA (hash) ---
// El sitio público es una sola página (index.html) con rutas #/menu, #/nosotros, #/ubicacion
app.get('/menu', (req, res) => res.redirect(301, '/#/menu'));
app.get('/nosotros', (req, res) => res.redirect(301, '/#/nosotros'));
app.get('/ubicacion', (req, res) => res.redirect(301, '/#/ubicacion'));
app.get('/login', (req, res) => res.redirect(301, '/admin'));

// Cualquier otra ruta: página principal con estado 404
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(frontendPath, 'index.html'));
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Asadero Kikos corriendo en http://localhost:${PORT}`);
});
