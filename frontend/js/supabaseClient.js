// TODO: Reemplazar con credenciales reales de Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

// Inicializar cliente de Supabase (disponible globalmente si se importa antes que otros scripts)
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Constante para el número de WhatsApp (Ej: 573001234567)
const WHATSAPP_NUMBER = 'YOUR_WHATSAPP_NUMBER';
