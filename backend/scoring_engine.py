import typing

class FinancialData(typing.TypedDict, total=False):
    # --- Champs Entreprise ---
    revenue: float
    revenue_n_minus_1: float
    ebitda: float
    ebitda_n_minus_1: float
    net_income: float
    net_income_n_minus_1: float
    equity: float
    total_debt: float
    cash_flow: float
    working_capital: float
    anciennete_annees: float         # Ancienneté de l'entreprise en années
    secteur_activite: str            # Secteur d'activité (ex: "BTP", "Commerce", "Tech")
    garanties_proposees: str         # Description des garanties (ex: "Hypothèque", "Caution")
    # --- Champs Particulier ---
    revenus_annuels: float
    charges_annuelles: float
    mensualites_credits: float
    epargne_estimee: float
    apport_personnel: float          # Apport en capital sur le montant demandé
    nb_personnes_charge: float       # Nombre de personnes à charge (enfants, etc.)
    situation_professionnelle: str   # CDI, CDD, Indépendant, Retraité, Sans emploi...


def extract_numbers(data: dict) -> FinancialData:
    """Safely extracts numbers from a dictionary, returning 0.0 if not found/invalid."""
    def to_float(val):
        try:
            if isinstance(val, str):
                # Handle formatted strings like "1 000 000,50" or "1000000.50"
                return float(val.replace(" ", "").replace(",", "."))
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    def to_str(val, default="Inconnu"):
        if isinstance(val, str) and val.strip():
            return val.strip()
        return default

    return FinancialData(
        # Entreprise
        revenue=to_float(data.get("revenue", 0)),
        revenue_n_minus_1=to_float(data.get("revenue_n_minus_1", 0)),
        ebitda=to_float(data.get("ebitda", 0)),
        ebitda_n_minus_1=to_float(data.get("ebitda_n_minus_1", 0)),
        net_income=to_float(data.get("net_income", 0)),
        net_income_n_minus_1=to_float(data.get("net_income_n_minus_1", 0)),
        equity=to_float(data.get("equity", 0)),
        total_debt=to_float(data.get("total_debt", 0)),
        cash_flow=to_float(data.get("cash_flow", 0)),
        working_capital=to_float(data.get("working_capital", 0)),
        anciennete_annees=to_float(data.get("anciennete_annees", 0)),
        secteur_activite=to_str(data.get("secteur_activite", ""), "Inconnu"),
        garanties_proposees=to_str(data.get("garanties_proposees", ""), "Aucune"),
        # Particulier
        revenus_annuels=to_float(data.get("revenus_annuels", 0)),
        charges_annuelles=to_float(data.get("charges_annuelles", 0)),
        mensualites_credits=to_float(data.get("mensualites_credits", 0)),
        epargne_estimee=to_float(data.get("epargne_estimee", 0)),
        apport_personnel=to_float(data.get("apport_personnel", 0)),
        nb_personnes_charge=to_float(data.get("nb_personnes_charge", 0)),
        situation_professionnelle=to_str(data.get("situation_professionnelle", ""), "Inconnu"),
    )


