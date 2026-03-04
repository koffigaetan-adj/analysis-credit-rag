import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
FROM_NAME = os.getenv("FROM_NAME", "Kaïs Intelligence Analyst")

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
        msg = MIMEMultipart("alternative")
        msg['Subject'] = subject
        msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>" if FROM_NAME else FROM_EMAIL
        msg['To'] = to_email

        # Attach HTML content
        part = MIMEText(html_content, 'html')
        msg.attach(part)

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
