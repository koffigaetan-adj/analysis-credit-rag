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
import pyotp
import qrcode
import base64
from io import BytesIO
from database import get_db, User, AccountRequest, Notification, PasswordResetCode, Establishment, UserBackoffice
from email_service import send_email_sync
import rag_engine

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

class BackofficeLoginRequest(BaseModel):
    email: str
    password: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

class TwoFactorLoginRequest(BaseModel):
    temp_token: str
    code: str

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
    role: str = "ANALYST"
    establishment: Optional[str] = None
    password: str

class RejectAccountRequest(BaseModel):
    reason: str = "Votre demande ne correspond pas aux critères d'accès actuels."

class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "INFO"

# --- FONCTIONS UTILITAIRES ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Utilise passlib de manière propre
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Erreur de vérification password: {e}")
        # Fallback manuel si le hash est au format brut bytes/string
        try:
            password_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception as e2:
            print(f"Erreur fallback bcrypt: {e2}")
            return False
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

def get_current_backoffice_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type = payload.get("type")
        if user_id is None or token_type != "backoffice":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(UserBackoffice).filter(UserBackoffice.id == user_id).first()
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
    <p>Veuillez <a href="{os.getenv('FRONTEND_URL', 'https://kais-analytics.vercel.app')}" style="color: #2563eb; font-weight: bold;">cliquer ici pour vous rendre sur l'application</a> et utiliser la fonction "Mot de passe oublié" pour réinitialiser vos accès immédiatement.</p>
    """
    from email_service import send_email_sync
    send_email_sync(user_email, "Kaïs Analytics - Nouvelle connexion détectée", login_html)

# --- ROUTES ---

@router.post("/backoffice/login")
def backoffice_login(request: Request, req: BackofficeLoginRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(UserBackoffice).filter(UserBackoffice.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte suspendu.")
    
    if user.two_factor_enabled:
        # Envoi de l'alerte de mot de passe valide
        ip_address = request.client.host if request.client else "Inconnue"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        user_agent = request.headers.get("user-agent", "Inconnu")
        login_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        background_tasks.add_task(send_login_alert_async, user.email, user.name, "", ip_address, user_agent, login_time)

        temp_token_expires = timedelta(minutes=5)
        temp_token = create_access_token(
            data={"sub": user.id, "type": "2fa_pending_backoffice"},
            expires_delta=temp_token_expires
        )
        return {
            "requires_2fa": True,
            "temp_token": temp_token
        }
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "type": "backoffice", "role": user.role}, expires_delta=access_token_expires
    )
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "requires_2fa": False,
        "user_info": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "two_factor_enabled": getattr(user, "two_factor_enabled", False)
        }
    }
    
    # Envoi de l'alerte de connexion
    ip_address = request.client.host if request.client else "Inconnue"
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    user_agent = request.headers.get("user-agent", "Inconnu")
    login_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    background_tasks.add_task(send_login_alert_async, user.email, user.name, "", ip_address, user_agent, login_time)
    
    return response_data

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

    if user.two_factor_enabled:
        # On envoie quand même l'alerte de mot de passe valide
        ip_address = request.client.host if request.client else "Inconnue"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        user_agent = request.headers.get("user-agent", "Inconnu")
        login_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        background_tasks.add_task(send_login_alert_async, user.email, user.first_name, user.last_name, ip_address, user_agent, login_time)

        temp_token_expires = timedelta(minutes=5)
        temp_token = create_access_token(
            data={"sub": user.id, "type": "2fa_pending"},
            expires_delta=temp_token_expires
        )
        return {
            "requires_2fa": True,
            "temp_token": temp_token
        }

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
        "requires_2fa": False,
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
            "is_active": user.is_active,
            "two_factor_enabled": getattr(user, "two_factor_enabled", False)
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
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez JPG, PNG ou WEBP.")

    from supabase import create_client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(supabase_url, supabase_key)

    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_bytes = await file.read()

    # Supprimer l'ancien avatar si stocké sur Supabase
    if current_user.avatar_url and "supabase" in current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/avatars/")[-1]
        try:
            supabase.storage.from_("avatars").remove([old_filename])
        except:
            pass

    # Upload vers Supabase Storage
    supabase.storage.from_("avatars").upload(
        path=filename,
        file=file_bytes,
        file_options={"content-type": file.content_type}
    )

    # Récupérer l'URL publique
    avatar_url = supabase.storage.from_("avatars").get_public_url(filename)

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
    # Restreindre aux utilisateurs du même établissement
    users = db.query(User).filter(User.establishment == current_user.establishment).all()
    
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
        
    # Un admin / super admin client ne peut créer que dans son propre établissement
    request.establishment = current_admin.establishment
    
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
    
    # Sécurité : Un admin (même super admin client) ne peut agir que sur son établissement
    if target_user.establishment != current_admin.establishment:
         raise HTTPException(status_code=403, detail="Vous ne pouvez pas modifier un membre d'un autre établissement.")
         
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

    # Sécurité : Un admin ne peut agir que sur son établissement
    if target_user.establishment != current_admin.establishment:
         raise HTTPException(status_code=403, detail="Vous ne pouvez pas supprimer un membre d'un autre établissement.")

    # Empêcher l'auto-suppression
    if target_user.id == current_admin.id:
         raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte ici.")

    # Seul un SUPER_ADMIN peut supprimer un SUPER_ADMIN
    if target_user.role == "SUPER_ADMIN" and current_admin.role != "SUPER_ADMIN":
         raise HTTPException(status_code=403, detail="Vous n'avez pas l'autorisation de supprimer un Super Administrateur.")

    # Supprimer également les éventuelles demandes de compte associées à cet email
    db.query(AccountRequest).filter(AccountRequest.email == target_user.email).delete()
    
    db.delete(target_user)
    db.commit()
    
    return {"message": "Utilisateur et ses demandes associées supprimés de manière définitive."}

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
        elif existing_request.status == "REJECTED":
            # Autoriser la ré-application : on réinitialise la demande existante
            existing_request.status = "PENDING"
            existing_request.first_name = request.first_name
            existing_request.last_name = request.last_name
            existing_request.sexe = request.sexe
            existing_request.poste = request.poste
            existing_request.created_at = datetime.utcnow()
            existing_request.rejection_reason = None # On efface l'ancien motif
            db.commit()
            new_request = existing_request
        elif existing_request.status == "APPROVED":
            # Si la demande est 'APPROVED' mais que existing_user est None (vérifié plus haut),
            # cela signifie que l'utilisateur a été supprimé manuellement de la table User
            # mais que la demande est restée. On autorise alors la ré-application.
            existing_request.status = "PENDING"
            existing_request.created_at = datetime.utcnow()
            db.commit()
            new_request = existing_request
        else:
            raise HTTPException(status_code=400, detail="Une demande avec cet email a déjà été traitée.")
    else:
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

    # 1. Mail au demandeur : confirmation de transmission
    requester_subject = "Kaïs Analytics - Demande d'accès transmise"
    requester_html = f"""
    <h3 style="color: #0f172a; margin-top: 0;">Demande bien transmise</h3>
    <p>Bonjour {request.first_name},</p>
    <p>Nous vous informons que votre demande de création de compte sur <b>Kaïs Analytics</b> a bien été transmise.</p>
    <p>Celle-ci sera examinée prochainement par notre équipe d'administration. Vous recevrez un email dès que votre accès aura été validé.</p>
    <br>
    <p>L'équipe Kaïs Analytics</p>
    """
    background_tasks.add_task(send_email_sync, request.email, requester_subject, requester_html)

    # 2. Mail aux SUPER_ADMIN : alerte demande
    super_admins = db.query(User).filter(User.role == "SUPER_ADMIN", User.is_active == True).all()
    if super_admins:
        admin_subject = "Nouvelle demande de compte Kaïs Analytics"
        admin_html = f"""
        <h3 style="color: #0f172a; margin-top: 0;">Nouvelle demande d'accès</h3>
        <p>Une nouvelle demande de création de compte a été soumise :</p>
        <ul style="background-color: #f8fafc; padding: 15px 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <li><b>Nom :</b> {request.first_name} {request.last_name}</li>
            <li><b>Email :</b> {request.email}</li>
            <li><b>Poste :</b> {request.poste}</li>
        </ul>
        <p>Vous pouvez valider ou refuser cette demande depuis l'onglet <b>Équipe</b> de votre tableau de bord.</p>
        <div style="margin-top: 25px; text-align: center;">
            <a href="https://kais-analytics.vercel.app/login" style="background-color: #E73919; color: white; padding: 10px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à Kaïs</a>
        </div>
        """
        for admin in super_admins:
            background_tasks.add_task(send_email_sync, admin.email, admin_subject, admin_html)

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
        <div style="margin-top: 25px; text-align: center;">
            <a href="https://kais-analytics.vercel.app/login" style="background-color: #E73919; color: white; padding: 10px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à Kaïs</a>
        </div>
        <br>
        <p>L'équipe Kaïs</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, new_user.email, "Votre compte Kaïs est approuvé !", html_content)

    return {"message": "Demande approuvée. L'utilisateur a été créé et notifié."}

@router.post("/account-requests/{request_id}/reject")
def reject_request_endpoint(
    request_id: int,
    rejection: RejectAccountRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(check_role(["SUPER_ADMIN"]))
):
    acc_req = db.query(AccountRequest).filter(AccountRequest.id == request_id).first()
    if not acc_req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
        
    if acc_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée.")

    # Marquer la demande comme refusée
    acc_req.status = "REJECTED"
    acc_req.rejection_reason = rejection.reason
    db.commit()
    
    # Envoyer un email d'explication au demandeur
    html_content = f"""
    <html>
      <body>
        <h3>Bonjour {acc_req.first_name} {acc_req.last_name},</h3>
        <p>Suite à votre demande de création de compte sur <strong>Kaïs Analytics</strong>, nous vous informons que celle-ci n'a malheureusement pas pu être retenue.</p>
        <div style="background-color: #f8fafc; padding: 15px 30px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <b>Motif :</b> {rejection.reason}
        </div>
        <p>Pour toute question ou demande de réévaluation, n'hésitez pas à répondre directement à ce mail.</p>
        <br>
        <p>L'équipe Kaïs</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, acc_req.email, "Kaïs Analytics - Mise à jour de votre demande", html_content)

    return {"message": "Demande refusée. Le demandeur a été notifié par email."}


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

