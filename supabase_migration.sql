-- CrǸation de la table communication_history
CREATE TABLE communication_history (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    target VARCHAR,
    delivery_method VARCHAR,
    sender_name VARCHAR,
    total_sent INTEGER DEFAULT 0,
    email_delivered INTEGER DEFAULT 0,
    email_failed INTEGER DEFAULT 0,
    email_opened JSONB DEFAULT '[]'::jsonb,
    in_app_opened JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requǸtes (facultatif mais recommandǸ)
CREATE INDEX idx_communication_history_id ON communication_history(id);
CREATE INDEX idx_communication_history_created_at ON communication_history(created_at);

-- Ajout de la colonne communication_id  la table existante notifications
ALTER TABLE notifications ADD COLUMN communication_id INTEGER;