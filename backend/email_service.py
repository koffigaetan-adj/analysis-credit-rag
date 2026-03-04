import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
REPLY_TO = "no-reply@kaisanalytics.com"
FROM_NAME = os.getenv("FROM_NAME", "Kaïs Analytics")

def send_email_sync(to_email: str, subject: str, html_content: str):
    """
    Fonction synchrone pour envoyer un email via SMTP.
    Retourne True si l'envoi a réussi, False sinon.
    Si les variables SMTP ne sont pas configurées, fait une simulation console.
    """
    if not SMTP_SERVER or not SMTP_USERNAME or not SMTP_PASSWORD:
        print("⚠️ [EMAIL SIMULATION] Configuration SMTP manquante. L'email suivant n'a pas été physiquement expédié :")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("--- Contenu HTML ---")
        print(html_content)
        print("--------------------")
        return True

    try:
        msg = MIMEMultipart("related")
        msg['Subject'] = subject
        msg['From'] = f"{FROM_NAME} <{REPLY_TO}>" if FROM_NAME else REPLY_TO
        msg['Reply-To'] = REPLY_TO
        msg['To'] = to_email

        # Template HTML global avec le logo et le pied de page
        template_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="cid:logomail" alt="Kaïs Analytics" style="max-height: 60px;">
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

        # Attach HTML content
        part = MIMEText(template_html, 'html')
        msg.attach(part)
        
        # Attach embedded Logo
        logo_path = os.path.join(os.path.dirname(__file__), "images", "logomail.png")
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                img_data = f.read()
            image = MIMEImage(img_data, name=os.path.basename(logo_path))
            image.add_header('Content-ID', '<logomail>')
            image.add_header('Content-Disposition', 'inline', filename='logomail.png')
            msg.attach(image)

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
