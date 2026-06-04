import os
import httpx
from typing import Optional

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

class EmailService:
    def __init__(self):
        self.api_key = BREVO_API_KEY
        self.from_email = os.getenv("FROM_EMAIL", "noreply@ghydra.ai")
        self.from_name = "Ghydra Security"
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via Brevo API"""
        if not self.api_key:
            print("BREVO_API_KEY not configured")
            return False
        
        headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
        
        payload = {
            "sender": {
                "name": self.from_name,
                "email": self.from_email
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        
        if text_content:
            payload["textContent"] = text_content
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    BREVO_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                return response.status_code == 201
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False
    
    async def send_verification_code(self, email: str, code: str, name: str) -> bool:
        """Send email verification code"""
        subject = "Verify your Ghydra account"
        
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://ghydra-ai.pages.dev/GhydraLogo.png" alt="Ghydra" style="width: 60px; height: 60px;">
                <h1 style="color: #1f2937; margin: 20px 0 10px; font-size: 28px; font-weight: 700;">Verify Your Email</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 0;">Welcome to Ghydra, {name}!</p>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Enter this verification code to complete your registration:</p>
                <div style="background: #3b82f6; color: white; font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 20px; border-radius: 8px; margin: 0 auto; display: inline-block;">
                    {code}
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This code expires in 10 minutes.</p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                    If you didn't create a Ghydra account, you can safely ignore this email.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
                    © 2025 Ghydra. Advanced threat detection platform.
                </p>
            </div>
        </div>
        """
        
        text_content = f"""
        Verify Your Ghydra Account
        
        Hi {name},
        
        Enter this verification code to complete your registration:
        
        {code}
        
        This code expires in 10 minutes.
        
        If you didn't create a Ghydra account, you can safely ignore this email.
        
        © 2025 Ghydra
        """
        
        return await self.send_email(email, subject, html_content, text_content)

email_service = EmailService()