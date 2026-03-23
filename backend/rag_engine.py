import os
import time
import requests
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.embeddings import Embeddings
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

HF_MODEL_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"


class RobustHFEmbeddings(Embeddings):
    """
    Classe d'embedding HuggingFace robuste :
    - Passe wait_for_model=True pour éviter les retours 'error' sur free tier
    - Retry automatique si le modèle est encore en chargement
    """

    def __init__(self, api_key: str, max_retries: int = 5, wait_seconds: int = 20):
        self.api_key = api_key
        self.max_retries = max_retries
        self.wait_seconds = wait_seconds
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def _embed(self, texts: List[str]) -> List[List[float]]:
        payload = {"inputs": texts, "options": {"wait_for_model": True}}
        for attempt in range(self.max_retries):
            response = requests.post(HF_MODEL_URL, headers=self.headers, json=payload, timeout=60)
            if response.status_code == 200:
                result = response.json()
                # Vérification : le résultat doit être une liste de vecteurs
                if isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
                    return result
            print(f"[RAG] Embedding attempt {attempt + 1}/{self.max_retries} — status={response.status_code}, retrying in {self.wait_seconds}s...")
            time.sleep(self.wait_seconds)
        raise RuntimeError(f"HuggingFace API unavailable after {self.max_retries} attempts. Last response: {response.text[:200]}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Traiter par batch de 32 pour éviter les timeouts
        all_embeddings = []
        for i in range(0, len(texts), 32):
            batch = texts[i:i + 32]
            all_embeddings.extend(self._embed(batch))
        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        result = self._embed([text])
        return result[0]


def _get_embeddings() -> RobustHFEmbeddings:
    """Retourne une instance de RobustHFEmbeddings avec la clé API HuggingFace."""
    hf_api_key = os.getenv("HF_API_KEY", "")
    if not hf_api_key:
        raise ValueError("Variable d'environnement HF_API_KEY manquante.")
    return RobustHFEmbeddings(api_key=hf_api_key)



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
    embeddings = _get_embeddings()

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
    """
    try:
        supabase_client = _get_supabase_client()
        embeddings = _get_embeddings()
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