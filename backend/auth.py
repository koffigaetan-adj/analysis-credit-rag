import os
from datetime import datetime, timedelta
from typing import Optional, List
import bcrypt
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
import shutil
import uuid
from database import get_db, User

# Paramètres Sécurité & JWT (à configurer via .env en prod)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "une_cle_secrete_tres_complexe_ici_123!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 Jours

# Config Password Hashing (BCrypt)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- MODÈLES (Pydantic) ---
class LoginRequest(BaseModel):
    email: str
    password: str

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    establishment: Optional[str] = None
    password: str

class AdminUpdateUserRequest(BaseModel):
    first_name: str
    last_name: str
    establishment: Optional[str] = None
    email: str
    role: str

class AdminDeleteUserRequest(BaseModel):
    password: str

class AdminCreateUserRequest(BaseModel):
    first_name: str
    last_name: str
    establishment: Optional[str] = None
    email: str
    password: str
    role: str

# --- FONCTIONS UTILITAIRES ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password=pwd_bytes, salt=salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# -- MIDDLEWARE DE ROLE --
def check_role(allowed_roles: List[str]):
    """ Middleware pour vérifier si le rôle de l'utilisateur correspond aux permissions """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Autorisation refusée. Rôles requis: {allowed_roles}"
            )
        return current_user
    return role_checker

def check_admin_target_role(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN", "ADMIN"]))
):
    """ Middleware additionnel pour s'assurer qu'un ADMIN ne modifie/supprime pas un SUPER_ADMIN ou un autre ADMIN """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        
    if current_admin.role == "ADMIN" and target_user.role in ["SUPER_ADMIN", "ADMIN"]:
         raise HTTPException(
             status_code=403, 
             detail="Un Administrateur ne peut modifier ou supprimer que les comptes Analystes."
         )
         
    return target_user

# --- ROUTES ---

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Recherche Utilisateur
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )
        
    # Vérification du statut Inactif
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre compte a été désactivé. Veuillez contacter un administrateur."
        )
        
    # 2. Vérification Mot de passe
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    # 3. Génération JWT
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "is_first_login": user.is_first_login,
        "user_info": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "establishment": user.establishment,
            "role": user.role,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active
        }
    }

@router.post("/update-password")
def update_password(
    request: UpdatePasswordRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Vérifie l'ancien MDP
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="L'ancien mot de passe est incorrect.")
        
    # 2. Hachage du nouveau MDP
    new_hashed_password = get_password_hash(request.new_password)
    current_user.password_hash = new_hashed_password
    current_user.is_first_login = False
    
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès."}

@router.put("/profile")
def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Vérification du mot de passe
    if not verify_password(request.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect. Les modifications ont été annulées.")

    # Vérifie si l'email est déjà pris par un autre utilisateur
    if request.email != current_user.email:
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
            
    # Vérification des permissions pour l'email
    if request.email != current_user.email and current_user.role == "ANALYST":
         raise HTTPException(status_code=403, detail="Un analyste ne peut pas modifier son adresse email. Contactez un administrateur.")

    # Restreindre les analystes sur le nom complet
    if current_user.role == "ANALYST":
        if request.first_name != current_user.first_name or request.last_name != current_user.last_name:
            raise HTTPException(status_code=403, detail="Un analyste ne peut pas modifier son nom. Contactez un administrateur.")
        if request.establishment and request.establishment != current_user.establishment:
            raise HTTPException(status_code=403, detail="Un analyste ne peut pas modifier son établissement. Contactez un administrateur.")
    
    current_user.first_name = request.first_name
    current_user.last_name = request.last_name
    current_user.email = request.email
    
    if current_user.role == "SUPER_ADMIN" and request.establishment is not None:
        current_user.establishment = request.establishment
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profil mis à jour",
        "user_info": {
            "id": current_user.id,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "establishment": current_user.establishment,
            "role": current_user.role,
            "email": current_user.email,
            "avatar_url": current_user.avatar_url
        }
    }

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Sécuriser l'extension et le nom
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
         raise HTTPException(status_code=400, detail="Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.")
    
    # Créer un nom de fichier unique sécurisé
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    os.makedirs("uploads/avatars", exist_ok=True)
    file_path = os.path.join("uploads/avatars", filename)

    # Sauvegarder sur le disque
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Convertir en chemin relatif web pour l'accès (en supposant que main.py serve ce dossier statiquement)
    avatar_url = f"/uploads/avatars/{filename}"

    # Supprimer l'ancien avatar s'il y en a un pour éviter la surcharge locale
    if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/"):
        old_file_path = current_user.avatar_url.lstrip("/")
        if os.path.exists(old_file_path):
             os.remove(old_file_path)

    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)

    return {
         "message": "Avatar mis à jour",
         "avatar_url": current_user.avatar_url
    }

# --- ROUTES D'ADMINISTRATION (GESTION DES UTILISATEURS) ---

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["SUPER_ADMIN", "ADMIN"]))
):
    users = db.query(User).all()
    
    # Filtrer les utilisateurs selon le rôle de l'appelant
    if current_user.role == "ADMIN":
        users = [u for u in users if u.role != "SUPER_ADMIN"]

    # On renvoie les données sans le mot de passe
    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "establishment": u.establishment,
            "email": u.email,
            "role": u.role,
            "avatar_url": u.avatar_url,
            "created_at": u.created_at,
            "is_first_login": u.is_first_login,
            "is_active": u.is_active
        } for u in users
    ]

