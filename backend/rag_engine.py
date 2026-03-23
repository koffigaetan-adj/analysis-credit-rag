import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
HF_API_KEY = os.getenv("HF_API_KEY", "")

# Embedding via HuggingFace Inference API — aucun téléchargement PyTorch, appel HTTP simple
embeddings = HuggingFaceInferenceAPIEmbeddings(
    api_key=HF_API_KEY,
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def _get_supabase_client():
    """Crée et retourne un client Supabase authentifié."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            "Variables d'environnement manquantes : SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


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
    Supprime les anciens chunks avant de ré-indexer pour éviter les doublons.
    Supporte PDF et TXT.
    """
    print(f"--- Début de l'indexation : {file_path} ---")
    supabase_client = _get_supabase_client()

    documents = _load_documents(file_path)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    texts = text_splitter.split_documents(documents)

    print(f"Suppression des anciens chunks et re-indexation de {len(texts)} chunks dans Supabase...")

    # Supprimer les anciens enregistrements avant de ré-indexer
    try:
        supabase_client.table("documents").delete().neq("id", 0).execute()
        print("Anciens chunks supprimés.")
    except Exception as e:
        print(f"Avertissement lors de la suppression : {e}")

    SupabaseVectorStore.from_documents(
        documents=texts,
        embedding=embeddings,
        client=supabase_client,
        table_name="documents",
        query_name="match_documents",
    )

    print("--- Politique de crédit indexée dans Supabase pgvector ---")
    return True


def retrieve_relevant_rules(query: str, k: int = 5) -> str:
    """
    Retrouve les chunks de politique de crédit les plus pertinents
    via Supabase pgvector (similarity search).
    Retourne une chaîne de texte formatée pour injection dans le prompt.
    """
    try:
        supabase_client = _get_supabase_client()
        vectorstore = SupabaseVectorStore(
            client=supabase_client,
            embedding=embeddings,
            table_name="documents",
            query_name="match_documents",
        )
        docs = vectorstore.similarity_search(query, k=k)
        if not docs:
            return ""
        return "\n\n".join([f"[Règle {i+1}]\n{d.page_content}" for i, d in enumerate(docs)])
    except Exception as e:
        print(f"Erreur RAG retrieval : {e}")
        return ""


def ask_bank_knowledge(query: str, k: int = 4) -> str:
    """
    Interroge la base Supabase et retourne une réponse basée sur
    les règles internes de la banque (appel direct Groq).
    """
    context = retrieve_relevant_rules(query, k=k)
    if not context:
        return "Aucune règle pertinente trouvée dans la base de connaissances."

    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY)
    prompt = (
        f"Tu es un expert en politique de crédit bancaire.\n"
        f"En te basant uniquement sur les règles suivantes extraites de la politique interne de la banque :\n\n"
        f"{context}\n\n"
        f"Réponds à la question suivante de façon précise et concise :\n{query}"
    )
    response = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.05
    )
    return response.choices[0].message.content


def is_knowledge_base_ready() -> bool:
    """
    Vérifie si la table 'documents' dans Supabase contient des données.
    Utilisé au démarrage pour éviter une re-indexation inutile.
    """
    try:
        supabase_client = _get_supabase_client()
        result = supabase_client.table("documents").select("id", count="exact").limit(1).execute()
        return (result.count or 0) > 0
    except Exception as e:
        print(f"Avertissement is_knowledge_base_ready : {e}")
        return False