import os
import random
from fpdf import FPDF

# --- CONFIGURATION DES PROFILS ENTREPRISE ---
entreprises = [
    {"nom": "TECH-NOVATION SAS", "ca": 1200000, "resultat": 150000, "treso": 85000, "profil": "solide", "gerant": "Thomas LEROY"},
    {"nom": "BTP-FAST-BUILD", "ca": 800000, "resultat": -42000, "treso": 1500, "profil": "difficultes", "gerant": "Marc DUPONT"},
    {"nom": "BIO-DISTRIB SARL", "ca": 300000, "resultat": 18000, "treso": 12000, "profil": "jeune_pousse", "gerant": "Sophie MARTIN"},
    {"nom": "LOGISTIQUE-PLUS", "ca": 2500000, "resultat": 280000, "treso": -8000, "profil": "ca_eleve_sans_treso", "gerant": "Karim HADDAD"},
    {"nom": "FRANCE-FRAUDE SAS", "ca": 950000, "resultat": 480000, "treso": 410000, "profil": "fraudeur", "gerant": "Lucas FRAUDE"},
    {"nom": "CAFE-RESTAURANT-JOJO", "ca": 180000, "resultat": 8000, "treso": 2500, "profil": "petit_artisan", "gerant": "Jean BON"},
    {"nom": "RETAIL-MODERN", "ca": 650000, "resultat": 15000, "treso": -12000, "profil": "decouvert_chronique", "gerant": "Emma PETIT"},
    {"nom": "CONSULTING-ELITE", "ca": 550000, "resultat": 210000, "treso": 160000, "profil": "prestateur_solide", "gerant": "Antoine DUMAIS"},
    {"nom": "STARTUP-BURN-RATE", "ca": 60000, "resultat": -180000, "treso": 450000, "profil": "levee_de_fonds", "gerant": "Chloe BERNARD"},
    {"nom": "INNO-TECH-CRASH", "ca": 0, "resultat": 0, "treso": 0, "profil": "crash_test", "gerant": "Inconnu"}
]

def create_pdf(filepath, title, lines):
    pdf = FPDF()
    pdf.add_page()
    # Header style
    pdf.set_font("Arial", 'B', 16)
    pdf.set_text_color(30, 41, 59) # Slate 800
    pdf.cell(0, 15, txt=title, ln=True, align='C')
    pdf.ln(10)
    
    # Content style
    pdf.set_font("Arial", size=10)
    pdf.set_text_color(71, 85, 105) # Slate 600
    for line in lines:
        pdf.cell(0, 8, txt=line, ln=True)
    
    # Footer simulation
    pdf.set_y(-30)
    pdf.set_font("Arial", 'I', 8)
    pdf.cell(0, 10, txt="Document genere pour audit CreditAI Pro - Confidentiel", align='C')
    pdf.output(filepath)

# --- CRÉATION DE L'ARBORESCENCE ---
base_dir = "Dossiers_Prets_Pro"
os.makedirs(base_dir, exist_ok=True)

print("Generation des documents PRO selon l'interface...")