def calculate_ratios(data: FinancialData, client_type: str) -> dict:
    """Calculate key financial ratios safely to avoid division by zero."""
    is_particulier = (client_type.lower() == "particulier")

    if is_particulier:
        revenus = data.get("revenus_annuels", 0)
        charges = data.get("charges_annuelles", 0)
        # CORRECTION BUG : mensualites_credits est TOUJOURS un montant mensuel → x12
        mensualites = data.get("mensualites_credits", 0)
        epargne = data.get("epargne_estimee", 0)
        apport = data.get("apport_personnel", 0)
        nb_charges = data.get("nb_personnes_charge", 0)
        situation_pro = data.get("situation_professionnelle", "Inconnu")

        # Mensualités déjà en mensuel, on annualise proprement
        mensualites_annuelles = mensualites * 12

        # Taux d'endettement = (Charges fixes annuelles + Mensualités crédits annuelles) / Revenus annuels
        total_charges_annuelles = charges + mensualites_annuelles
        taux_endettement = (total_charges_annuelles / revenus * 100) if revenus > 0 else 0.0

        # Reste à vivre annuel (ajusté selon les personnes à charge)
        # En France : le minimum vital est ~500€/mois par enfant supplémentaire
        minimum_vital_charge = nb_charges * 6000  # 500€/mois × 12 par enfant
        reste_a_vivre = revenus - total_charges_annuelles
        reste_a_vivre_ajuste = reste_a_vivre - minimum_vital_charge

        # Taux d'apport (apport / montant demandé) calculé plus tard dans compute_credit_score
        taux_apport_percent = 0.0  # Calculé en fonction du montant demandé

        # Capacité de remboursement maximale mensuelle (norme bancaire 35%)
        capacite_remboursement_mensuelle = (revenus * 0.35 / 12) - mensualites

        return {
            "taux_endettement_personnel_percent": round(taux_endettement, 2),
            "reste_a_vivre_annuel": round(reste_a_vivre, 2),
            "reste_a_vivre_annuel_ajuste": round(reste_a_vivre_ajuste, 2),
            "mensualites_annuelles": round(mensualites_annuelles, 2),
            "total_charges_annuelles": round(total_charges_annuelles, 2),
            "capacite_remboursement_mensuelle": round(capacite_remboursement_mensuelle, 2),
            "apport_personnel": round(apport, 2),
            "nb_personnes_charge": int(nb_charges),
            "situation_professionnelle": situation_pro,
            "revenus_annuels": revenus,
            "epargne_estimee": epargne,
            "is_particulier": True
        }

    else:
        revenue = data.get("revenue", 0)
        revenue_n1 = data.get("revenue_n_minus_1", 0)
        net_income = data.get("net_income", 0)
        ebitda = data.get("ebitda", 0)
        ebitda_n1 = data.get("ebitda_n_minus_1", 0)
        equity = data.get("equity", 0)
        total_debt = data.get("total_debt", 0)
        cash_flow = data.get("cash_flow", 0)
        anciennete = data.get("anciennete_annees", 0)

        # 1. Marge Nette = Net Income / Revenue
        net_margin = (net_income / revenue * 100) if revenue > 0 else 0.0

        # 2. Marge EBITDA = EBITDA / Revenue (rentabilité opérationnelle)
        ebitda_margin = (ebitda / revenue * 100) if revenue > 0 else 0.0

        # 3. Lever financier (Debt-to-Equity) = Total Debt / Equity
        debt_to_equity = (total_debt / equity * 100) if equity > 0 else 0.0

        # 4. Ratio Debt-to-Revenue (endettement rapporté au CA)
        debt_to_revenue = (total_debt / revenue * 100) if revenue > 0 else 0.0

        # 5. Ratio Levier EBITDA = Dettes Totales / EBITDA (< 3 est sain)
        levier_ebitda = (total_debt / ebitda) if ebitda > 0 else 0.0

        # 6. DSCR — Debt Service Coverage Ratio: Cash Flow / Annuités
        # Si le total_debt est connu mais les annuités non, on estime les annuités à 15% de la dette
        annuites_estimees = total_debt * 0.15 if total_debt > 0 else 0
        dscr = (cash_flow / annuites_estimees) if annuites_estimees > 0 else 0.0

        # 7. Croissance du CA (en %)
        croissance_ca = 0.0
        if revenue_n1 > 0:
            croissance_ca = ((revenue - revenue_n1) / revenue_n1) * 100

        # 8. Croissance EBITDA (en %)
        croissance_ebitda = 0.0
        if ebitda_n1 > 0:
            croissance_ebitda = ((ebitda - ebitda_n1) / ebitda_n1) * 100

        return {
            "net_margin_percent": round(net_margin, 2),
            "ebitda_margin_percent": round(ebitda_margin, 2),
            "debt_to_equity_percent": round(debt_to_equity, 2),
            "debt_to_revenue_percent": round(debt_to_revenue, 2),
            "levier_ebitda": round(levier_ebitda, 2),
            "dscr": round(dscr, 2),
            "croissance_ca_percent": round(croissance_ca, 2),
            "croissance_ebitda_percent": round(croissance_ebitda, 2),
            "anciennete_annees": anciennete,
            "equity_is_negative": equity < 0,
            "revenue": revenue,
            "is_particulier": False
        }


