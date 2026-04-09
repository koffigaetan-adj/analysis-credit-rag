import os
import functools
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# ─── SINGLETONS (client + embeddings créés une seule fois) ───────────────────
_supabase_client: Client = None
_embeddings: HuggingFaceEndpointEmbeddings = None


def _get_supabase_client() -> Client:
    """Retourne un client Supabase singleton (créé une seule fois au démarrage)."""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


def _get_embeddings() -> HuggingFaceEndpointEmbeddings:
    """Retourne les embeddings singleton (modèle chargé une seule fois)."""
    global _embeddings
    if _embeddings is None:
        hf_api_key = os.getenv("HF_API_KEY", "")
        if not hf_api_key:
            raise ValueError("Variable d'environnement HF_API_KEY manquante.")
        _embeddings = HuggingFaceEndpointEmbeddings(
            model="sentence-transformers/all-MiniLM-L6-v2",
            huggingfacehub_api_token=hf_api_key,
        )
    return _embeddings


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

    # Découpage plus fin pour un retrieval plus précis
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,       # Réduit de 1000 → 600 pour des chunks plus ciblés
        chunk_overlap=100,    # Réduit proportionnellement
        separators=["\n\n", "\n", "—", ".", " "],
    )
    texts = text_splitter.split_documents(documents)

    # Supprimer tous les enregistrements existants
    try:
        print(f"Suppression des anciens chunks et re-indexation de {len(texts)} chunks dans Supabase...")
        supabase_client.table("documents").delete().neq("content", "").execute()
        print("Anciens chunks supprimés.")
    except Exception as e:
        print(f"Erreur lors de la suppression des anciens chunks : {e}")

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


def _retrieve_single_query(query: str, k: int = 3) -> list[dict]:
    """
    Effectue un retrieval pour une requête donnée.
    Retourne une liste de dicts {content, similarity} ou [] si erreur.
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
            return []

        return result.data

    except Exception as e:
        print(f"Erreur RAG retrieval (query='{query[:60]}...') : {e}")
        return []


def retrieve_relevant_rules(query: str, k: int = 5) -> str:
    """
    Retrieval simple (rétrocompatibilité) — utilisé par le chat.
    Retourne une chaîne de texte avec les règles pertinentes.
    """
    chunks = _retrieve_single_query(query, k=k)
    if not chunks:
        return ""
    return "\n\n".join(
        [f"[Règle {i+1}]\n{row['content']}" for i, row in enumerate(chunks)]
    )


def retrieve_rules_for_analysis(
    client_type: str,
    amount: float,
    secteur: str = "Inconnu",
    score: int = 0,
    ratios: dict = None,
) -> str:
    """
    Retrieval MULTI-ANGLES pour une analyse de dossier crédit.
    Lance plusieurs requêtes ciblées et déduplique les résultats.

    Stratégie :
      - Requête 1 : critères généraux selon le type de client
      - Requête 2 : règles spécifiques au secteur d'activité
      - Requête 3 : règles de garanties selon le montant
      - Requête 4 : grille de décision et niveaux de délégation
      - Requête 5 (conditionnelle) : règles de dérogation si score limite
    """
    if ratios is None:
        ratios = {}

    seen_contents = set()
    all_chunks = []

    def add_chunks(chunks: list[dict], label: str):
        for c in chunks:
            content = c.get("content", "").strip()
            if content and content not in seen_contents:
                seen_contents.add(content)
                all_chunks.append((label, content))

    # ── Requête 1 : Critères d'éligibilité selon le type de client ──────────
    q1 = f"critères éligibilité {client_type} revenus endettement situation professionnelle"
    add_chunks(_retrieve_single_query(q1, k=3), "Critères client")

    # ── Requête 2 : Règles spécifiques au secteur d'activité ─────────────────
    if secteur and secteur.lower() not in ["inconnu", "unknown", ""]:
        q2 = f"secteur {secteur} conditions vigilance refus bonification"
        add_chunks(_retrieve_single_query(q2, k=2), f"Secteur {secteur}")

    # ── Requête 3 : Garanties et sûretés selon le montant ───────────────────
    q3 = f"garanties sûretés hypothèque caution montant {int(amount)}€ obligations"
    add_chunks(_retrieve_single_query(q3, k=2), "Garanties")

    # ── Requête 4 : Grille de décision et niveaux de délégation ─────────────
    q4 = "grille décision score délégation comité crédit refus dérogation"
    add_chunks(_retrieve_single_query(q4, k=2), "Décision")

    # ── Requête 5 : Dérogation (uniquement si score limite 40-54) ────────────
    if 40 <= score <= 54:
        q5 = "dérogation score limite conditions directeur crédit incidents paiement"
        add_chunks(_retrieve_single_query(q5, k=2), "Dérogation")

    # ── Requête 6 : Plafonds et durées ───────────────────────────────────────
    q6 = f"plafond maximum financement durée {client_type}"
    add_chunks(_retrieve_single_query(q6, k=2), "Plafonds")

    if not all_chunks:
        return _get_fallback_rules(client_type)

    # Formatage final avec label de contexte
    formatted = []
    for i, (label, content) in enumerate(all_chunks):
        formatted.append(f"[Règle {i+1} — {label}]\n{content}")

    print(f"[RAG] {len(formatted)} règles pertinentes récupérées pour l'analyse ({client_type}, {int(amount)}€, secteur={secteur})")
    return "\n\n".join(formatted)


def _get_fallback_rules(client_type: str) -> str:
    """
    Règles de fallback statiques si Supabase est indisponible ou la KB est vide.
    Garantit que le LLM a toujours des règles de base à appliquer.
    """
    print("[RAG] ⚠️ Fallback sur les règles statiques (Supabase indisponible ou KB vide).")

    if client_type.lower() == "particulier":
        return """[Règle Fallback — Politique interne de base]
PARTICULIER — Règles essentielles :
- Taux d'endettement maximum : 33% (seuil interne Kaïs Bank, plus strict que la norme HCSF de 35%)
- Au-delà de 35% : refus systématique sauf apport > 30%
- Au-delà de 50% : refus automatique sans dérogation
- Apport recommandé : minimum 10% du montant. Obligatoire à 20% si montant > 150 000€.
- CDI/Fonctionnaire/Retraité : profil éligible standard
- CDD/Intérim : ancienneté minimale 12 mois requise
- Sans emploi : refus automatique
- Crédit immobilier : durée maximale 25 ans (300 mois)
- Score ≥ 85 : accord direct. Score < 40 : refus avec lettre motivée."""
    else:
        return """[Règle Fallback — Politique interne de base]
ENTREPRISE — Règles essentielles :
- Ancienneté < 2 ans : refus automatique
- Résultat net négatif : refus automatique (sauf investissements documentés)
- Marge nette minimum : 3% du CA
- Levier EBITDA maximum : 4x. Au-delà de 6x : refus automatique.
- DSCR minimum : 1.20. DSCR < 1.0 : refus automatique.
- Fonds propres négatifs : refus automatique.
- Financement > 2x le CA : refus sauf garanties exceptionnelles.
- Financement > 200 000€ : deux types de garanties requis.
- Secteurs exclus : jeux d'argent, cryptomonnaies spéculatives, armement privé.
- Score ≥ 85 : accord direct. Score < 40 : refus avec lettre motivée."""


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