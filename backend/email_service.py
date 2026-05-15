import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
_port = os.getenv("SMTP_PORT")
SMTP_PORT = int(_port) if _port and _port.isdigit() else 587
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
REPLY_TO = "no-reply@kaisanalytics.com"
FROM_NAME = os.getenv("FROM_NAME", "Kaïs Analytics")

def markdown_to_html(text: str) -> str:
    """Convertit un markdown ultra-simplifié en HTML."""
    import re
    if not text: return ""
    # Gras
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    # Italique
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    # Liens
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" style="color: #2563eb; text-decoration: underline;">\1</a>', text)
    # Newlines
    text = text.replace('\n', '<br>')
    return text

def send_email_sync(to_email: str, subject: str, html_content: str, attachment_name: str = None, attachment_data: bytes = None, is_backoffice: bool = False):
    """
    Fonction synchrone pour envoyer un email via SMTP.
    Retourne True si l'envoi a réussi, False sinon.
    Si les variables SMTP ne sont pas configurées, fait une simulation console.
    """
    missing = []
    if not SMTP_SERVER: missing.append("SMTP_SERVER")
    if not SMTP_USERNAME: missing.append("SMTP_USERNAME")
    if not SMTP_PASSWORD: missing.append("SMTP_PASSWORD")
    
    if missing:
        print(f"⚠️ [EMAIL ERROR] Variables manquantes : {', '.join(missing)}")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        return False

    try:
        from email.utils import formataddr
        from email.header import Header

        msg = MIMEMultipart("mixed")
        msg['Subject'] = subject
        
        if FROM_NAME:
            encoded_name = str(Header(FROM_NAME, 'utf-8'))
            msg['From'] = formataddr((encoded_name, FROM_EMAIL))
        else:
            msg['From'] = FROM_EMAIL
            
        msg['Reply-To'] = REPLY_TO
        msg['To'] = to_email

        frontend_url = os.getenv('FRONTEND_URL', 'https://kais-analytics.vercel.app')
        
        # Choix du logo (Backoffice ou Classique)
        if is_backoffice:
            logo_img_tag = f'<img src="{frontend_url}/logocompletoffice.svg" alt="Kaïs Backoffice" style="max-height: 60px;">'
        else:
            logo_img_tag = '<img src="cid:logomail" alt="Kaïs Analytics" style="max-height: 60px;">'

        # Template HTML global avec le logo et le pied de page
        template_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        {logo_img_tag}
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 8px;">
                        {html_content}
                    </div>
                    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        <p>Veuillez ne pas répondre à cet email. Ce message a été généré automatiquement par Kaïs Analytics.</p>
                        <p>&copy; {os.environ.get('YEAR', '2026')} Kaïs Analytics. Tous droits réservés.</p>
                    </div>
                </div>
            </body>
        </html>
        """

        # Sous-partie pour l'email principal et l'image inline (logo)
        body_part = MIMEMultipart("related")
        body_part.attach(MIMEText(template_html, 'html'))
        
        # Attach embedded Logo uniquement si on n'est pas en backoffice
        if not is_backoffice:
            logo_path = os.path.join(os.path.dirname(__file__), "images", "logomail.png")
            if os.path.exists(logo_path):
                with open(logo_path, "rb") as f:
                    img_data = f.read()
                image = MIMEImage(img_data, name=os.path.basename(logo_path))
                image.add_header('Content-ID', '<logomail>')
                image.add_header('Content-Disposition', 'inline', filename='logomail.png')
                body_part.attach(image)
        
        msg.attach(body_part)

        # Pièce jointe optionnelle du formulaire de contact
        if attachment_name and attachment_data:
            from email.mime.base import MIMEBase
            from email import encoders
            file_part = MIMEBase('application', 'octet-stream')
            file_part.set_payload(attachment_data)
            encoders.encode_base64(file_part)
            file_part.add_header('Content-Disposition', f'attachment; filename="{attachment_name}"')
            msg.attach(file_part)

        # Connect and send
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure the connection
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        
        print(f"✅ Email envoyé avec succès à {to_email}")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email à {to_email} : {str(e)}")
        return False

# Tests en local si ce script est exécuté directement
if __name__ == "__main__":
    test_html = """
    <html>
      <body>
        <h2>Ceci est un test</h2>
        <p>Le système SMTP de Kaïs fonctionne correctement.</p>
      </body>
    </html>
    """
    # Remplacer par votre email pour tester
    # send_email_sync("test@example.com", "Test SMTP Kaïs", test_html)
