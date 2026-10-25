from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ==================== AUTH MODELS ====================

class SignupRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "family"  # admin, caregiver, family
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict
    message: str


# ==================== MESSAGING MODELS ====================

class SendMessageRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str


class MessageResponse(BaseModel):
    id: str
    status: str
    message: str


# ==================== EMERGENCY MODELS ====================

class TriggerEmergencyRequest(BaseModel):
    elder_id: str
    type: str = "soc"  # soc, medical, fall, other
    description: Optional[str] = None


class EmergencyResponse(BaseModel):
    id: str
    status: str
    message: str


# ==================== DASHBOARD MODELS ====================

class HealthMetricInput(BaseModel):
    elder_id: str
    heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_level: Optional[int] = None
    activity_level: Optional[str] = None
    notes: Optional[str] = None


class DashboardStats(BaseModel):
    total_elders: int
    total_caregivers: int
    active_emergencies: int
    messages_sent: int
    avg_heart_rate: Optional[float] = None
    avg_oxygen: Optional[float] = None


# ==================== MEDICINE MODELS ====================

class MedicineInput(BaseModel):
    elder_id: str
    name: str
    dosage: str
    frequency: str  # e.g., "Daily", "Weekly", "As needed"
    time: str       # e.g., "08:00 AM", "After meals"


class MedicineStatusUpdate(BaseModel):
    status: str     # "taken", "missed", "pending"
