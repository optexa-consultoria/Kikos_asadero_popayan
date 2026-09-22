// Cliente de Supabase para el navegador.
// La llave "publishable" es pública por diseño: la seguridad real depende de las políticas RLS.
// Nunca pongas aquí la llave secreta (service_role).
const supabaseUrl = 'https://dmqmpkrfpetdvkkwgduk.supabase.co';
const supabaseKey = 'sb_publishable_FhEGujxLfqU8j6YOgnFP1w_AAh8itMW';

// Se expone como supabaseApp para no sobrescribir el SDK global (window.supabase)
window.supabaseApp = window.supabase.createClient(supabaseUrl, supabaseKey);
