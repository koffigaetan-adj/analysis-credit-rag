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
    # --- Champs Particulier ---
    revenus_annuels: float
    charges_annuelles: float
    mensualites_credits: float
    epargne_estimee: float

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
            
    return FinancialData(
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
        revenus_annuels=to_float(data.get("revenus_annuels", 0)),
        charges_annuelles=to_float(data.get("charges_annuelles", 0)),
        mensualites_credits=to_float(data.get("mensualites_credits", 0)),
        epargne_estimee=to_float(data.get("epargne_estimee", 0))
    )

def calculate_ratios(data: FinancialData, client_type: str) -> dict:
    """Calculate key financial ratios safely to avoid division by zero."""
    is_particulier = (client_type.lower() == "particulier")
    
    if is_particulier:
        revenus = data.get("revenus_annuels", 0)
        charges = data.get("charges_annuelles", 0)
        mensualites = data.get("mensualites_credits", 0)
        
        # Taux d'endettement = (Mensualités + Charges d'habitation) / Revenus
        total_charges_annuelles = charges + (mensualites * 12) if mensualites < revenus else charges + mensualites 
        # Reste à vivre annuel
        reste_a_vivre = revenus - total_charges_annuelles
        
        taux_endettement = (total_charges_annuelles / revenus * 100) if revenus > 0 else 0.0
        
        return {
            "taux_endettement_personnel_percent": round(taux_endettement, 2),
            "reste_a_vivre_annuel": round(reste_a_vivre, 2),
            "revenus_annuels": revenus,
            "is_particulier": True
        }
    
    else:
        revenue = data.get("revenue", 0)
        net_income = data.get("net_income", 0)
        equity = data.get("equity", 0)
        total_debt = data.get("total_debt", 0)
        
        # 1. Net Margin (Marge Nette) = Net Income / Revenue
        net_margin = (net_income / revenue * 100) if revenue > 0 else 0.0
        
        # 2. Debt-to-Equity (Taux d'endettement) = Total Debt / Equity
        debt_to_equity = (total_debt / equity * 100) if equity > 0 else 0.0
        
        # 3. Debt-to-Revenue
        debt_to_revenue = (total_debt / revenue * 100) if revenue > 0 else 0.0

        return {
            "net_margin_percent": round(net_margin, 2),
            "debt_to_equity_percent": round(debt_to_equity, 2),
            "debt_to_revenue_percent": round(debt_to_revenue, 2),
            "equity_is_negative": equity < 0,
            "revenue": revenue,
            "is_particulier": False
        }

def compute_credit_score(ratios: dict, client_type: str, amount: float) -> dict:
    """
    Deterministic scoring engine based on calculated financial ratios.
    Starts at 100 points and subtracts/adds basic business rules.
    """
    score = 100
    risk_factors = []
    positive_factors = []
    
    is_particulier = ratios.get("is_particulier", False)

    if amount > 0:
        if is_particulier:
            revenus = ratios.get("revenus_annuels", 0)
            if revenus > 0 and amount > (revenus * 10):
                score -= 50
                risk_factors.append(f"Montant demandé irréaliste et disproportionné (> 10 années de revenus).")
            elif revenus > 0 and amount > (revenus * 5):
                score -= 20
                risk_factors.append(f"Montant demandé élevé par rapport aux revenus annuels (> 5 années).")
        else:
            revenue = ratios.get("revenue", 0)
            if revenue > 0 and amount > (revenue * 5):
                score -= 50
                risk_factors.append(f"Montant demandé totalement déconnecté du chiffre d'affaires (> 5x le CA).")
            elif revenue > 0 and amount > (revenue * 2):
                score -= 20
                risk_factors.append(f"Montant demandé très élevé par rapport au CA (> 2x le CA).")

    if is_particulier:
        taux_endettement = ratios.get("taux_endettement_personnel_percent", 0)
        
        if taux_endettement > 50:
            score -= 60
            risk_factors.append(f"Taux d'endettement critique ({taux_endettement}% > 50%).")
        elif taux_endettement > 35:
            score -= 30
            risk_factors.append(f"Taux d'endettement trop élevé ({taux_endettement}% > 33% recommandés).")
        elif taux_endettement > 30:
            score -= 10
            risk_factors.append(f"Taux d'endettement proche de la limite ({taux_endettement}%).")
        elif taux_endettement < 20 and taux_endettement > 0:
            score += 10
            positive_factors.append(f"Faible taux d'endettement ({taux_endettement}%).")
            
        reste_a_vivre = ratios.get("reste_a_vivre_annuel", 0)
        if reste_a_vivre < 12000: # Reste à vivre annuel < 1000/mois
            score -= 20
            risk_factors.append(f"Reste à vivre annuel insuffisant ({reste_a_vivre}€, soit < 1000€/mois).")
        elif reste_a_vivre > 24000:
            score += 10
            positive_factors.append(f"Reste à vivre très confortable ({reste_a_vivre}€).")

    else:
        # Logique Entreprise
        margin = ratios.get("net_margin_percent", 0)
        debt_ratio = ratios.get("debt_to_equity_percent", 0)
        
        # Règle 1 : Marge Nette (Rentabilité)
        if margin < 0:
            score -= 30
            risk_factors.append("Marge nette négative (entreprise déficitaire).")
        elif margin < 3:
            score -= 10
            risk_factors.append("Rentabilité faible (< 3%).")
        elif margin >= 10:
            score += 5
            positive_factors.append("Excellente rentabilité (Marge nette > 10%).")
            
        # Règle 2 : Endettement
        if ratios.get("equity_is_negative", False):
            score -= 40
            risk_factors.append("Fonds propres négatifs (risque de faillite élevé).")
        elif debt_ratio > 100:
            score -= 20
            risk_factors.append("Endettement critique (>100% des capitaux propres).")
        elif debt_ratio > 50:
            score -= 10
            risk_factors.append("Endettement significatif (>50% des capitaux propres).")
        elif debt_ratio < 20 and debt_ratio > 0:
            score += 10
            positive_factors.append("Structure financière très saine (Faible endettement).")
        
    # Borner le score
    score = max(0, min(100, score))
    
    # Décision finale
    if score >= 70:
        decision = "Favorable"
        payment_reliability = "Excellent" if score >= 85 else "Bon"
        account_trend = "Stable"
    elif score >= 50:
        decision = "Vigilance"
        payment_reliability = "Moyen"
        account_trend = "Stable"
    else:
        decision = "Défavorable"
        payment_reliability = "Risqué"
        account_trend = "En baisse"
        
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
        
    scoring_result = compute_credit_score(ratios, client_info.get("clientType", "entreprise"), amount)
    
    # Combine everything to be sent to the LLM for the final interpretation phase
    return {
        "raw_numbers": financial_data,
        "ratios": ratios,
        "scoring": scoring_result
    }
