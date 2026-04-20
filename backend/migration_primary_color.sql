-- =====================================================================
-- MIGRATION : Ajout de la couleur thème par établissement
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================================

-- 1. Ajouter la colonne primary_color à la table establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#E73919';

-- 2. Vérification : afficher les établissements avec leur couleur
SELECT id, name, status, primary_color FROM public.establishments;

-- =====================================================================
-- ✅ Après avoir exécuté ce script, les membres verront leur couleur
--    thème changer dynamiquement selon leur établissement.
-- =====================================================================
