import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def send_verification_email(to_email: str, username: str, verification_link: str):
    if not (EMAIL_USERNAME and EMAIL_PASSWORD):
        print("Email credentials not set. Skipping verification email.")
        return

    msg = MIMEMultipart()
    msg['From'] = EMAIL_USERNAME
    msg['To'] = to_email
    msg['Subject'] = "Please Verify Your README Miner Account"

    body = f"""
    <html>
    <body>
        <p>Hello {username},</p>
        <p>Thank you for registering with README Miner!</p>
        <p>To activate your account, please click on the link below:</p>
        <p><a href="{verification_link}">Verify My Account</a></p>
        <p>If you did not register for this service, please ignore this email.</p>
        <p>Thanks,<br>
        The README Miner Team</p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Verification email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send verification email to {to_email}: {e}")