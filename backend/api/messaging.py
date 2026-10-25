import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, Request
from .db import get_supabase
from .auth import get_current_user
from .models import SendMessageRequest

router = APIRouter(prefix="/api/messaging", tags=["Messaging"])

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via Gmail SMTP."""
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("WARNING: Gmail credentials not configured. Email not sent.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Elder Care System <{GMAIL_ADDRESS}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        # Create HTML email body
        html_body = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #0f0f23;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(99, 102, 241, 0.3);">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🏥 Elder Care Management</h1>
                </div>
                <div style="padding: 32px; color: #e2e8f0;">
                    <h2 style="color: #a5b4fc; margin-top: 0;">{subject}</h2>
                    <div style="line-height: 1.6; font-size: 15px;">
                        {body}
                    </div>
                    <hr style="border: none; border-top: 1px solid rgba(99, 102, 241, 0.2); margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        This is an automated message from Elder Care Management System.<br>
                        Please do not reply to this email directly.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False


@router.post("/send")
async def send_message(data: SendMessageRequest, request: Request):
    """Send a message/email to a recipient. Accessible by all authenticated users."""
    user = get_current_user(request)

    try:
        db = get_supabase()

        # Send the email
        email_sent = send_email(data.recipient_email, data.subject, data.body)

        # Log the message in the database
        message_data = {
            "sender_id": user["user_id"],
            "recipient_email": data.recipient_email,
            "subject": data.subject,
            "body": data.body,
            "status": "sent" if email_sent else "failed"
        }
        result = db.table("messages").insert(message_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to log message")

        return {
            "id": result.data[0]["id"],
            "status": "sent" if email_sent else "failed",
            "message": "Email sent successfully" if email_sent else "Email queued (SMTP not configured)"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_message_history(request: Request):
    """Get message history for the current user."""
    user = get_current_user(request)

    try:
        db = get_supabase()

        if user["role"] == "admin":
            # Admins can see all messages
            result = db.table("messages").select("*").order("created_at", desc=True).limit(50).execute()
        else:
            # Others can only see their own messages
            result = db.table("messages").select("*").eq("sender_id", user["user_id"]).order("created_at", desc=True).limit(50).execute()

        return {"messages": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
