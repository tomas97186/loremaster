-- Chiavi API dell'assistente AI configurabili da Impostazioni (per utente).
-- Se vuote, l'app ripiega sulle variabili d'ambiente GEMINI_API_KEY / ANTHROPIC_API_KEY.

alter table user_settings add column gemini_api_key text;
alter table user_settings add column anthropic_api_key text;
