-- Cronologia della chat con l'assistente AI di una sessione (solo aggiunta, retrocompatibile).

create table session_ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index session_ai_messages_session_id_idx on session_ai_messages (session_id, created_at);
