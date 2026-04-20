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

-- 3. Insertion du premier administrateur système (Système Admin)
-- Email : admin@kais-analytics.com
-- Mot de passe : KaisAdmin2026!
INSERT INTO public.user_backoffice (email, password_hash, name, role, is_active)
VALUES (
    'admin@kais-analytics.com', 
    '$2b$12$kstVwDUu36yo4i7gT1Mih.kJA773dBaBYYaqSk6ToFxfULQhnCWDi', 
    'Système Admin', 
    'SYSTEM_ADMIN', 
    TRUE
) ON CONFLICT (email) DO NOTHING;
