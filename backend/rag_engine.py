import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase_client():
    """Crée et retourne un client Supabase authentifié."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _get_embeddings() -> HuggingFaceEndpointEmbeddings:
    """Retourne les embeddings via le package officiel langchain-huggingface."""
    hf_api_key = os.getenv("HF_API_KEY", "")
    if not hf_api_key:
        raise ValueError("Variable d'environnement HF_API_KEY manquante.")
    return HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=hf_api_key,
    )


def _load_documents(file_path: str):
    """Charge un document PDF ou TXT selon l'extension."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".txt":
        loader = TextLoader(file_path, encoding="utf-8")
    else:
        raise ValueError(f"Format non supporté : {ext}. Utilisez .pdf ou .txt")
    return loader.load()


def process_bank_rules(file_path: str) -> bool:
    """
    Ingère la politique de crédit dans Supabase pgvector.
    Utilise des appels directs au client Supabase (sans SupabaseVectorStore).
    """
    print(f"--- Début de l'indexation : {file_path} ---")
    supabase_client = _get_supabase_client()
    embeddings = _get_embeddings()

    documents = _load_documents(file_path)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    texts = text_splitter.split_documents(documents)

    print(f"Suppression des anciens chunks et re-indexation de {len(texts)} chunks dans Supabase...")

    # Supprimer tous les enregistrements existants
    try:
        # Utilise un filtre qui matche tous les UUIDs
        supabase_client.table("documents").delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        print("Anciens chunks supprimés.")
    except Exception as e:
        print(f"Avertissement suppression : {e}")

    # Générer les embeddings pour tous les chunks
    text_strings = [doc.page_content for doc in texts]
    print(f"Génération des embeddings pour {len(text_strings)} chunks...")
    text_embeddings = embeddings.embed_documents(text_strings)

    # Insertion directe dans Supabase
    rows = []
    for doc, embedding in zip(texts, text_embeddings):
        rows.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "embedding": embedding,
        })

    supabase_client.table("documents").insert(rows).execute()
    print(f"--- {len(rows)} chunks indexés dans Supabase pgvector ---")
    return True


def retrieve_relevant_rules(query: str, k: int = 5) -> str:
    """
    Retrouve les chunks les plus pertinents via la fonction RPC match_documents.
    Appel direct au client Supabase (compatible supabase-py 2.x).
    """
    try:
        supabase_client = _get_supabase_client()
        embeddings = _get_embeddings()

        query_embedding = embeddings.embed_query(query)

        result = supabase_client.rpc(
            "match_documents",
            {
                "query_embedding": query_embedding,
                "match_count": k,
                "filter": {},
            },
        ).execute()

        if not result.data:
            return ""

        return "\n\n".join(
            [f"[Règle {i+1}]\n{row['content']}" for i, row in enumerate(result.data)]
        )
    except Exception as e:
        print(f"Erreur RAG retrieval : {e}")
        return ""


def is_knowledge_base_ready() -> bool:
    """
    Vérifie si la table 'documents' dans Supabase contient des données.
    """
    try:
        supabase_client = _get_supabase_client()
        result = supabase_client.table("documents").select("id", count="exact").limit(1).execute()
        return (result.count or 0) > 0
    except Exception as e:
        print(f"Avertissement is_knowledge_base_ready : {e}")
        return False