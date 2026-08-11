// TODO: Reemplazar con credenciales reales de Supabase
const supabaseUrl = 'https://dmqmpkrfpetdvkkwgduk.supabase.co';
const supabaseKey = 'sb_publishable_FhEGujxLfqU8j6YOgnFP1w_AAh8itMW';

// Inicializar cliente de Supabase bajo un nuevo nombre para no romper el SDK original
window.supabaseApp = window.supabase.createClient(supabaseUrl, supabaseKey);

// Constante para el número de WhatsApp (Ej: 573001234567)
const WHATSAPP_NUMBER = '573234444033';
