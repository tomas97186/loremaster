-- Modello Claude scelto da Impostazioni (per utente). Se vuoto, l'app usa il modello predefinito.

alter table user_settings add column claude_model text;
