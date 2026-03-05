import os
from datetime import datetime, timedelta
from typing import Optional, List
import bcrypt
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
import shutil
import uuid
import random
from database import get_db, User, AccountRequest, Notification, PasswordResetCode
from email_service import send_email_sync

# Paramètres Sécurité & JWT (à configurer via .env en prod)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "une_cle_secrete_tres_complexe_ici_123!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 Jours

# Config Password Hashing (BCrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- MODÈLES (Pydantic) ---
class LoginRequest(BaseModel):
    email: str
    password: str

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    first_name: str
    last_name: str
    sexe: str = "M"
    poste: str = "Data Analyst"
    email: str
    establishment: Optional[str] = None
    password: str

class AdminUpdateUserRequest(BaseModel):
    first_name: str
    last_name: str
    sexe: str = "M"
    poste: str = "Data Analyst"
    establishment: Optional[str] = None
    email: str
    role: str

class AdminDeleteUserRequest(BaseModel):
    password: str

class AdminCreateUserRequest(BaseModel):
    first_name: str
    last_name: str
    sexe: str = "M"
    poste: str = "Data Analyst"
    establishment: Optional[str] = None
    email: str
    password: str
    role: str

class CreateAccountRequest(BaseModel):
    first_name: str
    last_name: str
    sexe: str = "M"
    email: str
    poste: str = "Data Analyst"

class ApproveAccountRequest(BaseModel):
    establishment: str
    role: str
    password: str

class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "INFO"

# --- FONCTIONS UTILITAIRES ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Tente d'abord avec passlib (ancienne version)
        return pwd_context.verify(plain_password, hashed_password)
    except:
        # Fallback bcrypt brut si passlib échoue
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except:
            return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

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

# --- FONCTIONS UTILITAIRES POUR EMAIL ---
def parse_user_agent(ua_string: str) -> str:
    ua_lower = ua_string.lower()
    device = "Inconnu"
    if "windows" in ua_lower: device = "PC Windows"
    elif "macintosh" in ua_lower or "mac os" in ua_lower: device = "Mac"
    elif "linux" in ua_lower: device = "Linux"
    elif "iphone" in ua_lower: device = "iPhone"
    elif "ipad" in ua_lower: device = "iPad"
    elif "android" in ua_lower: device = "Smartphone Android"
    
    browser = "Navigateur web"
    if "edg" in ua_lower: browser = "Edge"
    elif "chrome" in ua_lower: browser = "Chrome"
    elif "firefox" in ua_lower: browser = "Firefox"
    elif "safari" in ua_lower and "chrome" not in ua_lower: browser = "Safari"
    
    return f"{device} (via {browser})"

def get_location_from_ip(ip: str) -> str:
    if not ip or ip in ["127.0.0.1", "localhost", "0.0.0.0", "Inconnue"]:
        return "Position inconnue (Réseau local)"
    try:
        import urllib.request
        import json
        with urllib.request.urlopen(f"http://ip-api.com/json/{ip}?lang=fr", timeout=2) as url:
            data = json.loads(url.read().decode())
            if data and data.get("status") == "success":
                return f"{data.get('city', '')}, {data.get('country', '')}".strip(" ,")
    except Exception:
        pass
    return "Position non identifiable"

def send_login_alert_async(user_email: str, first_name: str, last_name: str, ip_address: str, user_agent: str, login_time: str):
    device_info = parse_user_agent(user_agent)
    location = get_location_from_ip(ip_address)
    
    login_html = f"""
    <h3>Nouvelle connexion à votre compte</h3>
    <p>Bonjour <b>{first_name} {last_name}</b>,</p>
    <p>Une nouvelle connexion a été détectée sur votre compte Kaïs Analytics :</p>
    <ul>
      <li><strong>Appareil :</strong> {device_info}</li>
      <li><strong>Localisation :</strong> {location}</li>
      <li><strong>Date et Heure :</strong> {login_time}</li>
    </ul>
    <p style="color: #ef4444; font-weight: bold; margin-top: 20px;">Si vous n'êtes pas à l'origine de cette connexion :</p>
    <p>Veuillez <a href="{os.getenv('FRONTEND_URL', 'https://kais-analytics.netlify.app')}" style="color: #2563eb; font-weight: bold;">cliquer ici pour vous rendre sur l'application</a> et utiliser la fonction "Mot de passe oublié" pour réinitialiser vos accès immédiatement.</p>
    """
    from email_service import send_email_sync
    send_email_sync(user_email, "Kaïs Analytics - Nouvelle connexion détectée", login_html)