def compute_credit_score(ratios: dict, client_type: str, amount: float, raw_data: FinancialData = None) -> dict:
    """
    Moteur de scoring déterministe amélioré.
    Score de base : 60 (dossier neutre). Points ajoutés/enlevés selon les règles.
    Max 100, Min 0.
    """
    import math
    # Score de base neutre à 60 (plus réaliste qu'un départ à 100)
    score = 60
    risk_factors = []
    positive_factors = []
    explainability = []
    weak_signals = []

    def apply_score(delta, risk_msg=None, pos_msg=None, label=None):
        nonlocal score
        score += delta
        if delta != 0 and label:
            explainability.append({"label": label, "impact": delta})
        if risk_msg:
            risk_factors.append(risk_msg)
        if pos_msg:
            positive_factors.append(pos_msg)

    is_particulier = ratios.get("is_particulier", False)

    # ─── RÈGLE COMMUNE : MONTANT DEMANDÉ vs CAPACITÉ ───────────────────────
    if amount > 0:
        if is_particulier:
            revenus = ratios.get("revenus_annuels", 0)
            apport = ratios.get("apport_personnel", 0)
            taux_apport = (apport / amount * 100) if amount > 0 else 0

            if revenus > 0 and amount > (revenus * 10):
                apply_score(-50, risk_msg="Montant demandé irréaliste et disproportionné (> 10 années de revenus).", label="Montant vs Revenus")
            elif revenus > 0 and amount > (revenus * 5):
                apply_score(-20, risk_msg="Montant demandé élevé par rapport aux revenus annuels (> 5 années).", label="Montant vs Revenus")

            # Apport personnel
            if taux_apport >= 20:
                apply_score(10, pos_msg=f"Apport personnel solide ({round(taux_apport, 1)}% du montant demandé ≥ 20%).", label="Apport Personnel")
            elif taux_apport >= 10:
                apply_score(3, pos_msg=f"Apport personnel satisfaisant ({round(taux_apport, 1)}%).", label="Apport Personnel")
            elif apport == 0:
                apply_score(-10, risk_msg="Aucun apport personnel détecté — augmente le risque bancaire.", label="Absence d'apport")

        else:
            revenue = ratios.get("revenue", 0)
            if revenue > 0 and amount > (revenue * 5):
                apply_score(-50, risk_msg="Montant demandé totalement déconnecté du chiffre d'affaires (> 5x le CA).", label="Montant vs CA")
            elif revenue > 0 and amount > (revenue * 2):
                apply_score(-20, risk_msg="Montant demandé très élevé par rapport au CA (> 2x le CA).", label="Montant vs CA")
            elif revenue > 0 and amount <= (revenue * 0.5):
                apply_score(5, pos_msg="Montant demandé raisonnable (< 50% du CA annuel).", label="Montant vs CA")

    # ═══════════════════════════════════════════════════════════════════════
    # ─── SCORING PARTICULIER ──────────────────────────────────────────────
    # ═══════════════════════════════════════════════════════════════════════
    if is_particulier:
        taux_endettement = ratios.get("taux_endettement_personnel_percent", 0)
        reste_a_vivre_ajuste = ratios.get("reste_a_vivre_annuel_ajuste", ratios.get("reste_a_vivre_annuel", 0))
        situation_pro = ratios.get("situation_professionnelle", "Inconnu").lower()
        nb_charges = ratios.get("nb_personnes_charge", 0)
        cap_remb = ratios.get("capacite_remboursement_mensuelle", 0)

        # RÈGLE 1 : Taux d'endettement (norme française ≤ 35%)
        if taux_endettement > 50:
            apply_score(-35, risk_msg=f"Taux d'endettement critique ({taux_endettement}% > 50%).", label="Endettement Critique")
        elif taux_endettement > 35:
            apply_score(-20, risk_msg=f"Taux d'endettement trop élevé ({taux_endettement}% > 35% recommandés).", label="Endettement Élevé")
        elif taux_endettement > 30:
            apply_score(-8, risk_msg=f"Taux d'endettement proche de la limite ({taux_endettement}%).", label="Endettement Limite")
        elif 0 < taux_endettement <= 20:
            apply_score(12, pos_msg=f"Excellent taux d'endettement ({taux_endettement}% — bien en-dessous des 35%).", label="Endettement Faible")
        elif 20 < taux_endettement <= 30:
            apply_score(5, pos_msg=f"Taux d'endettement maîtrisé ({taux_endettement}%).", label="Endettement Maîtrisé")

        # RÈGLE 2 : Reste à vivre ajusté
        seuil_rav_bas = 12000 + (nb_charges * 6000)
        seuil_rav_confortable = 24000 + (nb_charges * 6000)

        if reste_a_vivre_ajuste < seuil_rav_bas:
            apply_score(-20, risk_msg=f"Reste à vivre insuffisant après charges ({round(reste_a_vivre_ajuste, 0)}€/an).", label="Reste à vivre (RAV)")
        elif reste_a_vivre_ajuste > seuil_rav_confortable:
            apply_score(8, pos_msg=f"Reste à vivre très confortable ({round(reste_a_vivre_ajuste, 0)}€/an).", label="Reste à vivre (RAV)")
            
        # SIGNAUX FAIBLES PARTICULIER
        if taux_endettement > 30 and reste_a_vivre_ajuste < seuil_rav_bas:
            weak_signals.append("Effet de ciseaux : endettement déjà élevé combiné à un reste à vivre très faible.")
        if situation_pro in ["indépendant", "independant"] and apport == 0:
            weak_signals.append("Indépendant sans apport personnel : forte exposition aux aléas d'activité.")

        # RÈGLE 3 : Situation professionnelle
        if situation_pro in ["cdi", "fonctionnaire", "retraité", "retraite"]:
            apply_score(10, pos_msg=f"Situation professionnelle stable ({situation_pro.upper()}).", label="Stabilité Pro.")
        elif situation_pro in ["cdd", "interim", "intérim"]:
            apply_score(-8, risk_msg=f"Situation professionnelle précaire ({situation_pro.upper()}).", label="Précarité Pro.")
        elif situation_pro in ["indépendant", "independant", "auto-entrepreneur", "gérant", "gerant"]:
            apply_score(-5, risk_msg="Travailleur indépendant — variabilité des revenus à considérer.", label="Indépendant")
        elif situation_pro in ["sans emploi", "sans_emploi", "chômage", "chomage", "inconnu"]:
            apply_score(-20, risk_msg="Sans emploi ou situation professionnelle inconnue — risque très élevé.", label="Instabilité Pro.")

        # RÈGLE 4 : Capacité de remboursement pour le nouveau crédit
        if amount > 0 and cap_remb > 0:
            mensualite_estimee = amount / (20 * 12)
            if mensualite_estimee > cap_remb:
                apply_score(-15, risk_msg=f"Capacité de remboursement insuffisante (besoin ≈ {round(mensualite_estimee, 0)}€/mois vs dispo {round(cap_remb, 0)}€/mois).", label="Capacité Remb. Insuffisante")
            elif mensualite_estimee <= cap_remb * 0.7:
                apply_score(5, pos_msg="Bonne marge sur la capacité de remboursement.", label="Marge Capacité Remb.")

    # ═══════════════════════════════════════════════════════════════════════
    # ─── SCORING ENTREPRISE ───────────────────────────────────────────────
    # ═══════════════════════════════════════════════════════════════════════
    else:
        margin = ratios.get("net_margin_percent", 0)
        ebitda_margin = ratios.get("ebitda_margin_percent", 0)
        debt_ratio = ratios.get("debt_to_equity_percent", 0)
        levier = ratios.get("levier_ebitda", 0)
        dscr = ratios.get("dscr", 0)
        croissance_ca = ratios.get("croissance_ca_percent", 0)
        croissance_ebitda = ratios.get("croissance_ebitda_percent", 0)
        anciennete = ratios.get("anciennete_annees", 0)
        
        # SIGNAUX FAIBLES ENTREPRISE
        if ratios.get("equity_is_negative", False):
            weak_signals.append("Alerte continuité d'exploitation : fonds propres négatifs détectés.")
        if dscr < 1.0 and ratios.get("cash_flow", 0) > 0:
            weak_signals.append("Tensions de liquidité prévisibles : le cash-flow actuel ne couvre pas l'estimation des annuités.")
        if croissance_ca > 15 and ebitda_margin < 3:
            weak_signals.append("Croissance non rentable : forte augmentation du CA mais rentabilité d'exploitation extrêmement faible.")
        if anciennete < 3 and debt_ratio > 100:
            weak_signals.append("Alerte vulnérabilité : jeune entreprise avec un effet de levier déjà très prononcé.")

        # RÈGLE 1 : Ancienneté
        if anciennete > 0:
            if anciennete < 2:
                apply_score(-20, risk_msg=f"Entreprise très récente ({anciennete} an(s)).", label="Risque Startup")
            elif anciennete < 3:
                apply_score(-10, risk_msg=f"Entreprise jeune ({anciennete} an(s)).", label="Manque de Recul")
            elif anciennete >= 10:
                apply_score(8, pos_msg=f"Entreprise très établie ({round(anciennete, 0)} ans).", label="Maturité Établie")
            elif anciennete >= 5:
                apply_score(4, pos_msg=f"Entreprise avec bon recul ({round(anciennete, 0)} ans).", label="Bonne Maturité")

        # RÈGLE 2 : Marge Nette
        if margin < 0:
            apply_score(-25, risk_msg="Marge nette négative (déficitaire).", label="Déficit Net")
        elif margin < 3:
            apply_score(-10, risk_msg=f"Rentabilité nette très faible ({margin}% < 3%).", label="Marge Très Faible")
        elif margin < 7:
            apply_score(-3, risk_msg=f"Rentabilité nette modeste ({margin}%).", label="Marge Modeste")
        elif margin >= 15:
            apply_score(12, pos_msg=f"Excellente rentabilité nette ({margin}% > 15%).", label="Excellente Marge")
        elif margin >= 10:
            apply_score(7, pos_msg=f"Bonne rentabilité nette ({margin}%).", label="Bonne Marge")
        elif margin >= 7:
            apply_score(3, pos_msg=f"Rentabilité nette correcte ({margin}%).", label="Marge Correcte")

        # RÈGLE 3 : Marge EBITDA
        if ebitda_margin > 0:
            if ebitda_margin < 5:
                apply_score(-8, risk_msg=f"Marge EBITDA très faible ({ebitda_margin}%).", label="EBITDA Faible")
            elif ebitda_margin >= 20:
                apply_score(10, pos_msg=f"Excellente marge EBITDA ({ebitda_margin}%).", label="Excellent EBITDA")
            elif ebitda_margin >= 12:
                apply_score(5, pos_msg=f"Bonne marge EBITDA ({ebitda_margin}%).", label="Bon EBITDA")

        # RÈGLE 4 : Endettement
        if ratios.get("equity_is_negative", False):
            apply_score(-35, risk_msg="Fonds propres négatifs (surendettement technique).", label="Fonds Propres Négatifs")
        elif debt_ratio > 200:
            apply_score(-25, risk_msg=f"Endettement critique (> 200% FP : {round(debt_ratio, 0)}%).", label="Endettement Critique")
        elif debt_ratio > 100:
            apply_score(-15, risk_msg=f"Endettement très lourd (> 100% FP : {round(debt_ratio, 0)}%).", label="Endettement Élevé")
        elif debt_ratio > 50:
            apply_score(-7, risk_msg=f"Endettement significatif ({round(debt_ratio, 0)}%).", label="Endettement Significatif")
        elif 0 < debt_ratio <= 20:
            apply_score(12, pos_msg=f"Structure financière très saine ({round(debt_ratio, 0)}%).", label="Structure Saine")

        # RÈGLE 5 : DSCR
        if dscr > 0:
            if dscr < 1.0:
                apply_score(-25, risk_msg=f"DSCR critique ({round(dscr, 2)}).", label="DSCR Critique")
            elif dscr < 1.2:
                apply_score(-10, risk_msg=f"DSCR insuffisant ({round(dscr, 2)}).", label="DSCR Insuffisant")
            elif dscr >= 2.0:
                apply_score(12, pos_msg=f"DSCR excellent ({round(dscr, 2)}).", label="DSCR Excellent")
            elif dscr >= 1.5:
                apply_score(7, pos_msg=f"DSCR satisfaisant ({round(dscr, 2)}).", label="DSCR Satisfaisant")
            elif dscr >= 1.2:
                apply_score(3, pos_msg=f"DSCR acceptable ({round(dscr, 2)}).", label="DSCR Acceptable")

        # RÈGLE 6 : Levier EBITDA
        if levier > 0 and ebitda_margin > 0:
            if levier > 6:
                apply_score(-15, risk_msg=f"Levier EBITDA très élevé ({round(levier, 1)}x).", label="Levier EBITDA Critique")
            elif levier > 3:
                apply_score(-8, risk_msg=f"Levier EBITDA modéré ({round(levier, 1)}x).", label="Levier EBITDA Modéré")
            elif levier <= 1.5:
                apply_score(8, pos_msg=f"Levier EBITDA excellent ({round(levier, 1)}x).", label="Levier EBITDA Maîtrisé")

        # RÈGLE 7 & 8 : Croissance
        if ratios.get("revenue", 0) > 0 and ratios.get("croissance_ca_percent") is not None:
            if croissance_ca > 20:
                apply_score(10, pos_msg="Forte croissance du CA (+20%).", label="Hyper Croissance")
            elif croissance_ca > 5:
                apply_score(5, pos_msg="Croissance du CA positive.", label="Croissance Stable")
            elif croissance_ca < -10:
                apply_score(-15, risk_msg="Forte baisse du CA (-10%).", label="Décroissance")
            elif croissance_ca < 0:
                apply_score(-7, risk_msg="Baisse du CA.", label="Baisse CA")

        if croissance_ebitda > 10:
            apply_score(5, pos_msg="Amélioration de la rentabilité op (+10%).", label="Amélioration Op.")
        elif croissance_ebitda < -15:
            apply_score(-8, risk_msg="Détérioration de l'EBITDA (-15%).", label="Dégradation Op.")

    # ─── BORNER LE SCORE ─────────────────────────────────────────────────
    score = max(0, min(100, score))
    
    # ─── CALCUL DE LA PROBABILITÉ DE DÉFAUT (PD) A 1 AN ─────────────────
    # Formule exponentielle calibrée pour ressembler à un modèle de risque de crédit
    # score=100 -> exp(-6) * 100 ~ 0.25%
    # score=60  -> exp(-3.6) * 100 ~ 2.7%
    # score=20  -> exp(-1.2) * 100 ~ 30.1%
    try:
        pd = round(100 * math.exp(-0.06 * score), 2)
    except:
        pd = 5.0
        
    pd = max(0.1, min(99.9, pd))

    # ─── DÉCISION FINALE (5 NIVEAUX) ─────────────────────────────────────
    if score >= 85:
        decision = "Très Favorable"
        payment_reliability = "Excellent"
        account_trend = "En hausse"
    elif score >= 70:
        decision = "Favorable"
        payment_reliability = "Bon"
        account_trend = "Stable"
    elif score >= 55:
        decision = "Vigilance Modérée"
        payment_reliability = "Correct"
        account_trend = "Stable"
    elif score >= 40:
        decision = "Vigilance Renforcée"
        payment_reliability = "Risqué"
        account_trend = "En baisse"
    else:
        decision = "Défavorable"
        payment_reliability = "Très Risqué"
        account_trend = "En forte baisse"

    return {
        "score": int(score),
        "decision": decision,
        "payment_reliability": payment_reliability,
        "account_trend": account_trend,
        "technical_risks": risk_factors,
        "technical_opportunities": positive_factors,
        "explainability": explainability,
        "default_probability": pd,
        "weak_signals": list(set(weak_signals))
    }


def analyze_financials(raw_extracted_data: dict, client_info: dict) -> dict:
    """Main pipeline to run the deterministic engine."""
    client_type = client_info.get("clientType", "entreprise")
    financial_data = extract_numbers(raw_extracted_data)
    ratios = calculate_ratios(financial_data, client_type)

    amount = 0.0
    try:
        amount = float(str(client_info.get("amount", 0)).replace(" ", "").replace(",", "."))
    except (ValueError, TypeError):
        pass

    scoring_result = compute_credit_score(ratios, client_info.get("clientType", "entreprise"), amount, financial_data)

    # Combine everything to be sent to the LLM for the final interpretation phase
    return {
        "raw_numbers": financial_data,
        "ratios": ratios,
        "scoring": scoring_result
    }
