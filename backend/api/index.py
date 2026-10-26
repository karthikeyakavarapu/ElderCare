import os
import sys
import jwt
import bcrypt
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps

from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

try:
    from twilio.rest import Client as TwilioClient
except ImportError:
    TwilioClient = None

load_dotenv()

# ==================== CONFIG ====================
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "elder-care-secret-key-change-in-production").strip()
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "").strip()
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "").strip()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip()
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "").strip()

# ==================== DATABASE ====================
def get_supabase() -> Client:
    """Create a fresh Supabase client per invocation (serverless-safe).
    Avoids [Errno 16] Device or resource busy caused by reused httpx/gotrue
    background threads in Vercel's serverless environment."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
    from supabase import create_client
    from supabase.lib.client_options import ClientOptions
    options = ClientOptions(auto_refresh_token=False, persist_session=False)
    return create_client(SUPABASE_URL, SUPABASE_KEY, options=options)

# ==================== PYDANTIC MODELS ====================
class SignupRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "family"
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class SendMessageRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str

class CareTaskInput(BaseModel):
    elder_id: str
    task_name: str

class CareTaskStatusUpdate(BaseModel):
    status: str

class MedicineInput(BaseModel):
    elder_id: str
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    time: Optional[str] = None

class MedicineStatusUpdate(BaseModel):
    status: str

class TriggerEmergencyRequest(BaseModel):
    elder_id: str
    type: str = "soc"
    description: Optional[str] = None

class HealthMetricInput(BaseModel):
    elder_id: str
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_level: Optional[int] = None
    activity_level: Optional[str] = None
    notes: Optional[str] = None

class AssignCaregiverRequest(BaseModel):
    elder_id: str
    caregiver_id: str

class AssignFamilyRequest(BaseModel):
    elder_id: str
    family_id: str

class ElderCreateRequest(BaseModel):
    full_name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None

# ==================== AUTH HELPERS ====================
ROLE_PERMISSIONS = {
    "admin": ["dashboard:full", "users:manage", "elders:manage", "emergency:manage", "messages:all", "analytics:full"],
    "caregiver": ["dashboard:limited", "elders:assigned", "emergency:trigger", "emergency:view", "messages:send", "analytics:assigned"],
    "family": ["dashboard:minimal", "elders:own", "emergency:trigger", "emergency:view_own", "messages:send"],
}

def create_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "full_name": user_data["full_name"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return verify_token(auth_header.split(" ")[1])

# ==================== EMAIL HELPER ====================
def send_email(to_email: str, subject: str, body: str) -> bool:
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("WARNING: Gmail credentials not configured.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Elder Care System <{GMAIL_ADDRESS}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        html_body = f"""
        <html><body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:20px;background:#0f0f23;">
        <div style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;border:1px solid rgba(99,102,241,0.3);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;text-align:center;">
        <h1 style="color:white;margin:0;">🏥 Elder Care Management</h1></div>
        <div style="padding:32px;color:#e2e8f0;"><h2 style="color:#a5b4fc;margin-top:0;">{subject}</h2>
        <div style="line-height:1.6;">{body}</div></div></div></body></html>
        """
        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email failed: {e}")
        return False

# ==================== SMS HELPER ====================
def send_sms(to_number: str, message: str) -> bool:
    """Send an SMS via Twilio. Returns True on success."""
    if not TwilioClient:
        print("WARNING: Twilio library not installed — pip install twilio")
        return False
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_FROM_NUMBER:
        print("WARNING: Twilio credentials not configured in .env")
        return False
    # Normalise number: must start with + for international format
    number = to_number.strip() if to_number else ""
    if not number:
        return False
    # Convert common Indian shorthand (+91-XXXXXXXXXX → +91XXXXXXXXXX)
    number = number.replace("-", "").replace(" ", "")
    if not number.startswith("+"):
        number = "+" + number
    try:
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=TWILIO_FROM_NUMBER, to=number)
        print(f"SMS sent to {number}")
        return True
    except Exception as e:
        print(f"SMS failed to {number}: {e}")
        return False

# ==================== FASTAPI APP ====================
app = FastAPI(title="Elder Care Management System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
messaging_router = APIRouter(prefix="/api/messaging", tags=["Messaging"])
emergency_router = APIRouter(prefix="/api/emergency", tags=["Emergency"])
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# ==================== AUTH ENDPOINTS ====================
@auth_router.post("/signup")
async def signup(data: SignupRequest):
    try:
        db = get_supabase()
        existing = db.table("users").select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        if data.role not in ["admin", "caregiver", "family"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        password_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_data = {"email": data.email, "full_name": data.full_name, "password_hash": password_hash, "role": data.role, "phone": data.phone}
        result = db.table("users").insert(user_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        user = result.data[0]
        token = create_token(user)
        return {"token": token, "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"], "permissions": ROLE_PERMISSIONS.get(user["role"], [])}, "message": "Account created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.post("/login")
async def login(data: LoginRequest):
    try:
        db = get_supabase()
        result = db.table("users").select("*").eq("email", data.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user = result.data[0]
        if not bcrypt.checkpw(data.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token(user)
        return {"token": token, "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"], "permissions": ROLE_PERMISSIONS.get(user["role"], [])}, "message": "Login successful"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    try:
        db = get_supabase()
        result = db.table("users").select("id, email, full_name").eq("email", data.email).execute()
        if not result.data:
            return {"message": "If an account with that email exists, a password reset link has been sent."}
        
        user = result.data[0]
        # Generate token valid for 30 minutes
        payload = {
            "reset_user_id": user["id"],
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        reset_link = f"https://eldercare-management.netlify.app/reset-password?token={token}"
        body = f"<p>Hi {user['full_name']},</p><p>You requested a password reset. Click below to set a new password:</p><p><a href='{reset_link}' style='padding:10px 20px;background:#6366f1;color:white;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;'>Reset Password</a></p><p>This link expires in 30 minutes.</p>"
        send_email(user["email"], "Password Reset Request", body)
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    try:
        payload = jwt.decode(data.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("reset_user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid token")
        
        db = get_supabase()
        password_hash = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        db.table("users").update({"password_hash": password_hash}).eq("id", user_id).execute()
        
        return {"message": "Password updated successfully"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token has expired")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid token or request")

@auth_router.get("/me")
async def get_profile(request: Request):
    user = get_current_user(request)
    return {"user_id": user["user_id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"], "permissions": ROLE_PERMISSIONS.get(user["role"], [])}

# ==================== MESSAGING ENDPOINTS ====================
class SendMessageRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str
    recipient_phone: Optional[str] = None  # optional SMS target

@messaging_router.post("/send")
async def send_message(data: SendMessageRequest, request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        email_sent = send_email(data.recipient_email, data.subject, data.body)

        # SMS — send if a phone number was provided
        sms_sent = False
        if data.recipient_phone:
            sms_body = f"{data.subject}\n\n{data.body}\n\n— ElderCare System"
            sms_sent = send_sms(data.recipient_phone, sms_body[:1600])  # Twilio 1600-char limit

        status = "sent" if (email_sent or sms_sent) else "failed"
        message_data = {
            "sender_id": user["user_id"],
            "recipient_email": data.recipient_email,
            "subject": data.subject,
            "body": data.body,
            "status": status
        }
        result = db.table("messages").insert(message_data).execute()
        return {
            "id": result.data[0]["id"] if result.data else "",
            "status": status,
            "email_sent": email_sent,
            "sms_sent": sms_sent,
            "message": f"Email {'sent' if email_sent else 'failed'}, SMS {'sent' if sms_sent else 'not sent'}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.get("/history")
async def get_message_history(request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        if user["role"] == "admin":
            result = db.table("messages").select("*").order("created_at", desc=True).limit(50).execute()
        else:
            result = db.table("messages").select("*").or_(f"sender_id.eq.{user['user_id']},recipient_email.eq.{user['email']}").order("created_at", desc=True).limit(50).execute()
        return {"messages": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== EMERGENCY ENDPOINTS ====================
@emergency_router.post("/trigger")
async def trigger_emergency(data: TriggerEmergencyRequest, request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        elder_result = db.table("elders").select("*").eq("id", data.elder_id).execute()
        if not elder_result.data:
            raise HTTPException(status_code=404, detail="Elder not found")
        elder = elder_result.data[0]
        emergency_data = {"elder_id": data.elder_id, "triggered_by": user["user_id"], "type": data.type, "description": data.description or f"SOC Emergency triggered for {elder['full_name']}", "status": "active"}
        result = db.table("emergencies").insert(emergency_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to log emergency")
        emergency_id = result.data[0]["id"]
        emergency_body = f"<div style='background:#dc2626;color:white;padding:16px;border-radius:8px;'><h2>🚨 EMERGENCY ALERT</h2></div><p><strong>Elder:</strong> {elder['full_name']}</p><p><strong>Type:</strong> {data.type.upper()}</p><p><strong>Description:</strong> {data.description or 'Immediate attention required'}</p><p><strong>Triggered by:</strong> {user['full_name']}</p>"
        notifications_sent = []

        # Build plain-text SMS for phone alerts
        sms_text = (
            f"🚨 EMERGENCY ALERT\n"
            f"Patient: {elder['full_name']}\n"
            f"Type: {data.type.upper()}\n"
            f"Detail: {data.description or 'Immediate attention required'}\n"
            f"Triggered by: {user['full_name']}\n"
            f"— ElderCare System"
        )

        # Caregiver — email + SMS
        if elder.get("caregiver_email"):
            email_ok = send_email(elder["caregiver_email"], f"🚨 EMERGENCY: {elder['full_name']}", emergency_body)
            notifications_sent.append({"role": "caregiver", "email": elder["caregiver_email"], "email_sent": email_ok})

        if elder.get("assigned_caregiver_id"):
            cg_res = db.table("users").select("phone").eq("id", elder["assigned_caregiver_id"]).execute()
            if cg_res.data and cg_res.data[0].get("phone"):
                sms_ok = send_sms(cg_res.data[0]["phone"], sms_text)
                if notifications_sent and notifications_sent[-1]["role"] == "caregiver":
                    notifications_sent[-1]["sms_sent"] = sms_ok
                else:
                    notifications_sent.append({"role": "caregiver", "sms_sent": sms_ok})

        # Family — email + SMS
        if elder.get("family_contact_email"):
            email_ok = send_email(elder["family_contact_email"], f"🚨 EMERGENCY: {elder['full_name']}", emergency_body)
            notifications_sent.append({"role": "family", "email": elder["family_contact_email"], "email_sent": email_ok})

        if elder.get("family_contact_id"):
            fm_res = db.table("users").select("phone").eq("id", elder["family_contact_id"]).execute()
            if fm_res.data and fm_res.data[0].get("phone"):
                sms_ok = send_sms(fm_res.data[0]["phone"], sms_text)
                if notifications_sent and notifications_sent[-1]["role"] == "family":
                    notifications_sent[-1]["sms_sent"] = sms_ok
                else:
                    notifications_sent.append({"role": "family", "sms_sent": sms_ok})

        return {"id": emergency_id, "status": "active", "message": "Emergency alert triggered", "notifications": notifications_sent, "elder_name": elder["full_name"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@emergency_router.get("/history")
async def get_emergency_history(request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        if user["role"] == "admin":
            result = db.table("emergencies").select("*, elders(full_name)").order("created_at", desc=True).limit(50).execute()
        else:
            result = db.table("emergencies").select("*, elders(full_name)").eq("triggered_by", user["user_id"]).order("created_at", desc=True).limit(50).execute()
        return {"emergencies": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@emergency_router.patch("/resolve/{emergency_id}")
async def resolve_emergency(emergency_id: str, request: Request):
    user = get_current_user(request)
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can resolve emergencies")
    try:
        db = get_supabase()
        result = db.table("emergencies").update({"status": "resolved", "resolved_at": datetime.utcnow().isoformat()}).eq("id", emergency_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Emergency not found")
        return {"status": "resolved", "message": "Emergency resolved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DASHBOARD ENDPOINTS ====================
@dashboard_router.get("/stats")
async def get_dashboard_stats(request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        if user["role"] == "admin":
            elders = db.table("elders").select("id", count="exact").execute()
            caregivers = db.table("users").select("id", count="exact").eq("role", "caregiver").execute()
            active_emergencies = db.table("emergencies").select("id", count="exact").eq("status", "active").execute()
            messages = db.table("messages").select("id", count="exact").execute()
            health = db.table("health_metrics").select("heart_rate, oxygen_level").execute()
        else:
            fk = "assigned_caregiver_id" if user["role"] == "caregiver" else "family_contact_id"
            elders = db.table("elders").select("id", count="exact").eq(fk, user["user_id"]).execute()
            caregivers = type("o", (), {"count": 0})()
            active_emergencies = db.table("emergencies").select("id", count="exact").eq("status", "active").execute()
            messages = db.table("messages").select("id", count="exact").eq("sender_id", user["user_id"]).execute()
            elder_ids_result = db.table("elders").select("id").eq(fk, user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            health = db.table("health_metrics").select("heart_rate, oxygen_level").in_("elder_id", elder_ids).execute() if elder_ids else type("o", (), {"data": []})()

        avg_heart, avg_oxygen = None, None
        if health.data:
            hearts = [h["heart_rate"] for h in health.data if h.get("heart_rate")]
            oxygens = [h["oxygen_level"] for h in health.data if h.get("oxygen_level")]
            avg_heart = round(sum(hearts) / len(hearts), 1) if hearts else None
            avg_oxygen = round(sum(oxygens) / len(oxygens), 1) if oxygens else None

        return {
            "total_elders": elders.count if hasattr(elders, "count") else 0,
            "total_caregivers": caregivers.count if hasattr(caregivers, "count") else 0,
            "active_emergencies": active_emergencies.count if hasattr(active_emergencies, "count") else 0,
            "messages_sent": messages.count if hasattr(messages, "count") else 0,
            "avg_heart_rate": avg_heart,
            "avg_oxygen_level": avg_oxygen
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.get("/health-metrics")
async def get_health_metrics(request: Request, elder_id: str = None, days: int = 7):
    user = get_current_user(request)
    try:
        db = get_supabase()
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        query = db.table("health_metrics").select("*").gte("recorded_at", start_date).order("recorded_at", desc=False)
        if elder_id:
            query = query.eq("elder_id", elder_id)
        result = query.limit(200).execute()
        return {"metrics": result.data, "total": len(result.data), "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.get("/emergency-summary")
async def get_emergency_summary(request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        result = db.table("emergencies").select("type, status, created_at").order("created_at", desc=False).execute()
        type_counts = {}
        status_counts = {"active": 0, "resolved": 0, "cancelled": 0}
        for e in result.data:
            t = e.get("type", "other")
            s = e.get("status", "active")
            type_counts[t] = type_counts.get(t, 0) + 1
            if s in status_counts:
                status_counts[s] += 1
        return {"by_type": [{"name": k, "count": v} for k, v in type_counts.items()], "by_status": [{"name": k, "count": v} for k, v in status_counts.items()], "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.post("/health-metrics")
async def record_health_metric(data: HealthMetricInput, request: Request):
    user = get_current_user(request)
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can record health metrics")
    try:
        db = get_supabase()
        metric_data = {k: v for k, v in {"elder_id": data.elder_id, "heart_rate": data.heart_rate, "blood_pressure_systolic": data.blood_pressure_systolic, "blood_pressure_diastolic": data.blood_pressure_diastolic, "temperature": data.temperature, "oxygen_level": data.oxygen_level, "activity_level": data.activity_level, "notes": data.notes}.items() if v is not None}
        result = db.table("health_metrics").insert(metric_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to record health metric")
        return {"id": result.data[0]["id"], "message": "Health metric recorded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.get("/care-tasks")
async def get_care_tasks(request: Request, elder_id: str = None):
    user = get_current_user(request)
    try:
        db = get_supabase()
        query = db.table("care_tasks").select("*").order("created_at", desc=False)
        if elder_id:
            query = query.eq("elder_id", elder_id)
        result = query.execute()
        return {"tasks": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.post("/care-tasks")
async def create_care_task(data: CareTaskInput, request: Request):
    user = get_current_user(request)
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can create tasks")
    try:
        db = get_supabase()
        task_data = {
            "elder_id": data.elder_id,
            "task_name": data.task_name,
            "status": "pending"
        }
        result = db.table("care_tasks").insert(task_data).execute()
        return {"task": result.data[0], "message": "Task created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.patch("/care-tasks/{task_id}/status")
async def update_care_task_status(task_id: str, data: CareTaskStatusUpdate, request: Request):
    user = get_current_user(request)
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can update task status")
    try:
        db = get_supabase()
        result = db.table("care_tasks").update({"status": data.status}).eq("id", task_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"task": result.data[0], "message": "Task status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── MEDICINES ────────────────────────────────────────────────────────────────

@dashboard_router.get("/medicines")
async def get_medicines(request: Request, elder_id: str = None):
    user = get_current_user(request)
    try:
        db = get_supabase()
        query = db.table("medicines").select("*").order("created_at", desc=False)
        if elder_id:
            query = query.eq("elder_id", elder_id)
        elif user["role"] == "caregiver":
            elder_ids_res = db.table("elders").select("id").eq("assigned_caregiver_id", user["user_id"]).execute()
            ids = [e["id"] for e in elder_ids_res.data] if elder_ids_res.data else []
            if ids:
                query = query.in_("elder_id", ids)
            else:
                return {"medicines": [], "total": 0}
        elif user["role"] == "family":
            elder_ids_res = db.table("elders").select("id").eq("family_contact_id", user["user_id"]).execute()
            ids = [e["id"] for e in elder_ids_res.data] if elder_ids_res.data else []
            if ids:
                query = query.in_("elder_id", ids)
            else:
                return {"medicines": [], "total": 0}
        result = query.execute()
        return {"medicines": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.post("/medicines")
async def add_medicine(data: MedicineInput, request: Request):
    user = get_current_user(request)
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can add medicines")
    try:
        db = get_supabase()
        med_data = {
            "elder_id": data.elder_id,
            "name": data.name,
            "dosage": data.dosage,
            "frequency": data.frequency,
            "time": data.time,
            "status": "pending"
        }
        result = db.table("medicines").insert(med_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to add medicine")
        return {"medicine": result.data[0], "message": "Medicine added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.patch("/medicines/{medicine_id}/status")
async def update_medicine_status(medicine_id: str, data: MedicineStatusUpdate, request: Request):
    user = get_current_user(request)
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can update medicine status")
    if data.status not in ["pending", "taken", "missed"]:
        raise HTTPException(status_code=400, detail="Status must be pending, taken, or missed")
    try:
        db = get_supabase()
        result = db.table("medicines").update({"status": data.status}).eq("id", medicine_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Medicine not found")
        return {"medicine": result.data[0], "message": "Medicine status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@dashboard_router.get("/users")
async def get_users(request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view users")
    try:
        db = get_supabase()
        result = db.table("users").select("id, email, full_name, role, phone, created_at").order("created_at", desc=True).execute()
        return {"users": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.get("/caregivers")
async def get_caregivers(request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list caregivers explicitly")
    try:
        db = get_supabase()
        result = db.table("users").select("id, full_name, email").eq("role", "caregiver").order("full_name").execute()
        return {"caregivers": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.post("/assign-caregiver")
async def assign_caregiver(data: AssignCaregiverRequest, request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign caregivers")
    try:
        db = get_supabase()
        # Verify caregiver exists
        caregiver_res = db.table("users").select("email").eq("id", data.caregiver_id).eq("role", "caregiver").execute()
        if not caregiver_res.data:
            raise HTTPException(status_code=404, detail="Caregiver not found")
            
        caregiver_email = caregiver_res.data[0]["email"]
        
        # Update elder
        result = db.table("elders").update({
            "assigned_caregiver_id": data.caregiver_id,
            "caregiver_email": caregiver_email
        }).eq("id", data.elder_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Elder not found")
            
        return {"message": "Caregiver assigned successfully", "elder": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.get("/family-members")
async def get_family_members(request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list family members explicitly")
    try:
        db = get_supabase()
        result = db.table("users").select("id, full_name, email").eq("role", "family").order("full_name").execute()
        return {"family_members": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.post("/assign-family")
async def assign_family(data: AssignFamilyRequest, request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign family members")
    try:
        db = get_supabase()
        # Verify family member exists
        family_res = db.table("users").select("email").eq("id", data.family_id).eq("role", "family").execute()
        if not family_res.data:
            raise HTTPException(status_code=404, detail="Family member not found")
            
        family_email = family_res.data[0]["email"]
        
        # Update elder
        result = db.table("elders").update({
            "family_contact_id": data.family_id,
            "family_contact_email": family_email
        }).eq("id", data.elder_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Elder not found")
            
        return {"message": "Family member assigned successfully", "elder": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.get("/elders")
async def get_elders(request: Request):
    user = get_current_user(request)
    try:
        db = get_supabase()
        if user["role"] == "admin":
            result = db.table("elders").select("*").order("full_name").execute()
        elif user["role"] == "caregiver":
            result = db.table("elders").select("*").eq("assigned_caregiver_id", user["user_id"]).order("full_name").execute()
        else:
            result = db.table("elders").select("*").eq("family_contact_id", user["user_id"]).order("full_name").execute()
        return {"elders": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@dashboard_router.post("/elders")
async def create_elder(data: ElderCreateRequest, request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create elder profiles")
    try:
        db = get_supabase()
        elder_data = {
            "full_name": data.full_name,
            "age": data.age,
            "gender": data.gender,
            "blood_group": data.blood_group,
            "medical_conditions": data.medical_conditions,
            "allergies": data.allergies
        }
        result = db.table("elders").insert(elder_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create elder profile")
        return {"elder": result.data[0], "message": "Elder profile created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ROOT ENDPOINTS ====================
app.include_router(auth_router)
app.include_router(messaging_router)
app.include_router(emergency_router)
app.include_router(dashboard_router)

@app.get("/")
async def root():
    return {"message": "Elder Care Management System API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "elder-care-api"}
