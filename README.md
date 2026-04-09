<div align="center">

<img src="https://img.shields.io/badge/Kaïs_Analytics-Intelligence_Financière-6366f1?style=for-the-badge&logo=lightning&logoColor=white" alt="Kaïs Analytics" height="45"/>

# 🏦 Kaïs Analytics — Analyse Crédit IA

**Plateforme intelligente d'analyse de risque crédit, propulsée par l'IA générative et le RAG**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![LangChain](https://img.shields.io/badge/🦜_LangChain-1C3C3C?style=for-the-badge)](https://www.langchain.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-CC2927?style=for-the-badge&logo=databricks&logoColor=white)](https://www.sqlalchemy.org/)

---

> **Kaïs Analytics** est une plateforme SaaS de **nouvelle génération** conçue pour les analystes crédit bancaires.  
> Elle combine l'extraction PDF intelligente, un moteur de scoring déterministe et l'IA générative (Groq/LLaMA 3.3)  
> enrichie par la **Retrieval-Augmented Generation (RAG)** sur la politique de crédit interne de la banque.

</div>

---

## 📋 Table des Matières

- [🎯 À Propos du Projet](#-à-propos-du-projet)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Stack Technologique](#️-stack-technologique)
- [📁 Structure du Projet](#-structure-du-projet)
- [⚙️ Installation & Démarrage](#️-installation--démarrage)
- [🔧 Configuration des Variables d'Environnement](#-configuration-des-variables-denvironnement)
- [🗄️ Base de Données](#️-base-de-données)
- [🤖 Moteur IA & RAG](#-moteur-ia--rag)
- [📡 API Endpoints](#-api-endpoints)
- [🖥️ Pages Frontend](#️-pages-frontend)
- [👥 Gestion des Rôles](#-gestion-des-rôles)
- [🚀 Déploiement](#-déploiement)

---

## 🎯 À Propos du Projet

**Kaïs Analytics** est une solution complète d'**analyse de risque crédit** dédiée aux professionnels bancaires (analystes, directeurs d'agence, SUPER_ADMIN). Elle automatise et enrichit l'analyse de dossiers de financement en combinant :

1. 📄 **Extraction automatique** des données financières depuis des documents PDF (bilans, bulletins de salaire, relevés...)
2. 📊 **Scoring déterministe** basé sur des ratios financiers (DSCR, endettement, marge nette, levier EBITDA...)
3. 🤖 **Interprétation IA** via le modèle **LLaMA 3.3 70B** (Groq) pour une analyse narrative professionnelle
4. 🔍 **RAG sur la politique de crédit** — l'IA consulte automatiquement les règles internes de la banque avant de formuler sa recommandation
5. 💬 **Assistant IA contextuel** — un chatbot financier capable de répondre aux questions sur chaque dossier analysé

### Cas d'usage

| Type de client | Documents acceptés | Ratios calculés |
|---|---|---|
| **Particulier** | Bulletins de salaire, avis d'imposition | Taux d'endettement, reste à vivre, capacité de remboursement |
| **Entreprise** | Bilans comptables, liasses fiscales | DSCR, levier EBITDA, marge nette, dette/fonds propres, croissance CA |

---

## ✨ Fonctionnalités

### 🔐 Authentification & Gestion des Accès
- Système de **création de compte sur demande** (validation par un administrateur)
- Authentification **JWT** sécurisée avec rafraîchissement automatique de session
- Expiration de session configurable (timeout automatique)
- Récupération de mot de passe par **code email OTP**
- Gestion des rôles hiérarchiques : `SUPER_ADMIN` > `ADMIN` > `ANALYST`

### 📊 Analyse de Dossiers Crédit
- **Dépôt multi-fichiers** (plusieurs PDF simultanément)
- **Extraction intelligente** des données financières via LLM (prompts structurés → JSON strict)
- **Scoreboard** avec décision automatique : `Favorable` / `Prudence` / `Refus`
- Visualisation graphique des **indicateurs clés** (Plotly.js, Recharts)
- Export du rapport en **PDF** et envoi par email SMTP
- Sauvegarde des analyses dans l'historique utilisateur

### 🤖 Intelligence Artificielle Avancée
- **LLM** : LLaMA 3.3 70B Versatile via **Groq** (inférence ultra-rapide)
- **RAG** : Politique de crédit indexée dans **Supabase pgvector** via embeddings HuggingFace (`all-MiniLM-L6-v2`)
- Enrichissement automatique du contexte d'analyse avec les règles bancaires pertinentes

### 💬 Chat Financier IA
- Assistant **contextuel par dossier** (questions sur l'analyse en cours)
- Assistant **global** avec gestion de sessions et historique de conversations
- Réponse uniquement dans le domaine finance/crédit/comptabilité

### 👨‍💼 Gestion d'Équipe (Admin)
- Tableau de bord des demandes d'accès (`PENDING` / `APPROVED` / `REJECTED`)
- Gestion des membres : activation, désactivation, modification de rôle
- Notification en temps réel (in-app)

### 🌐 Internationalisation
- Support multi-langue via **i18next** (prêt pour l'extension)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│              React 18 + TypeScript + Vite + TailwindCSS     │
│   Landing / Login / Dashboard / NewAnalysis / Chat / Team   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Python)                         │
│                   FastAPI + Uvicorn                         │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  auth.py    │  │  main.py     │  │  scoring_engine  │  │
│  │  JWT + RBAC │  │  API Routes  │  │  Ratios & Score  │  │
│  └─────────────┘  └──────┬───────┘  └──────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │               rag_engine.py                          │  │
│  │   LangChain + HuggingFace Embeddings + Supabase RPC  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│   SQLite / PostgreSQL │    │         Supabase                │
│   (SQLAlchemy ORM)    │    │  pgvector — Politique de crédit │
│                       │    │  (chunks + embeddings RAG)      │
│  - users              │    └─────────────────────────────────┘
│  - applications       │
│  - chat_sessions      │              ▲
│  - notifications      │              │ Embeddings
│  - account_requests   │    ┌─────────┴───────────┐
│  - password_reset     │    │   HuggingFace API    │
└──────────────────────┘    │  all-MiniLM-L6-v2    │
                            └─────────────────────┘
                                        │
                            ┌───────────▼──────────┐
                            │      Groq API         │
                            │  LLaMA 3.3 70B        │
                            │  (Extraction + IA)    │
                            └──────────────────────┘
```

---

## 🛠️ Stack Technologique

### 🐍 Backend

| Technologie | Version | Rôle |
|---|---|---|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) **Python** | 3.10+ | Langage backend |
| ![FastAPI](https://img.shields.io/badge/-FastAPI-005571?logo=fastapi&logoColor=white) **FastAPI** | Latest | Framework API REST asynchrone |
| ![Uvicorn](https://img.shields.io/badge/-Uvicorn-499848?logo=gunicorn&logoColor=white) **Uvicorn** | Latest | Serveur ASGI haute performance |
| ![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy-CC2927?logo=databricks&logoColor=white) **SQLAlchemy** | Latest | ORM base de données |
| ![Pydantic](https://img.shields.io/badge/-Pydantic-E92063?logo=pydantic&logoColor=white) **Pydantic** | v2 | Validation des données et modèles |
| 🦜 **LangChain** | Latest | Orchestration RAG (loaders, splitters) |
| 🤗 **HuggingFace** | Latest | Embeddings `all-MiniLM-L6-v2` |
| ⚡ **Groq** | Latest | Inférence LLaMA 3.3 70B (ultra-rapide) |
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) **Supabase** | 2.x | Base vectorielle pgvector + stockage |
| 🔐 **python-jose** | Latest | Génération et validation JWT |
| 🔑 **passlib[bcrypt]** | Latest | Hachage sécurisé des mots de passe |
| 📄 **pypdf** | Latest | Extraction de texte depuis les PDF |
| 📊 **Plotly** | Latest | Génération de graphiques côté serveur |
| 📧 **smtplib** | stdlib | Envoi d'emails SMTP (rapports, OTP) |
| 🐼 **Pandas** | Latest | Manipulation de données financières |

### ⚛️ Frontend

| Technologie | Version | Rôle |
|---|---|---|
| ![React](https://img.shields.io/badge/-React-20232A?logo=react&logoColor=61DAFB) **React** | 18.3 | Framework UI |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?logo=typescript&logoColor=white) **TypeScript** | 5.5 | Typage statique |
| ![Vite](https://img.shields.io/badge/-Vite-B73BFE?logo=vite&logoColor=FFD62E) **Vite** | 5.4 | Bundler ultra-rapide |
| ![TailwindCSS](https://img.shields.io/badge/-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white) **TailwindCSS** | 3.4 | Styling utilitaire |
| 🛣️ **React Router DOM** | v7 | Navigation SPA |
| 📈 **Plotly.js** | 3.x | Graphiques financiers interactifs |
| 📊 **Recharts** | 3.x | Graphiques React déclaratifs |
| 🎨 **Lucide React** | 0.344 | Icônes SVG modernes |
| 🌍 **i18next** | 25.x | Internationalisation (i18n) |
| 📱 **react-phone-input** | 3.x | Saisie de numéros de téléphone |
| 📄 **html2pdf.js** | 0.14 | Export PDF côté client |
| 🔌 **Supabase JS** | 2.x | Client Supabase côté frontend |

### ☁️ Infrastructure & Services

| Service | Rôle |
|---|---|
| **Supabase PostgreSQL + pgvector** | Base de données vectorielle pour le RAG |
| **Supabase Auth** | Authentification cloud (optionnel, JWT maison aussi disponible) |
| **Groq Cloud** | API d'inférence LLM (LLaMA 3.3 70B) |
| **HuggingFace Inference API** | Génération d'embeddings (`all-MiniLM-L6-v2`) |
| **SMTP (Gmail / Brevo)** | Envoi d'emails (OTP, rapports PDF) |
| **Vercel** | Déploiement frontend (via `vercel.json`) |

---

## 📁 Structure du Projet

```
analysis-credit-rag/
│
├── 📁 backend/
│   ├── main.py                     # Point d'entrée FastAPI — routes API principales
│   ├── auth.py                     # Authentification JWT, gestion des rôles, routes /auth/*
│   ├── database.py                 # Modèles SQLAlchemy, connexion DB, ORM
│   ├── models.py                   # Modèles Pydantic complémentaires
│   ├── rag_engine.py               # Moteur RAG (indexation + retrieval Supabase pgvector)
│   ├── scoring_engine.py           # Moteur de scoring déterministe (ratios financiers)
│   ├── email_service.py            # Service d'envoi d'emails SMTP
│   ├── seed.py                     # Script de création du SUPER_ADMIN initial
│   ├── politique_credit_banque.txt # 📄 Politique de crédit indexée via RAG
│   ├── requirements.txt            # Dépendances Python
│   ├── .env.example                # Variables d'environnement (modèle)
│   └── 📁 database/
│       └── credit_app.db           # Base de données SQLite locale (dev)
│
├── 📁 frontend/
│   ├── index.html                  # Point d'entrée HTML
│   ├── vite.config.ts              # Configuration Vite
│   ├── tailwind.config.js          # Configuration TailwindCSS
│   ├── tsconfig.json               # Configuration TypeScript
│   ├── vercel.json                 # Configuration déploiement Vercel
│   ├── package.json                # Dépendances NPM
│   │
│   └── 📁 src/
│       ├── App.tsx                 # Router principal (routes protégées)
│       ├── main.tsx                # Point d'entrée React
│       ├── index.css               # Styles globaux
│       │
│       ├── 📁 pages/
│       │   ├── Landing.tsx         # Page d'accueil publique
│       │   ├── Login.tsx           # Authentification + inscription
│       │   ├── Dashboard.tsx       # Tableau de bord analytique
│       │   ├── NewAnalysis.tsx     # Formulaire + upload PDF pour l'analyse
│       │   ├── AnalysisResult.tsx  # Résultats de l'analyse (score + graphiques)
│       │   ├── AnalysisDetail.tsx  # Détail d'une analyse historique
│       │   ├── List.tsx            # Historique des analyses
│       │   ├── Chat.tsx            # Assistant IA financier (sessions)
│       │   ├── Team.tsx            # Gestion d'équipe (Admin)
│       │   ├── Settings.tsx        # Paramètres utilisateur + profil
│       │   ├── HelpCenter.tsx      # Centre d'aide + contact
│       │   ├── Privacy.tsx         # Politique de confidentialité
│       │   └── Prediction.tsx      # Module de prédiction (à venir)
│       │
│       ├── 📁 components/
│       │   ├── Layout.tsx          # Layout principal avec sidebar
│       │   ├── ProtectedRoute.tsx  # Garde de routes (auth)
│       │   └── SessionTimeout.tsx  # Gestion d'expiration de session
│       │
│       ├── 📁 context/
│       │   └── AuthContext.tsx     # Contexte d'authentification React
│       │
│       └── 📁 locales/             # Fichiers de traduction i18n
│
├── 📁 Document_simulation/         # Exemples de documents PDF pour les tests
├── start.bat                       # 🚀 Script de lancement rapide (Windows)
├── start_env.bat                   # Script de lancement avec environnement virtuel
└── requirements.txt                # Dépendances Python (racine)
```

---

## ⚙️ Installation & Démarrage

### Prérequis

- **Python** >= 3.10 ([Télécharger](https://www.python.org/downloads/))
- **Node.js** >= 18 ([Télécharger](https://nodejs.org/))
- **Git** ([Télécharger](https://git-scm.com/))

### 1. Cloner le dépôt

```bash
git clone https://github.com/koffigaetan-adj/analysis-credit-rag.git
cd analysis-credit-rag
```

### 2. Configurer le Backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
.\venv\Scripts\activate   # Windows
# ou : source venv/bin/activate  # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Copier et remplir le fichier d'environnement
copy .env.example .env
# Éditer .env avec vos clés API (voir section Configuration)
```

### 3. Configurer le Frontend

```bash
cd ../frontend

# Installer les dépendances Node.js
npm install

# Copier et configurer les variables d'environnement
copy .env.example .env
```

### 4. Lancer le Projet

#### ✅ Option 1 — Script automatique (Windows)

```bash
# Depuis la racine du projet
.\start.bat
```

Ce script lance automatiquement :
- 🐍 Le backend FastAPI sur `http://localhost:8000`
- ⚛️ Le frontend Vite/React sur `http://localhost:5173`

#### Option 2 — Lancement manuel

```bash
# Terminal 1 — Backend
cd backend
python main.py

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## 🔧 Configuration des Variables d'Environnement

### Backend — `backend/.env`

```env
# Base de données
# Développement local (SQLite)
DATABASE_URL=sqlite:///./database/credit_app.db
# Production (PostgreSQL / Supabase)
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# Sécurité JWT
JWT_SECRET_KEY=votre-clé-secrète-très-longue-et-aléatoire

# IA — Groq (LLaMA 3.3 70B)
# Obtenez votre clé sur : https://console.groq.com/
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (base vectorielle RAG)
# Obtenez vos clés sur : https://app.supabase.com/
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# HuggingFace (embeddings RAG)
# Obtenez votre clé sur : https://huggingface.co/settings/tokens
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email SMTP (rapports PDF + OTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application-gmail
FROM_EMAIL=votre-email@gmail.com
FROM_NAME=Kaïs Intelligence Analyst

# Seed admin (mettre "true" au premier lancement pour créer le super admin)
ENABLE_SEED=false
```

### Frontend — `frontend/.env`

```env
# URL de l'API backend
VITE_API_URL=http://localhost:8000
```

---

## 🗄️ Base de Données

### Schéma des Tables (SQLAlchemy)

```
┌──────────────────────┐    ┌───────────────────────┐
│       users          │    │     applications       │
├──────────────────────┤    ├───────────────────────┤
│ id (UUID, PK)        │───▶│ user_id (FK)          │
│ first_name           │    │ full_name             │
│ last_name            │    │ client_type           │
│ email (UNIQUE)       │    │ project_type          │
│ password_hash        │    │ amount                │
│ role                 │    │ score                 │
│ poste                │    │ decision              │
│ is_active            │    │ ia_summary            │
│ is_first_login       │    │ financial_data (JSON) │
│ avatar_url           │    │ risks (JSON)          │
│ created_at           │    │ opportunities (JSON)  │
└──────────────────────┘    │ chat_history (JSON)   │
                            └───────────────────────┘

┌──────────────────────┐    ┌───────────────────────┐
│   chat_sessions      │    │   account_requests    │
├──────────────────────┤    ├───────────────────────┤
│ id (UUID, PK)        │    │ id (PK)               │
│ user_id (FK)         │    │ first_name            │
│ title                │    │ last_name             │
│ messages (JSON)      │    │ email                 │
│ created_at           │    │ poste                 │
│ updated_at           │    │ status                │
└──────────────────────┘    │ rejection_reason      │
                            └───────────────────────┘

┌──────────────────────┐    ┌───────────────────────┐
│   notifications      │    │  password_reset_codes │
├──────────────────────┤    ├───────────────────────┤
│ id (PK)              │    │ id (PK)               │
│ user_id              │    │ email                 │
│ title                │    │ code                  │
│ message              │    │ expires_at            │
│ type                 │    └───────────────────────┘
│ is_read              │
└──────────────────────┘
```

**Modes supportés :**
- 🟡 **SQLite** — Développement local (zéro config)
- 🟢 **PostgreSQL** — Production (Supabase ou serveur dédié)

---

## 🤖 Moteur IA & RAG

### Flux d'Analyse en 3 Phases

```
📄 PDF(s) Uploadé(s)
        │
        ▼
┌──────────────────────────────────────────┐
│  PHASE 1 — Extraction (Groq/LLaMA)       │
│  Prompt structuré → JSON normalisé        │
│  Particulier: revenus, charges, épargne  │
│  Entreprise: CA, EBITDA, dettes, equity  │
└─────────────────────┬────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│  PHASE 2 — Scoring Déterministe          │
│  scoring_engine.py                       │
│  Calcul des ratios financiers :          │
│  • Taux d'endettement (≤35% norme)       │
│  • DSCR (≥1.2 sain)                      │
│  • Levier EBITDA (<3x sain)              │
│  • Marge nette, dette/fonds propres...   │
│  → Score /100 + Décision automatique     │
└─────────────────────┬────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│  PHASE 3 — Interprétation IA + RAG       │
│                                          │
│  🔍 RAG : Supabase pgvector              │
│  → Retrieval des règles de crédit        │
│     pertinentes (top-5 chunks)           │
│                                          │
│  🤖 LLaMA 3.3 70B (Groq)               │
│  → Analyse narrative professionnelle     │
│  → Risques + Opportunités + Résumé       │
│  → Recommandations conformes policy      │
└──────────────────────────────────────────┘
```

### Configuration RAG

```python
# Modèle d'embedding
model = "sentence-transformers/all-MiniLM-L6-v2"

# Paramètres de découpage
chunk_size    = 1000 tokens
chunk_overlap = 150 tokens

# Retrieval
top_k = 5 chunks les plus pertinents

# Stockage
Table Supabase : "documents" (content, metadata, embedding vector)
Fonction RPC   : match_documents (similarité cosinus)
```

---

## 📡 API Endpoints

### 🔓 Public

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Connexion et obtention du token JWT |
| `POST` | `/auth/register-request` | Demande de création de compte |
| `POST` | `/auth/forgot-password` | Demande de réinitialisation par email |
| `POST` | `/auth/reset-password` | Réinitialisation avec le code OTP |

### 🔒 Protégés (JWT requis)

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze_dashboard/` | Lancer une analyse crédit (upload PDF) |
| `GET` | `/history/` | Récupérer l'historique des analyses |
| `GET` | `/applications/{id}` | Détail d'une analyse |
| `DELETE` | `/applications/{id}` | Supprimer une analyse |
| `POST` | `/applications/` | Sauvegarder une analyse |
| `POST` | `/chat/` | Chat contextuel sur un dossier |
| `POST` | `/chat/finance/` | Chat financier global (avec sessions) |
| `GET` | `/chat/sessions/` | Lister les sessions de chat |
| `POST` | `/chat/sessions/` | Créer une session de chat |
| `GET` | `/chat/sessions/{id}` | Récupérer une session |
| `PUT` | `/chat/sessions/{id}` | Renommer une session |
| `DELETE` | `/chat/sessions/{id}` | Supprimer une session |
| `POST` | `/contact/` | Envoyer un message au support |
| `POST` | `/report/email` | Envoyer le rapport PDF par email |

### 🛡️ Admin uniquement

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/users` | Lister tous les utilisateurs |
| `POST` | `/auth/users` | Créer un utilisateur |
| `PUT` | `/auth/users/{id}` | Modifier un utilisateur |
| `DELETE` | `/auth/users/{id}` | Désactiver un utilisateur |
| `GET` | `/auth/account-requests` | Lister les demandes d'accès |
| `POST` | `/auth/account-requests/{id}/approve` | Approuver une demande |
| `POST` | `/auth/account-requests/{id}/reject` | Rejeter une demande |

---

## 🖥️ Pages Frontend

| Route | Page | Accès | Description |
|---|---|---|---|
| `/` | **Landing** | Public | Page d'accueil marketing |
| `/login` | **Login** | Public | Connexion + demande de compte |
| `/dashboard` | **Dashboard** | Authentifié | Vue d'ensemble et statistiques |
| `/new` | **NewAnalysis** | Authentifié | Upload PDF + lancement analyse |
| `/analysis/result` | **AnalysisResult** | Authentifié | Résultats détaillés + graphiques |
| `/analysis/:id` | **AnalysisDetail** | Authentifié | Détail d'une analyse historique |
| `/list` | **List** | Authentifié | Historique de toutes les analyses |
| `/chat` | **Chat** | Authentifié | Assistant IA financier |
| `/team` | **Team** | Admin | Gestion de l'équipe |
| `/settings` | **Settings** | Authentifié | Profil et paramètres |
| `/help` | **HelpCenter** | Authentifié | Centre d'aide + contact |
| `/privacy` | **Privacy** | Authentifié | Politique de confidentialité |

---

## 👥 Gestion des Rôles

| Rôle | Capacités |
|---|---|
| `SUPER_ADMIN` | Accès total — gestion de toute l'équipe, toutes les analyses, configuration globale |
| `ADMIN` | Gestion de l'équipe (invitations, approbations), accès à toutes les analyses |
| `ANALYST` | Création et consultation de ses propres analyses, accès au chat IA |

---

## 🚀 Déploiement

### Frontend — Vercel

Le projet inclut un fichier `vercel.json` pré-configuré :

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

```bash
# Dans le dossier frontend
npm run build
# Déployer le dossier dist/ sur Vercel
```

### Backend — Production

```bash
# Avec Gunicorn (recommandé pour la production)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Ou directement avec Uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Le fichier `Procfile` à la racine est compatible Heroku/Railway :
```
web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Variables de Production

1. Définir `DATABASE_URL` sur une base PostgreSQL (Supabase recommandé)
2. Définir `ENABLE_SEED=true` au **premier** lancement uniquement (crée le SUPER_ADMIN)
3. Configurer SMTP pour la production (Gmail App Password ou Brevo)

---

## 🔐 Sécurité

- 🔒 **JWT** avec expiration configurable
- 🛡️ **Bcrypt** pour le hachage des mots de passe
- 🚫 **RBAC** (Role-Based Access Control) sur toutes les routes
- 🔑 **Headers de sécurité** : `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `HSTS`
- 📧 **OTP email** pour la réinitialisation de mot de passe

---

<div align="center">

**Kaïs Analytics** — *L'intelligence financière au service du crédit bancaire*

Made with ❤️ · [Signaler un bug](mailto:gaetan.eyes@gmail.com) · [Documentation API](http://localhost:8000/docs)

</div>
