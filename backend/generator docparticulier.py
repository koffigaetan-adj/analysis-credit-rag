import os
import random
from fpdf import FPDF

# --- LES 10 PROFILS DE TEST (Avec données de base) ---
clients = [
    {"nom": "Thomas LEROY", "base_salaire": 4500, "base_loyer": 1200, "profil": "solide", "mensualite_credit": 0, "employeur": "TECH SOLUTIONS SAS"},
    {"nom": "Marc DUPONT", "base_salaire": 2000, "base_loyer": 800, "profil": "joueur", "mensualite_credit": 0, "employeur": "LOGISTIQUE EXPRESS"},
    {"nom": "Sophie MARTIN", "base_salaire": 2500, "base_loyer": 900, "profil": "surendettee", "mensualite_credit": 650, "employeur": "HOPITAL CENTRAL"},
    {"nom": "Karim HADDAD", "base_salaire": 2200, "base_loyer": 700, "profil": "moyen", "mensualite_credit": 0, "employeur": "BTP CONSTRUCTION"},
    {"nom": "Chloe BERNARD", "base_salaire": 1800, "base_loyer": 0, "profil": "jeune_sans_loyer", "mensualite_credit": 0, "employeur": "STARTUP INNOVE"},
    {"nom": "Antoine DUMAIS", "base_salaire": 6000, "base_loyer": 2500, "profil": "flambeur", "mensualite_credit": 0, "employeur": "GROUPE LUXURY"},
    {"nom": "Mme MOREAU", "base_salaire": 1400, "base_loyer": 0, "profil": "retraitee_proprio", "mensualite_credit": 0, "employeur": "CAISSE RETRAITE"},
    {"nom": "Emma PETIT", "base_salaire": 2100, "base_loyer": 800, "profil": "micro_credits", "mensualite_credit": 0, "employeur": "BOUTIQUE MODE"},
    {"nom": "Lucas FRAUDE", "base_salaire": 3000, "base_loyer": 900, "profil": "fraudeur", "mensualite_credit": 0, "employeur": "ENTREPRISE FANTOME"},
    {"nom": "Jean ERREUR", "base_salaire": 2000, "base_loyer": 600, "profil": "crash_test", "mensualite_credit": 0, "employeur": "INCONNU"}
]

fournisseurs_domicile = ["EDF", "ENGIE", "ORANGE", "FREE", "SUEZ"]

def create_pdf(filepath, title, lines):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=11)
    
    # Titre en gras
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, txt=title, ln=True, align='C')
    pdf.ln(5)
    
    # Contenu
    pdf.set_font("Arial", size=10)
    for line in lines:
        pdf.cell(0, 7, txt=line, ln=True)
    
    pdf.output(filepath)

# --- CRÉATION DE L'ARBORESCENCE ---
base_dir = "dossiers_test"
os.makedirs(base_dir, exist_ok=True)

print("🚀 Lancement de l'usine à documents avec données dynamiques...")

