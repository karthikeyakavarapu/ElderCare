import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from functools import wraps
from .db import get_supabase
from .models import SignupRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

JWT_SECRET = os.getenv("JWT_SECRET", "elder-care-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# ==================== ROLE PERMISSIONS (Least Privilege) ====================
ROLE_PERMISSIONS = {
    "admin": ["dashboard:full", "users:manage", "elders:manage", "emergency:manage", "messages:all", "analytics:full"],
    "caregiver": ["dashboard:limited", "elders:assigned", "emergency:trigger", "emergency:view", "messages:send", "analytics:assigned"],
    "family": ["dashboard:minimal", "elders:own", "emergency:trigger", "emergency:view_own", "messages:send"],
}


def create_token(user_data: dict) -> str:
    """Create a JWT token for an authenticated user."""
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
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(request: Request) -> dict:
    """Extract and verify the current user from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]
    return verify_token(token)


def require_role(*allowed_roles):
    """Decorator to enforce role-based access control."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request") or (args[0] if args else None)
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")
            user = get_current_user(request)
            if user["role"] not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {user['role']}"
                )
            kwargs["current_user"] = user
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# ==================== AUTH ENDPOINTS ====================

@router.post("/signup", response_model=AuthResponse)
async def signup(data: SignupRequest):
    """Register a new user with role-based access."""
    try:
        db = get_supabase()

        # Check if user already exists
        existing = db.table("users").select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Validate role
        if data.role not in ["admin", "caregiver", "family"]:
            raise HTTPException(status_code=400, detail="Invalid role. Must be: admin, caregiver, or family")

        # Hash the password
        password_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Insert user
        user_data = {
            "email": data.email,
            "full_name": data.full_name,
            "password_hash": password_hash,
            "role": data.role,
            "phone": data.phone
        }
        result = db.table("users").insert(user_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")

        user = result.data[0]
        token = create_token(user)

        return AuthResponse(
            token=token,
            user={
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
                "permissions": ROLE_PERMISSIONS.get(user["role"], [])
            },
            message="Account created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """Authenticate a user and return a JWT token."""
    try:
        db = get_supabase()

        # Find user by email
        result = db.table("users").select("*").eq("email", data.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = result.data[0]

        # Verify password
        if not bcrypt.checkpw(data.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_token(user)

        return AuthResponse(
            token=token,
            user={
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
                "permissions": ROLE_PERMISSIONS.get(user["role"], [])
            },
            message="Login successful"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_profile(request: Request):
    """Get current user's profile (protected route)."""
    user = get_current_user(request)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "permissions": ROLE_PERMISSIONS.get(user["role"], [])
    }


@router.get("/permissions")
async def get_permissions(request: Request):
    """Get current user's permissions."""
    user = get_current_user(request)
    return {
        "role": user["role"],
        "permissions": ROLE_PERMISSIONS.get(user["role"], [])
    }
