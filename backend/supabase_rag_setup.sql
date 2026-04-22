-- D'abord, on s'assure d'avoir l'extension vector
create extension if not exists vector;

-- Création de la table documents (s'il elle n'existe pas bien qu'elle y soit déjà)
create table if not exists documents (
  id bigserial primary key,
  content text, -- texte du chunk
  metadata jsonb, -- pour stocker le nom de l'établissement: {"establishment": "Mon Agence"}
  embedding vector(384) -- taille pour all-MiniLM-L6-v2
);

-- Création / Remplacement de la fonction match_documents avec support du filtre "metadata"
create or replace function match_documents (
  query_embedding vector(384),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  -- Le filtre @> jsonb vérifie si le metadata contient le filtre demandé.
  -- Ex: Si filter = '{"establishment": "Kaïs Bank"}' et metadata = '{"establishment": "Kaïs Bank", "page": 1}', ça matche !
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
