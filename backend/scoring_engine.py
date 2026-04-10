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
    # Score de base neutre à 60 (plus réaliste qu'un départ à 100)
    score = 60
    risk_factors = []
    positive_factors = []

    is_particulier = ratios.get("is_particulier", False)

    # ─── RÈGLE COMMUNE : MONTANT DEMANDÉ vs CAPACITÉ ───────────────────────
    if amount > 0:
        if is_particulier:
            revenus = ratios.get("revenus_annuels", 0)
            apport = ratios.get("apport_personnel", 0)
            taux_apport = (apport / amount * 100) if amount > 0 else 0

            if revenus > 0 and amount > (revenus * 10):
                score -= 50
                risk_factors.append(f"Montant demandé irréaliste et disproportionné (> 10 années de revenus).")
            elif revenus > 0 and amount > (revenus * 5):
                score -= 20
                risk_factors.append(f"Montant demandé élevé par rapport aux revenus annuels (> 5 années).")

            # Apport personnel
            if taux_apport >= 20:
                score += 10
                positive_factors.append(f"Apport personnel solide ({round(taux_apport, 1)}% du montant demandé ≥ 20%).")
            elif taux_apport >= 10:
                score += 3
                positive_factors.append(f"Apport personnel satisfaisant ({round(taux_apport, 1)}%).")
            elif apport == 0:
                score -= 10
                risk_factors.append("Aucun apport personnel détecté — augmente le risque bancaire.")

        else:
            revenue = ratios.get("revenue", 0)
            if revenue > 0 and amount > (revenue * 5):
                score -= 50
                risk_factors.append(f"Montant demandé totalement déconnecté du chiffre d'affaires (> 5x le CA).")
            elif revenue > 0 and amount > (revenue * 2):
                score -= 20
                risk_factors.append(f"Montant demandé très élevé par rapport au CA (> 2x le CA).")
            elif revenue > 0 and amount <= (revenue * 0.5):
                score += 5
                positive_factors.append(f"Montant demandé raisonnable (< 50% du CA annuel).")

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
            score -= 35
            risk_factors.append(f"Taux d'endettement critique ({taux_endettement}% > 50%).")
        elif taux_endettement > 35:
            score -= 20
            risk_factors.append(f"Taux d'endettement trop élevé ({taux_endettement}% > 35% recommandés).")
        elif taux_endettement > 30:
            score -= 8
            risk_factors.append(f"Taux d'endettement proche de la limite ({taux_endettement}%).")
        elif 0 < taux_endettement <= 20:
            score += 12
            positive_factors.append(f"Excellent taux d'endettement ({taux_endettement}% — bien en-dessous des 35%).")
        elif 20 < taux_endettement <= 30:
            score += 5
            positive_factors.append(f"Taux d'endettement maîtrisé ({taux_endettement}%).")

        # RÈGLE 2 : Reste à vivre ajusté (après personnes à charge)
        seuil_rav_bas = 12000 + (nb_charges * 6000)  # 1000€/mois + 500€/enfant
        seuil_rav_confortable = 24000 + (nb_charges * 6000)

        if reste_a_vivre_ajuste < seuil_rav_bas:
            score -= 20
            risk_factors.append(f"Reste à vivre insuffisant après charges et personnes à charge ({round(reste_a_vivre_ajuste, 0)}€/an).")
        elif reste_a_vivre_ajuste > seuil_rav_confortable:
            score += 8
            positive_factors.append(f"Reste à vivre très confortable ({round(reste_a_vivre_ajuste, 0)}€/an).")

        # RÈGLE 3 : Situation professionnelle
        if situation_pro in ["cdi", "fonctionnaire", "retraité", "retraite"]:
            score += 10
            positive_factors.append(f"Situation professionnelle stable ({situation_pro.upper()}).")
        elif situation_pro in ["cdd", "interim", "intérim"]:
            score -= 8
            risk_factors.append(f"Situation professionnelle précaire ({situation_pro.upper()}) — revenus non garantis à long terme.")
        elif situation_pro in ["indépendant", "independant", "auto-entrepreneur", "gérant", "gerant"]:
            score -= 5
            risk_factors.append(f"Travailleur indépendant — variabilité des revenus à considérer.")
        elif situation_pro in ["sans emploi", "sans_emploi", "chômage", "chomage", "inconnu"]:
            score -= 20
            risk_factors.append(f"Sans emploi ou situation professionnelle inconnue — risque de remboursement très élevé.")

        # RÈGLE 4 : Capacité de remboursement pour le nouveau crédit
        if amount > 0 and cap_remb > 0:
            # Mensualité estimée du nouveau crédit (sur 20 ans par défaut)
            mensualite_estimee = amount / (20 * 12)
            if mensualite_estimee > cap_remb:
                score -= 15
                risk_factors.append(
                    f"Capacité de remboursement insuffisante. "
                    f"Mensualité estimée ≈ {round(mensualite_estimee, 0)}€/mois vs capacité restante de {round(cap_remb, 0)}€/mois."
                )
            elif mensualite_estimee <= cap_remb * 0.7:
                score += 5
                positive_factors.append(
                    f"Bonne capacité de remboursement — mensualité estimée couvre largement la marge disponible."
                )

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

        # RÈGLE 1 : Ancienneté (risque startup)
        if anciennete > 0:
            if anciennete < 2:
                score -= 20
                risk_factors.append(f"Entreprise très récente ({anciennete} an(s)) — risque startup élevé (moins de 2 ans d'existence).")
            elif anciennete < 3:
                score -= 10
                risk_factors.append(f"Entreprise jeune ({anciennete} an(s)) — manque de recul sur la pérennité.")
            elif anciennete >= 10:
                score += 8
                positive_factors.append(f"Entreprise établie et mature ({round(anciennete, 0)} ans d'existence).")
            elif anciennete >= 5:
                score += 4
                positive_factors.append(f"Entreprise avec un bon recul ({round(anciennete, 0)} ans d'existence).")

        # RÈGLE 2 : Marge Nette (Rentabilité)
        if margin < 0:
            score -= 25
            risk_factors.append("Marge nette négative — l'entreprise est déficitaire sur cet exercice.")
        elif margin < 3:
            score -= 10
            risk_factors.append(f"Rentabilité nette très faible ({margin}% < 3%).")
        elif margin < 7:
            score -= 3
            risk_factors.append(f"Rentabilité nette modeste ({margin}%).")
        elif margin >= 15:
            score += 12
            positive_factors.append(f"Excellente rentabilité nette ({margin}% > 15%).")
        elif margin >= 10:
            score += 7
            positive_factors.append(f"Bonne rentabilité nette ({margin}%).")
        elif margin >= 7:
            score += 3
            positive_factors.append(f"Rentabilité nette correcte ({margin}%).")

        # RÈGLE 3 : Marge EBITDA (rentabilité opérationnelle)
        if ebitda_margin > 0:
            if ebitda_margin < 5:
                score -= 8
                risk_factors.append(f"Marge EBITDA très faible ({ebitda_margin}%) — faible rentabilité opérationnelle.")
            elif ebitda_margin >= 20:
                score += 10
                positive_factors.append(f"Excellente marge EBITDA ({ebitda_margin}%) — forte capacité d'autofinancement.")
            elif ebitda_margin >= 12:
                score += 5
                positive_factors.append(f"Bonne marge EBITDA ({ebitda_margin}%).")

        # RÈGLE 4 : Endettement (Debt-to-Equity)
        if ratios.get("equity_is_negative", False):
            score -= 35
            risk_factors.append("Fonds propres négatifs — risque de faillite élevé, situation de surendettement structurel.")
        elif debt_ratio > 200:
            score -= 25
            risk_factors.append(f"Endettement extrêmement critique (> 200% des fonds propres : {round(debt_ratio, 0)}%).")
        elif debt_ratio > 100:
            score -= 15
            risk_factors.append(f"Endettement critique (> 100% des capitaux propres : {round(debt_ratio, 0)}%).")
        elif debt_ratio > 50:
            score -= 7
            risk_factors.append(f"Endettement significatif ({round(debt_ratio, 0)}% des capitaux propres).")
        elif 0 < debt_ratio <= 20:
            score += 12
            positive_factors.append(f"Structure financière très saine — faible endettement ({round(debt_ratio, 0)}% des fonds propres).")

        # RÈGLE 5 : DSCR (Debt Service Coverage Ratio)
        if dscr > 0:
            if dscr < 1.0:
                score -= 25
                risk_factors.append(f"DSCR critique ({round(dscr, 2)}) — le cash flow ne couvre pas les annuités de dette (< 1.0).")
            elif dscr < 1.2:
                score -= 10
                risk_factors.append(f"DSCR insuffisant ({round(dscr, 2)}) — couverture de la dette trop juste (seuil : 1.2).")
            elif dscr >= 2.0:
                score += 12
                positive_factors.append(f"DSCR excellent ({round(dscr, 2)}) — très bonne capacité à couvrir la dette.")
            elif dscr >= 1.5:
                score += 7
                positive_factors.append(f"DSCR satisfaisant ({round(dscr, 2)}) — bonne couverture de la dette.")
            elif dscr >= 1.2:
                score += 3
                positive_factors.append(f"DSCR acceptable ({round(dscr, 2)}).")

        # RÈGLE 6 : Levier EBITDA (Dettes / EBITDA — < 3 est sain)
        if levier > 0 and ebitda_margin > 0:
            if levier > 6:
                score -= 15
                risk_factors.append(f"Levier EBITDA extrêmement élevé ({round(levier, 1)}x) — dette très difficile à rembourser avec l'EBITDA actuel.")
            elif levier > 3:
                score -= 8
                risk_factors.append(f"Levier EBITDA élevé ({round(levier, 1)}x > 3.0) — endettement relativement lourd.")
            elif levier <= 1.5:
                score += 8
                positive_factors.append(f"Levier EBITDA excellent ({round(levier, 1)}x ≤ 1.5) — dette très bien maîtrisée.")

        # RÈGLE 7 : Croissance du CA
        if ratios.get("revenue", 0) > 0 and ratios.get("croissance_ca_percent") is not None:
            if croissance_ca > 20:
                score += 10
                positive_factors.append(f"Forte croissance du chiffre d'affaires (+{round(croissance_ca, 1)}% vs N-1).")
            elif croissance_ca > 5:
                score += 5
                positive_factors.append(f"Croissance du CA positive (+{round(croissance_ca, 1)}% vs N-1).")
            elif croissance_ca < -10:
                score -= 15
                risk_factors.append(f"Forte baisse du chiffre d'affaires ({round(croissance_ca, 1)}% vs N-1) — tendance préoccupante.")
            elif croissance_ca < 0:
                score -= 7
                risk_factors.append(f"Baisse du chiffre d'affaires ({round(croissance_ca, 1)}% vs N-1).")

        # RÈGLE 8 : Croissance de l'EBITDA
        if croissance_ebitda > 10:
            score += 5
            positive_factors.append(f"Amélioration de la rentabilité opérationnelle (EBITDA +{round(croissance_ebitda, 1)}%).")
        elif croissance_ebitda < -15:
            score -= 8
            risk_factors.append(f"Détérioration de l'EBITDA ({round(croissance_ebitda, 1)}%) — dégradation de la rentabilité opérationnelle.")

    # ─── BORNER LE SCORE ─────────────────────────────────────────────────
    score = max(0, min(100, score))

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
        "score": score,
        "decision": decision,
        "payment_reliability": payment_reliability,
        "account_trend": account_trend,
        "technical_risks": risk_factors,
        "technical_opportunities": positive_factors
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