@router.delete("/notifications/{notification_id}")
def delete_notification(
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
            
    db.delete(notif)
    db.commit()
    return {"message": "Notification supprimée."}

@router.delete("/notifications")
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "SUPER_ADMIN":
        # Delete both personal and global notifications shown to Super Admin
        db.query(Notification).filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None)
        ).delete(synchronize_session=False)
    else:
        db.query(Notification).filter(Notification.user_id == current_user.id).delete(synchronize_session=False)
        
    db.commit()
    return {"message": "Toutes les notifications ont été supprimées."}

# --- ETABLISSEMENTS ---
class CreateEstablishmentRequest(BaseModel):
    name: str
    address: str
    primary_color: Optional[str] = "#E73919"

class UpdateEstablishmentRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    primary_color: Optional[str] = None

@router.get("/establishments")
def get_establishments(
    db: Session = Depends(get_db)
):
    est = db.query(Establishment).all()
    return [{
        "id": e.id,
        "name": e.name,
        "address": e.address,
        "status": e.status,
        "primary_color": e.primary_color or "#E73919",
        "created_at": e.created_at
    } for e in est]

@router.post("/establishments")
def create_establishment(
    req: CreateEstablishmentRequest,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    existing = db.query(Establishment).filter(Establishment.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un établissement avec ce nom existe déjà.")
    
    new_est = Establishment(
        id=str(uuid.uuid4()),
        name=req.name,
        address=req.address,
        status="active",
        primary_color=req.primary_color or "#E73919"
    )
    db.add(new_est)
    db.commit()
    db.refresh(new_est)
    
    return {
        "message": "Établissement créé avec succès.",
        "establishment": {
             "id": new_est.id,
             "name": new_est.name,
             "address": new_est.address,
             "status": new_est.status,
             "created_at": new_est.created_at
        }
    }

@router.put("/establishments/{est_id}")
def update_establishment(
    est_id: str,
    req: UpdateEstablishmentRequest,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    est = db.query(Establishment).filter(Establishment.id == est_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Établissement introuvable.")
    
    if req.name and req.name != est.name:
        existing = db.query(Establishment).filter(Establishment.name == req.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ce nom d'établissement est déjà utilisé.")
        est.name = req.name
        
    if req.address is not None:
        est.address = req.address
    if req.status is not None:
        est.status = req.status
    if req.primary_color is not None:
        est.primary_color = req.primary_color
        
    db.commit()
    return {"message": "Établissement mis à jour avec succès."}

@router.post("/establishments/{est_id}/policy")
async def upload_establishment_policy(
    est_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    est = db.query(Establishment).filter(Establishment.id == est_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Établissement introuvable.")

    # Save file temporarily
    temp_file_path = f"temp_policy_{est_id}_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        # Index into RAG specifically for this establishment name
        success = rag_engine.process_bank_rules(temp_file_path, establishment=est.name)
        if not success:
             raise HTTPException(status_code=500, detail="L'indexation a échoué.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    return {"message": f"Politique RAG mise à jour pour {est.name}"}

@router.delete("/establishments/{est_id}/policy")
def delete_establishment_policy(
    est_id: str,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    est = db.query(Establishment).filter(Establishment.id == est_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Établissement introuvable.")

    try:
        supabase_client = rag_engine._get_supabase_client()
        supabase_client.table("documents").delete().eq("metadata->>establishment", est.name).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": f"Politique RAG réinitialisée pour {est.name}"}

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

class UpdateBackofficeUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    role: str
    establishment: Optional[str] = None
    sexe: Optional[str] = "M"
    poste: Optional[str] = "Data Analyst"

class BackofficeCreateUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str
    establishment: Optional[str] = None
    sexe: Optional[str] = "M"
    poste: Optional[str] = "Data Analyst"

@router.post("/backoffice/users")
def backoffice_create_user(
    request: BackofficeCreateUserRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    # Vérification email
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    new_user = User(
        id=str(uuid.uuid4()),
        first_name=request.first_name,
        last_name=request.last_name,
        sexe=request.sexe or "M",
        poste=request.poste or "Data Analyst",
        establishment=request.establishment,
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=request.role,
        is_first_login=True
    )
    db.add(new_user)
    db.commit()

    # Email de bienvenue
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bienvenue sur Kaïs Analytics</h2>
        <p>Bonjour <b>{request.first_name} {request.last_name}</b>,</p>
        <p>Votre compte a été créé. Voici vos identifiants :</p>
        <ul>
          <li><strong>Email :</strong> {request.email}</li>
          <li><strong>Mot de passe provisoire :</strong> {request.password}</li>
        </ul>
        <p>Connectez-vous et changez votre mot de passe dès la première connexion.</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, request.email, "Vos identifiants Kaïs Analytics", html_content)

    return {
        "message": "Compte créé avec succès.",
        "user": {
            "id": new_user.id,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "email": new_user.email,
            "role": new_user.role,
            "establishment": new_user.establishment
        }
    }

@router.put("/backoffice/users/{user_id}")
def update_backoffice_user(
    user_id: str,
    req: UpdateBackofficeUserRequest,
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
    if req.sexe:
        user.sexe = req.sexe
    if req.poste:
        user.poste = req.poste

    if req.email != user.email:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        user.email = req.email
        
    db.commit()
    return {
        "message": "Utilisateur mis à jour.",
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "establishment": user.establishment
        }
    }


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
    acc_req = db.query(AccountRequest).filter(AccountRequest.id == request_id).first()
    if not acc_req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
        
    if acc_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée.")

    # Marquer la demande comme refusée
    acc_req.status = "REJECTED"
    acc_req.rejection_reason = rejection.reason
    db.commit()
    
    # Envoyer un email d'explication au demandeur
    html_content = f"""
    <html>
      <body>
        <h3>Bonjour {acc_req.first_name} {acc_req.last_name},</h3>
        <p>Suite à votre demande de création de compte sur <strong>Kaïs Analytics</strong>, nous vous informons que celle-ci n'a malheureusement pas pu être retenue.</p>
        <div style="background-color: #f8fafc; padding: 15px 30px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <b>Motif :</b> {rejection.reason}
        </div>
        <p>Pour toute question ou demande de réévaluation, n'hésitez pas à répondre directement à ce mail.</p>
        <br>
        <p>L'équipe Kaïs</p>
      </body>
    </html>
    """
    background_tasks.add_task(send_email_sync, acc_req.email, "Kaïs Analytics - Mise à jour de votre demande", html_content)

    return {"message": "Demande refusée. Le demandeur a été notifié par email."}


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

@router.delete("/notifications/{notification_id}")
def delete_notification(
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
            
    db.delete(notif)
    db.commit()
    return {"message": "Notification supprimée."}

@router.delete("/notifications")
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "SUPER_ADMIN":
        # Delete both personal and global notifications shown to Super Admin
        db.query(Notification).filter(
            (Notification.user_id == current_user.id) | (Notification.user_id == None)
        ).delete(synchronize_session=False)
    else:
        db.query(Notification).filter(Notification.user_id == current_user.id).delete(synchronize_session=False)
        
    db.commit()
    return {"message": "Toutes les notifications ont été supprimées."}

# --- ETABLISSEMENTS ---
class CreateEstablishmentRequest(BaseModel):
    name: str
    address: str

class UpdateEstablishmentRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

@router.get("/establishments")
def get_establishments(
    db: Session = Depends(get_db)
):
    est = db.query(Establishment).all()
    return [{
        "id": e.id,
        "name": e.name,
        "address": e.address,
        "status": e.status,
        "created_at": e.created_at
    } for e in est]

@router.post("/establishments")
def create_establishment(
    req: CreateEstablishmentRequest,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    existing = db.query(Establishment).filter(Establishment.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un établissement avec ce nom existe déjà.")
    
    new_est = Establishment(
        id=str(uuid.uuid4()),
        name=req.name,
        address=req.address,
        status="active"
    )
    db.add(new_est)
    db.commit()
    db.refresh(new_est)
    
    return {
        "message": "Établissement créé avec succès.",
        "establishment": {
             "id": new_est.id,
             "name": new_est.name,
             "address": new_est.address,
             "status": new_est.status,
             "created_at": new_est.created_at
        }
    }

@router.put("/establishments/{est_id}")
def update_establishment(
    est_id: str,
    req: UpdateEstablishmentRequest,
    db: Session = Depends(get_db),
    current_admin: UserBackoffice = Depends(get_current_backoffice_user)
):
    est = db.query(Establishment).filter(Establishment.id == est_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Établissement introuvable.")
    
    if req.name and req.name != est.name:
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
    req: AdminCreateUserRequest,  # Replacing role, establishment, etc
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

# --- TWO FACTOR AUTHENTICATION ---

def generate_qr_b64(uri: str) -> str:
    qr = qrcode.make(uri)
    buf = BytesIO()
    qr.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

@router.post("/2fa/setup")
def setup_2fa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA est déjà activée.")
    
    secret = pyotp.random_base32()
    current_user.two_factor_secret = secret
    db.commit()
    
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="Kaïs Analytics")
    qr_b64 = generate_qr_b64(uri)
    
    return {"secret": secret, "qr_code": qr_b64}

@router.post("/2fa/verify-setup")
def verify_setup_2fa(req: TwoFactorVerifyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA est déjà activée.")
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="Processus de configuration 2FA non initié.")
        
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if totp.verify(req.code):
        current_user.two_factor_enabled = True
        db.commit()
        return {"message": "Double authentification activée avec succès."}
    else:
        raise HTTPException(status_code=400, detail="Code invalide.")

@router.post("/2fa/disable")
def disable_2fa(req: TwoFactorVerifyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA n'est pas activée.")
    
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if totp.verify(req.code) or req.code == current_user.password_hash: # Fallback? No, just OTP.
        pass
    if totp.verify(req.code):
        current_user.two_factor_enabled = False
        current_user.two_factor_secret = None
        db.commit()
        return {"message": "Double authentification désactivée."}
    else:
        raise HTTPException(status_code=400, detail="Code invalide.")

# BACKOFFICE 2FA
@router.post("/backoffice/2fa/setup")
def setup_bo_2fa(db: Session = Depends(get_db), current_user: UserBackoffice = Depends(get_current_backoffice_user)):
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA est déjà activée.")
    secret = pyotp.random_base32()
    current_user.two_factor_secret = secret
    db.commit()
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="Kaïs Analytics BO")
    return {"secret": secret, "qr_code": generate_qr_b64(uri)}

@router.post("/backoffice/2fa/verify-setup")
def verify_setup_bo_2fa(req: TwoFactorVerifyRequest, db: Session = Depends(get_db), current_user: UserBackoffice = Depends(get_current_backoffice_user)):
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA est déjà activée.")
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="Configuration non initiée.")
    if pyotp.TOTP(current_user.two_factor_secret).verify(req.code):
        current_user.two_factor_enabled = True
        db.commit()
        return {"message": "2FA activée."}
    raise HTTPException(status_code=400, detail="Code invalide.")

@router.post("/backoffice/2fa/disable")
def disable_bo_2fa(req: TwoFactorVerifyRequest, db: Session = Depends(get_db), current_user: UserBackoffice = Depends(get_current_backoffice_user)):
    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA n'est pas activée.")
    if pyotp.TOTP(current_user.two_factor_secret).verify(req.code):
        current_user.two_factor_enabled = False
        current_user.two_factor_secret = None
        db.commit()
        return {"message": "2FA désactivée."}
    raise HTTPException(status_code=400, detail="Code invalide.")

# GLOBAL 2FA LOGIN VERIFICATION (Normal & Backoffice)
@router.post("/2fa/login-verify")
def login_verify_2fa(request: Request, req: TwoFactorLoginRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type not in ["2fa_pending", "2fa_pending_backoffice"]:
            raise HTTPException(status_code=401, detail="Token temporaire invalide.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expiré ou invalide.")
        
    user = None
    if token_type == "2fa_pending":
        user = db.query(User).filter(User.id == user_id).first()
    else:
        user = db.query(UserBackoffice).filter(UserBackoffice.id == user_id).first()
        
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur invalide.")
    if not user.two_factor_enabled or not user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA non configurée.")
        
    if not pyotp.TOTP(user.two_factor_secret).verify(req.code):
        raise HTTPException(status_code=401, detail="Code 2FA invalide.")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    if token_type == "2fa_pending":
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role},
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "is_first_login": getattr(user, "is_first_login", False),
            "user_info": {
                "id": user.id,
                "first_name": getattr(user, "first_name", ""),
                "last_name": getattr(user, "last_name", ""),
                "sexe": getattr(user, "sexe", "M"),
                "poste": getattr(user, "poste", ""),
                "establishment": getattr(user, "establishment", ""),
                "role": user.role,
                "email": user.email,
                "avatar_url": getattr(user, "avatar_url", ""),
                "is_active": user.is_active,
                "two_factor_enabled": True
            }
        }
    else:
        access_token = create_access_token(
            data={"sub": user.id, "type": "backoffice", "role": user.role},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_info": {
                "id": user.id,
                "email": user.email,
                "name": getattr(user, "name", ""),
                "role": user.role,
                "two_factor_enabled": True
            }
        }

