with open('auth.py', 'r', encoding='utf-8') as f:
    content = f.read()

broken_code = """    if req.name and req.name != est.name:
        existing = db.query(Establishment).filter(Establishment.name == req.name).first()
        if existing:
):
"""

fixed_code = """    if req.name and req.name != est.name:
        existing = db.query(Establishment).filter(Establishment.name == req.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ce nom d'établissement est déjà utilisé.")
        est.name = req.name
        
    if req.address is not None:
        est.address = req.address
    if req.status is not None:
        est.status = req.status
        
    db.commit()
    return {"message": "Établissement mis à jour avec succès."}

# --- BACKOFFICE USER MANAGEMENT ---
@router.get("/backoffice/users")
def get_backoffice_users(
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "establishment": u.establishment,
        "status": "active" if u.is_active else "inactive",
        "created_at": u.created_at
    } for u in users]

@router.put("/backoffice/users/{user_id}")
def update_backoffice_user(
    user_id: str,
    req: AdminCreateUserRequest, 
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        
    user.first_name = req.first_name
    user.last_name = req.last_name
    user.role = req.role
    user.establishment = req.establishment
    if req.email != user.email:
         existing = db.query(User).filter(User.email == req.email).first()
         if existing:
              raise HTTPException(status_code=400, detail="Email déjà utilisé")
         user.email = req.email
         
    db.commit()
    return {"message": "Utilisateur mis à jour."}

@router.put("/backoffice/users/{user_id}/toggle-status")
def toggle_backoffice_user_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        
    user.is_active = not user.is_active
    db.commit()
    return {"message": "Statut modifié"}

@router.post("/account-requests/{request_id}/reject")
def reject_request_endpoint(
    request_id: int,
    rejection: RejectAccountRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN"]))
):
"""

# Fixing Windows line endings issues inside python strings
if "\r\n" in content:
    broken_code = broken_code.replace("\n", "\r\n")

new_content = content.replace(broken_code, fixed_code)

if content == new_content:
    print("FAILED TO REPLACE")
else:
    with open('auth.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