for client in clients:
    nom = client["nom"]
    nom_dossier = nom.replace(" ", "_")
    client_dir = os.path.join(base_dir, nom_dossier)
    os.makedirs(client_dir, exist_ok=True)
    
    # Données aléatoires spécifiques au client
    prenom = nom.split(' ')[0]
    nom_famille = nom.split(' ')[1] if len(nom.split(' ')) > 1 else nom
    iban_random = f"FR76 {random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)} 123"
    fournisseur = random.choice(fournisseurs_domicile)
    
    # --- PROFIL CRASH TEST (Il reçoit n'importe quoi) ---
    if client["profil"] == "crash_test":
        for i in range(1, 9):
            create_pdf(f"{client_dir}/Doc_{i}_CrashTest.pdf", "MENU DU RESTAURANT", [
                "Entree : Salade de tomates - 5.00 EUR",
                "Plat : Steak Frites - 15.00 EUR",
                "Dessert : Tiramisu - 6.00 EUR",
                "Merci de votre visite !"
            ])
        continue # On passe au client suivant

    # --- 1. CARTE D'IDENTITÉ ---
    create_pdf(f"{client_dir}/1_Piece_Identite.pdf", "COPIE - CARTE NATIONALE D'IDENTITE", [
        "REPUBLIQUE FRANCAISE",
        f"Nom : {nom_famille}",
        f"Prenom : {prenom}",
        f"Né(e) le : {random.randint(1, 28)}/0{random.randint(1, 9)}/19{random.randint(50, 99)}",
        "Valide jusqu'au : 12/08/2031"
    ])
    
    # --- 2. JUSTIFICATIF DOMICILE ---
    create_pdf(f"{client_dir}/2_Justificatif_Domicile.pdf", f"FACTURE {fournisseur}", [
        f"Facture a l'attention de : {nom}",
        "Adresse : 45 Avenue de la Republique, 75000 PARIS",
        f"Date de facturation : 05/01/2024",
        f"Montant TTC preleve : {random.randint(45, 120)}.00 EUR",
        "Etat : Payee"
    ])
    
    # --- 3, 4, 5. BULLETINS DE SALAIRE (3 mois avec variations) ---
    salaires_nets = []
    for mois, nom_mois in enumerate(["Octobre", "Novembre", "Decembre"]):
        # Variation du salaire (heures supp, primes, etc. +/- 5%)
        variation = random.randint(-50, 150)
        salaire_net_mois = client["base_salaire"] + variation
        salaires_nets.append(salaire_net_mois)
        salaire_brut = round(salaire_net_mois * 1.3, 2)
        
        create_pdf(f"{client_dir}/{3+mois}_Bulletin_Paie_{nom_mois}.pdf", f"BULLETIN DE SALAIRE - {nom_mois.upper()} 2023", [
            f"Employeur : {client['employeur']}",
            f"Salarie : {nom}",
            "--------------------------------------------------",
            f"Salaire Brut : {salaire_brut} EUR",
            f"Cotisations Sociales : -{round(salaire_brut - salaire_net_mois, 2)} EUR",
            "--------------------------------------------------",
            f"NET A PAYER : {salaire_net_mois} EUR",
            f"IBAN de versement : {iban_random}"
        ])

    # --- 6. AVIS D'IMPOSITION ---
    revenu_annuel = client["base_salaire"] * 12 + random.randint(500, 2000)
    create_pdf(f"{client_dir}/6_Avis_Imposition.pdf", "AVIS D'IMPOSITION SUR LES REVENUS", [
        "DIRECTION GENERALE DES FINANCES PUBLIQUES",
        f"Foyer fiscal : {nom}",
        "--------------------------------------------------",
        f"Revenu Declare : {revenu_annuel} EUR",
        f"Revenu Fiscal de Reference : {round(revenu_annuel * 0.9)} EUR",
        f"Impot Net a Payer : {random.randint(1000, 4000)} EUR"
    ])
    
    # --- 7. RIB ---
    create_pdf(f"{client_dir}/7_RIB.pdf", "RELEVE D'IDENTITE BANCAIRE", [
        "BANQUE : SOCIETE GENERALE",
        f"Titulaire du compte : {nom}",
        f"IBAN : {iban_random}",
        "BIC : SOGEPARIS"
    ])
    
    # --- 8. RELEVÉS BANCAIRES (3 MOIS COMBINÉS DANS UN FICHIER) ---
    lignes_releve = []
    solde = random.randint(100, 3000)
    
    for i, mois in enumerate(["Oct", "Nov", "Dec"]):
        lignes_releve.append(f"--- RELEVE DU MOIS DE {mois.upper()} ---")
        lignes_releve.append(f"01/{mois} - SOLDE INITIAL : {solde} EUR")
        
        # Le salaire (Fraudeur = pas de salaire, juste la CAF)
        if client["profil"] == "fraudeur":
            lignes_releve.append(f"05/{mois} - VIR ALLOCATION CAF : + 420.00 EUR")
            solde += 420
        else:
            lignes_releve.append(f"05/{mois} - VIR SALAIRE {client['employeur']} : + {salaires_nets[i]} EUR")
            solde += salaires_nets[i]
            
        # Le Loyer
        if client["base_loyer"] > 0:
            lignes_releve.append(f"07/{mois} - PRLV LOYER : - {client['base_loyer']} EUR")
            solde -= client["base_loyer"]
            
        # Dépenses de vie courante (aléatoires)
        courses = random.randint(200, 450)
        essence = random.randint(50, 150)
        lignes_releve.append(f"10/{mois} - ACHAT CB CARREFOUR : - {courses}.00 EUR")
        lignes_releve.append(f"14/{mois} - ACHAT CB STATION TOTAL : - {essence}.00 EUR")
        solde -= (courses + essence)
        
        # --- LES COMPORTEMENTS SPÉCIFIQUES ---
        if client["profil"] == "joueur":
            lignes_releve.append(f"18/{mois} - ACHAT CB PMU.FR : - {random.randint(100, 300)}.00 EUR")
            lignes_releve.append(f"22/{mois} - ACHAT CB FDJ : - {random.randint(50, 150)}.00 EUR")
            lignes_releve.append(f"28/{mois} - FRAIS DECOUVERT AGIOS : - 35.50 EUR")
            solde -= 400 # Simulation perte
            
        elif client["profil"] == "surendettee":
            lignes_releve.append(f"12/{mois} - PRLV PRET CETELEM : - 350.00 EUR")
            lignes_releve.append(f"15/{mois} - PRLV PRET AUTO COFIDIS : - 300.00 EUR")
            solde -= 650
            
        elif client["profil"] == "micro_credits":
            lignes_releve.append(f"11/{mois} - PAIEMENT KLARNA 3X : - {random.randint(40, 80)}.00 EUR")
            lignes_releve.append(f"17/{mois} - PAIEMENT PAYPAL 4X : - {random.randint(50, 120)}.00 EUR")
            
        elif client["profil"] == "flambeur":
            lignes_releve.append(f"15/{mois} - ACHAT CB LOUIS VUITTON : - 1200.00 EUR")
            lignes_releve.append(f"20/{mois} - ACHAT CB APPLE STORE : - 800.00 EUR")
            solde -= 2000
            
        elif client["profil"] == "solide":
            epargne = random.randint(300, 800)
            lignes_releve.append(f"25/{mois} - VIREMENT VERS LIVRET A : - {epargne}.00 EUR")
            solde -= epargne

        lignes_releve.append(f"30/{mois} - SOLDE FIN DE MOIS : {solde} EUR")
        lignes_releve.append("") # Ligne vide pour aérer

    create_pdf(f"{client_dir}/8_Releves_Bancaires_3Mois.pdf", "RELEVES DE COMPTE", lignes_releve)
    
    # --- 9. TABLEAU D'AMORTISSEMENT (SEULEMENT SI CRÉDIT EN COURS) ---
    if client["mensualite_credit"] > 0:
        create_pdf(f"{client_dir}/9_Tableau_Amortissement.pdf", "TABLEAU D'AMORTISSEMENT - PRET EN COURS", [
            "ORGANISME : BANQUE DE CREDIT",
            f"Client : {nom}",
            "Type : Pret Personnel",
            "Montant emprunte : 15 000.00 EUR",
            f"Mensualite : {client['mensualite_credit']} EUR",
            "Capital restant du : 8 450.00 EUR",
            "Fin du pret : Dans 14 mois"
        ])

print("✅ Usine terminée ! Va voir le dossier 'dossiers_test'.")