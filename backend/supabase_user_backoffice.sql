-- 1. Création de la table user_backoffice
CREATE TABLE IF NOT EXISTS public.user_backoffice (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'SYSTEM_ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2. Création des index (pour optimiser les recherches)
CREATE INDEX IF NOT EXISTS ix_user_backoffice_id ON public.user_backoffice (id);
CREATE INDEX IF NOT EXISTS ix_user_backoffice_email ON public.user_backoffice (email);

-- Attention: Il faudra générer le password hash via Python et faire l'insertion sur Supabase, 
--  ou exécuter le script seed_backoffice.py avec DATABASE_URL pointant vers Supabase.