for ent in entreprises:
    nom_ent = ent["nom"]
    nom_dir = nom_ent.replace(" ", "_")
    ent_path = os.path.join(base_dir, nom_dir)
    os.makedirs(ent_path, exist_ok=True)
    
    # --- 1. EXTRAIT KBIS (-3 MOIS) ---
    create_pdf(f"{ent_path}/1_Extrait_KBIS.pdf", "EXTRAIT D'IMMATRICULATION AU RCS (KBIS)", [
        f"DENOMINATION SOCIALE : {nom_ent}",
        f"SIREN : {random.randint(100, 999)} {random.randint(100, 999)} {random.randint(100, 999)}",
        f"FORME JURIDIQUE : {nom_ent.split(' ')[-1]}",
        f"SIEGE SOCIAL : 45 Rue de l'Innovation, 75000 PARIS",
        f"DATE D'IMMATRICULATION : 12/05/2018",
        f"GERANT : {ent['gerant']}"
    ])

    # --- 2. STATUTS MIS À JOUR ---
    create_pdf(f"{ent_path}/2_Statuts_Mis_A_Jour.pdf", "STATUTS DE LA SOCIETE", [
        f"SOCIETE : {nom_ent}",
        "ARTICLE 1 - FORME JURIDIQUE",
        "La societe est une societe par actions simplifiee (SAS).",
        "ARTICLE 2 - OBJET SOCIAL",
        "La societe a pour objet toutes prestations de services et de conseil.",
        f"ARTICLE 3 - SIEGE : 45 Rue de l'Innovation, 75000 PARIS"
    ])

    # --- 3. BILAN COMPLET (ANNÉE N) ---
    ca_n = ent["ca"]
    res_n = ent["resultat"]
    create_pdf(f"{ent_path}/3_Bilan_Complet_Annee_N.pdf", f"COMPTE DE RESULTAT ET BILAN - ANNEE 2024", [
        f"ENTREPRISE : {nom_ent}",
        "--------------------------------------------------",
        f"CHIFFRE D'AFFAIRES (CA) : {ca_n:,} EUR",
        f"CHARGES TOTALES : {ca_n - res_n:,} EUR",
        "--------------------------------------------------",
        f"RESULTAT NET : {res_n:,} EUR",
        f"CAPITAUX PROPRES : {random.randint(50000, 200000):,} EUR"
    ])

    # --- 4. BILAN COMPLET (ANNÉE N-1) ---
    ca_n1 = round(ca_n * random.uniform(0.8, 1.2)) # Variation de 20%
    res_n1 = round(ca_n1 * 0.1)
    create_pdf(f"{ent_path}/4_Bilan_Complet_Annee_N-1.pdf", f"COMPTE DE RESULTAT ET BILAN - ANNEE 2023", [
        f"ENTREPRISE : {nom_ent}",
        "--------------------------------------------------",
        f"CHIFFRE D'AFFAIRES (CA) : {ca_n1:,} EUR",
        f"CHARGES TOTALES : {ca_n1 - res_n1:,} EUR",
        "--------------------------------------------------",
        f"RESULTAT NET : {res_n1:,} EUR"
    ])

    # --- 5. 3 DERNIERS RELEVÉS BANCAIRES PRO ---
    lignes_banque = [f"BANQUE : BNP PARIBAS BUSINESS", f"TITULAIRE : {nom_ent}", f"SOLDE AU 01/02/2026 : {ent['treso']:,} EUR", ""]
    
    # Logique de flux selon profil
    if ent["profil"] == "fraudeur":
        lignes_banque.append("12/01 - VIR RECU (DUBAI HOLDING) : + 150,000.00 EUR")
        lignes_banque.append("15/01 - RETRAIT ESPECES : - 45,000.00 EUR")
    elif ent["profil"] == "decouvert_chronique":
        lignes_banque.append("10/01 - PRLV URSSAF (REJET) : 0.00 EUR")
        lignes_banque.append("12/01 - COMMISSION D'INTERVENTION : - 80.00 EUR")
    elif ent["profil"] == "solide":
        lignes_banque.append(f"05/01 - VIREMENT SALAIRES : - {round(ca_n/30):,} EUR")
        lignes_banque.append(f"20/01 - REGLEMENT CLIENT FACTURE #88 : + {round(ca_n/40):,} EUR")
    
    create_pdf(f"{ent_path}/5_3_Derniers_Releves_Bancaires_Pro.pdf", "RELEVE BANCAIRE PROFESSIONNEL", lignes_banque)

    # --- 6. RIB ---
    create_pdf(f"{ent_path}/6_RIB.pdf", "RELEVE D'IDENTITE BANCAIRE (RIB)", [
        f"NOM : {nom_ent}",
        f"IBAN : FR76 3000 4000 {random.randint(1000, 9999)} 1234 567",
        f"BIC : BNPAFR"
    ])

print("Termine ! Les 10 dossiers sont dans 'Dossiers_Prets_Pro'.")