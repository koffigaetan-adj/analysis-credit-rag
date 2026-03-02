import typing

class FinancialData(typing.TypedDict, total=False):
    revenue: float
    net_income: float
    equity: float
    total_debt: float
    cash_flow: float
    working_capital: float

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
        net_income=to_float(data.get("net_income", 0)),
        equity=to_float(data.get("equity", 0)),
        total_debt=to_float(data.get("total_debt", 0)),
        cash_flow=to_float(data.get("cash_flow", 0)),
        working_capital=to_float(data.get("working_capital", 0))
    )

def calculate_ratios(data: FinancialData) -> dict:
    """Calculate key financial ratios safely to avoid division by zero."""
    revenue = data["revenue"]
    net_income = data["net_income"]
    equity = data["equity"]
    total_debt = data["total_debt"]
    
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
        "equity_is_negative": equity < 0
    }

def compute_credit_score(ratios: dict, client_type: str, amount: float) -> dict:
    """
    Deterministic scoring engine based on calculated financial ratios.
    Starts at 100 points and subtracts/adds basic business rules.
    """
    score = 100
    risk_factors = []
    positive_factors = []
    
    margin = ratios["net_margin_percent"]
    debt_ratio = ratios["debt_to_equity_percent"]
    
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
    if ratios["equity_is_negative"]:
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
        
    # Règle 3 : type de client & montant
    if client_type == "particulier":
        # Pour simplifier s'il manque des données pro pour un particulier
        score = min(100, max(0, score))
        
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
    financial_data = extract_numbers(raw_extracted_data)
    ratios = calculate_ratios(financial_data)
    
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