@router.post("/users")
def admin_create_user(
    request: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN", "ADMIN"]))
):
    # Restriction création
    if current_admin.role == "ADMIN" and request.role != "ANALYST":
        raise HTTPException(status_code=403, detail="Un Administrateur ne peut créer que des Analystes.")
    
    # Vérification email
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
        
    new_user = User(
        id=str(uuid.uuid4()),
        first_name=request.first_name,
        last_name=request.last_name,
        establishment=request.establishment,
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=request.role,
        is_first_login=True # Force la modif de mot de passe à la première co
    )
    db.add(new_user)
    db.commit()

    # --- SIMULATION ENVOI EMAIL ---
    print("\n" + "="*50)
    print("📧 SIMULATION D'ENVOI D'EMAIL")
    print(f"Destinataire : {request.email}")
    print(f"Objet : Bienvenue chez Kaïs - Vos accès {request.role}")
    print("-" * 50)
    print(f"Bonjour {request.first_name} {request.last_name},")
    print("\nVous avez été invité(e) à rejoindre l'espace d'analyse Kaïs.")
    print("Voici vos identifiants de connexion provisoires :")
    print(f"Email : {request.email}")
    print(f"Mot de passe temporaire : {request.password}")
    print("\nLors de votre première connexion, vous serez invité(e) à modifier ce mot de passe.")
    print("\nCordialement,")
    print("L'équipe Kaïs")
    print("="*50 + "\n")

    return {"message": "Utilisateur créé avec succès. Un email contenant les accès a été envoyé."}

@router.put("/users/{user_id}")
def admin_update_user(
    user_id: str,
    request: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN", "ADMIN"])),
    target_user: User = Depends(check_admin_target_role) # Le middleware bloque si un admin tente d'accéder à un autre admin
):
    # Seul un SUPER_ADMIN peut modifier un autre SUPER_ADMIN ou nommer quelqu'un SUPER_ADMIN
    if target_user.role == "SUPER_ADMIN" and request.role != "SUPER_ADMIN":
         raise HTTPException(status_code=403, detail="Le rôle d'un Super Administrateur ne peut pas être rétrogradé.")
    
    # Correction : On permet à tout Admin de mettre à jour sauf vers SUPER_ADMIN ou ADMIN (si l'appelant est seulement ADMIN)
    if request.role in ["SUPER_ADMIN", "ADMIN"] and current_admin.role != "SUPER_ADMIN":
         raise HTTPException(status_code=403, detail="Seul un Super Administrateur peut accorder ces rôles.")

    # Vérification email s'il change
    if request.email != target_user.email:
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
             raise HTTPException(status_code=400, detail="Cet email est déjà utilisé par un autre compte.")

    # On ignore la mise à jour par l'utilisateur courant de son propre rôle s'il n'est pas SUPER_ADMIN
    if current_admin.id == target_user.id and current_admin.role != "SUPER_ADMIN" and request.role != target_user.role:
        pass # Optional warning ou juste on ignore pour ne pas qu'un ADMIN se déclasse
    else:
        target_user.role = request.role
        
    target_user.first_name = request.first_name
    target_user.last_name = request.last_name
    
    if current_admin.role == "SUPER_ADMIN" and request.establishment is not None:
        target_user.establishment = request.establishment
        
    target_user.email = request.email
    db.commit()

    return {"message": "Utilisateur mis à jour avec succès."}

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: str,
    request: AdminDeleteUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN", "ADMIN"])),
    target_user: User = Depends(check_admin_target_role) # Le middleware s'occupe de la restriction Admin -> Analyst
):
    # Sécurité par mot de passe obligatoire
    if not verify_password(request.password, current_admin.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe administrateur incorrect. Action annulée.")

    # Empêcher l'auto-suppression
    if target_user.id == current_admin.id:
         raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte ici.")

    # Seul un SUPER_ADMIN peut supprimer un SUPER_ADMIN
    if target_user.role == "SUPER_ADMIN" and current_admin.role != "SUPER_ADMIN":
         raise HTTPException(status_code=403, detail="Vous n'avez pas l'autorisation de supprimer un Super Administrateur.")

    db.delete(target_user)
    db.commit()
    
    return {"message": "Utilisateur supprimé de manière définitive."}

@router.put("/users/{user_id}/toggle-status")
def admin_toggle_user_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN", "ADMIN"])),
    target_user: User = Depends(check_admin_target_role) # Middleware gère la hiérarchie
):
    if target_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas désactiver votre propre compte.")

    if target_user.role == "SUPER_ADMIN":
         raise HTTPException(status_code=403, detail="Le compte d'un Super Administrateur ne peut pas être désactivé.")

    target_user.is_active = not target_user.is_active
    db.commit()
    
    status_str = "activé" if target_user.is_active else "désactivé"
    return {"message": f"Le compte a été {status_str} avec succès.", "is_active": target_user.is_active}