# --- ROUTES ---

@router.post("/login")
def login(request: Request, login_req: LoginRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Recherche Utilisateur
    user = db.query(User).filter(User.email == login_req.email).first()
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
    if not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    # 3. Génération JWT
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    
    # 4. Envoi de l'alerte de connexion
    ip_address = request.client.host if request.client else "Inconnue"
    # Reverse proxy fallback
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()

    user_agent = request.headers.get("user-agent", "Inconnu")
    login_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    background_tasks.add_task(send_login_alert_async, user.email, user.first_name, user.last_name, ip_address, user_agent, login_time)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "is_first_login": user.is_first_login,
        "user_info": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "sexe": user.sexe,
            "poste": user.poste,
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Vérifie l'ancien MDP
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="L'ancien mot de passe est incorrect.")
        
    # 2. Hachage du nouveau MDP
    current_user.password_hash = get_password_hash(request.new_password)
    current_user.is_first_login = False
    
    # Create notification for password change
    password_notif = Notification(
        user_id=current_user.id,
        title="Sécurité du compte",
        message="Votre mot de passe a été modifié avec succès.",
        type="INFO"
    )
    db.add(password_notif)
    
    db.commit()
    
    # Send email notification
    pwd_change_html = f"""
    <h3>Modification de mot de passe</h3>
    <p>Bonjour <b>{current_user.first_name}</b>,</p>
    <p>Le mot de passe de votre compte Kaïs Analytics vient d'être modifié avec succès depuis vos paramètres.</p>
    <p>Si vous êtes à l'origine de cette action, vous pouvez ignorer cet email.</p>
    <p style="color: #ef4444; font-weight: bold;">Si ce n'est pas vous :</p>
    <p>Veuillez utiliser la fonction "Mot de passe oublié" sur l'écran de connexion pour sécuriser votre compte immédiatement.</p>
    """
    background_tasks.add_task(send_email_sync, current_user.email, "Kaïs Analytics - Mot de passe modifié", pwd_change_html)
    
    return {"message": "Mot de passe mis à jour avec succès."}

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Prevent email enumeration by returning success anyway
        return {"message": "Si l'adresse email existe, un code de réinitialisation a été envoyé."}
        
    # Generate 6 digit code
    code = f"{random.randint(0, 999999):06d}"
    
    # Save code to DB
    reset_code = PasswordResetCode(
        email=user.email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(reset_code)
    db.commit()
    
    html_content = f"""
    <html>
      <body>
        Bonjour <b>{user.first_name} {user.last_name}</b>,
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur Kaïs Analytics.</p>
        <p>Voici votre code de confirmation, valable 15 minutes :</p>
        <h2 style="color: #2563eb; letter-spacing: 5px; font-size: 24px;">{code}</h2>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        <br>
        <p>L'équipe Kaïs Analytics</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, user.email, "Kaïs Analytics - Code de réinitialisation", html_content)
    
    return {"message": "Si l'adresse email existe, un code de réinitialisation a été envoyé."}

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Requête invalide.")
        
    reset_entry = db.query(PasswordResetCode).filter(
        PasswordResetCode.email == request.email,
        PasswordResetCode.code == request.code,
        PasswordResetCode.expires_at > datetime.utcnow()
    ).order_by(PasswordResetCode.created_at.desc()).first()
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")
        
    user.password_hash = get_password_hash(request.new_password)
    user.is_first_login = False
    
    # Invalidate all previous codes
    db.query(PasswordResetCode).filter(PasswordResetCode.email == request.email).delete()
    
    notif = Notification(
        user_id=user.id,
        title="Sécurité du compte",
        message="Votre mot de passe a été réinitialisé avec succès.",
        type="INFO"
    )
    db.add(notif)
    
    db.commit()
    
    # Send email notification
    pwd_reset_html = f"""
    <h3>Réinitialisation de mot de passe</h3>
    <p>Bonjour <b>{user.first_name}</b>,</p>
    <p>Le mot de passe de votre compte Kaïs Analytics vient d'être réinitialisé avec succès via la procédure d'oubli de mot de passe.</p>
    <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
    """
    background_tasks.add_task(send_email_sync, user.email, "Kaïs Analytics - Mot de passe réinitialisé", pwd_reset_html)
    
    return {"message": "Mot de passe réinitialisé avec succès."}

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
    current_user.sexe = request.sexe
    current_user.poste = request.poste
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
            "sexe": current_user.sexe,
            "poste": current_user.poste,
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
            "sexe": u.sexe,
            "poste": u.poste,
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
    background_tasks: BackgroundTasks,
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
        sexe=request.sexe,
        poste=request.poste,
        establishment=request.establishment,
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=request.role,
        is_first_login=True # Force la modif de mot de passe à la première co
    )
    db.add(new_user)
    db.commit()

    html_content = f"""
    <html>
      <body>
        Bonjour <b>{request.first_name} {request.last_name}</b>,
        <p>Vous avez été invité(e) à rejoindre l'application Kaïs Analytics.</p>
        <p>Voici vos identifiants de connexion :</p>
        <ul>
          <li><strong>Email :</strong> {request.email}</li>
          <li><strong>Mot de passe :</strong> {request.password}</li>
        </ul>
        <p>Lors de votre première connexion, vous serez invité(e) à modifier ce mot de passe.</p>
        <br>
        <p>L'équipe Kaïs Analytics</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, request.email, "Bienvenue sur Kaïs Analytics - Vos accès", html_content)

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
    target_user.sexe = request.sexe
    target_user.poste = request.poste
    
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

# --- ACCOUNT REQUESTS & NOTIFICATIONS ---

@router.post("/request-account")
def request_account(request: CreateAccountRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Vérification email
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    existing_request = db.query(AccountRequest).filter(AccountRequest.email == request.email).first()
    if existing_request:
        if existing_request.status == "PENDING":
            raise HTTPException(status_code=400, detail="Une demande avec cet email est déjà en attente.")
        else:
            raise HTTPException(status_code=400, detail="Une demande avec cet email a déjà été traitée.")

    new_request = AccountRequest(
        first_name=request.first_name,
        last_name=request.last_name,
        sexe=request.sexe,
        email=request.email,
        poste=request.poste
    )
    db.add(new_request)
    db.commit()

    # Créer une notification globale pour les SUPER_ADMIN
    admin_notif = Notification(
        user_id=None, # Globale
        title="Nouvelle demande de compte",
        message=f"{request.first_name} {request.last_name} a demandé la création d'un compte.",
        type="ACCOUNT_REQUEST"
    )
    db.add(admin_notif)
    db.commit()

    # Envoyer un email d'alerte aux SUPER_ADMIN
    super_admins = db.query(User).filter(User.role == "SUPER_ADMIN", User.is_active == True).all()
    if super_admins:
        subject = "Nouvelle demande de compte Kaïs Analytics"
        html_content = f"""
        <h3 style="color: #0f172a; margin-top: 0;">Nouvelle demande d'accès</h3>
        <p>Une nouvelle demande de création de compte a été soumise :</p>
        <ul style="background-color: #f8fafc; padding: 15px 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <li><b>Nom :</b> {request.first_name} {request.last_name}</li>
            <li><b>Email :</b> {request.email}</li>
            <li><b>Poste :</b> {request.poste}</li>
        </ul>
        <p>Vous pouvez valider ou refuser cette demande depuis l'onglet <b>Équipe</b> de votre tableau de bord.</p>
        <div style="margin-top: 25px; text-align: center;">
            <a href="https://analysis-credit-rag-frontend.vercel.app/team" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder à Kaïs</a>
        </div>
        """
        for admin in super_admins:
            background_tasks.add_task(send_email_sync, admin.email, subject, html_content)

    return {"message": "Votre demande de compte a été enregistrée. Elle sera validée par un administrateur."}


@router.get("/account-requests")
def get_account_requests(
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN"]))
):
    requests = db.query(AccountRequest).filter(AccountRequest.status == "PENDING").all()
    return [
        {
            "id": r.id,
            "first_name": r.first_name,
            "last_name": r.last_name,
            "sexe": r.sexe,
            "email": r.email,
            "poste": r.poste,
            "status": r.status,
            "created_at": r.created_at
        } for r in requests
    ]


@router.post("/account-requests/{request_id}/approve")
def approve_request_endpoint(
    request_id: int,
    approval: ApproveAccountRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN"]))
):
    acc_req = db.query(AccountRequest).filter(AccountRequest.id == request_id).first()
    if not acc_req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
        
    if acc_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée.")

    existing_user = db.query(User).filter(User.email == acc_req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Un compte avec cet email existe déjà.")

    # Création de l'utilisateur
    new_user = User(
        id=str(uuid.uuid4()),
        first_name=acc_req.first_name,
        last_name=acc_req.last_name,
        sexe=acc_req.sexe,
        poste=acc_req.poste,
        establishment=approval.establishment,
        email=acc_req.email,
        password_hash=get_password_hash(approval.password),
        role=approval.role,
        is_first_login=True
    )
    db.add(new_user)
    
    # Marquer la demande comme approuvée
    acc_req.status = "APPROVED"
    
    # Créer une notification de bienvenue
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Bienvenue sur Kaïs !",
        message="Votre compte a été approuvé. Pensez à modifier votre mot de passe.",
        type="WELCOME"
    )
    db.add(welcome_notif)
    
    db.commit()
    
    html_content = f"""
    <html>
      <body>
        <h3>Bonjour {new_user.first_name} {new_user.last_name},</h3>
        <p>Votre demande de compte a été approuvée avec le rôle <strong>{new_user.role}</strong>.</p>
        <p>Voici vos identifiants de connexion :</p>
        <ul>
          <li><strong>Email :</strong> {new_user.email}</li>
          <li><strong>Mot de passe temporaire :</strong> {approval.password}</li>
        </ul>
        <p>Lors de votre première connexion, vous serez invité(e) à modifier ce mot de passe.</p>
        <br>
        <p>L'équipe Kaïs</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, new_user.email, "Votre compte Kaïs est approuvé !", html_content)

    return {"message": "Demande approuvée. L'utilisateur a été créé et notifié."}


@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Les SUPER_ADMIN voient les notifications globales (user_id IS NULL) ET leurs notifs perso
    if current_user.role == "SUPER_ADMIN":
        notifs = db.query(Notification).filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None)
        ).order_by(Notification.created_at.desc()).all()
    else:
        notifs = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).all()
        
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        } for n in notifs
    ]

@router.post("/notifications")
def create_notification(
    request: CreateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_notif = Notification(
        user_id=current_user.id,
        title=request.title,
        message=request.message,
        type=request.type
    )
    db.add(new_notif)
    db.commit()
    return {"message": "Notification créée."}

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification introuvable.")
        
    if notif.user_id is not None and notif.user_id != current_user.id:
        if current_user.role != "SUPER_ADMIN":
            raise HTTPException(status_code=403, detail="Non autorisé.")
            
    notif.is_read = True
    db.commit()
    return {"message": "Notification lue."}
