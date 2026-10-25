from fastapi import APIRouter, HTTPException, Request
from .db import get_supabase
from .auth import get_current_user
from .models import TriggerEmergencyRequest
from .messaging import send_email

router = APIRouter(prefix="/api/emergency", tags=["Emergency"])


@router.post("/trigger")
async def trigger_emergency(data: TriggerEmergencyRequest, request: Request):
    """
    Trigger a SOC emergency alert.
    Sends immediate email notifications to the assigned caregiver and family contact.
    Accessible by all authenticated roles.
    """
    user = get_current_user(request)

    try:
        db = get_supabase()

        # Get elder details
        elder_result = db.table("elders").select("*").eq("id", data.elder_id).execute()
        if not elder_result.data:
            raise HTTPException(status_code=404, detail="Elder not found")

        elder = elder_result.data[0]

        # Log the emergency in the database
        emergency_data = {
            "elder_id": data.elder_id,
            "triggered_by": user["user_id"],
            "type": data.type,
            "description": data.description or f"SOC Emergency triggered for {elder['full_name']}",
            "status": "active"
        }
        result = db.table("emergencies").insert(emergency_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to log emergency")

        emergency_id = result.data[0]["id"]

        # Build emergency email content
        emergency_body = f"""
        <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h2 style="margin: 0;">🚨 EMERGENCY ALERT</h2>
        </div>
        <p><strong>Elder:</strong> {elder['full_name']}</p>
        <p><strong>Type:</strong> {data.type.upper()}</p>
        <p><strong>Description:</strong> {data.description or 'SOC Emergency - Immediate attention required'}</p>
        <p><strong>Triggered by:</strong> {user['full_name']}</p>
        <p><strong>Emergency ID:</strong> {emergency_id}</p>
        <div style="background: rgba(220, 38, 38, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 16px;">
            <p style="margin: 0; font-weight: bold;">⚠️ Please respond to this emergency immediately.</p>
        </div>
        """

        # Send email notifications
        notifications_sent = []

        # Notify assigned caregiver
        if elder.get("caregiver_email"):
            sent = send_email(
                elder["caregiver_email"],
                f"🚨 EMERGENCY: {elder['full_name']} - {data.type.upper()}",
                emergency_body
            )
            notifications_sent.append({"role": "caregiver", "email": elder["caregiver_email"], "sent": sent})

        # Notify family contact
        if elder.get("family_contact_email"):
            sent = send_email(
                elder["family_contact_email"],
                f"🚨 EMERGENCY: {elder['full_name']} - {data.type.upper()}",
                emergency_body
            )
            notifications_sent.append({"role": "family", "email": elder["family_contact_email"], "sent": sent})

        return {
            "id": emergency_id,
            "status": "active",
            "message": "Emergency alert triggered successfully",
            "notifications": notifications_sent,
            "elder_name": elder["full_name"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_emergency_history(request: Request):
    """Get emergency history. Admins see all; others see their own."""
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


@router.patch("/resolve/{emergency_id}")
async def resolve_emergency(emergency_id: str, request: Request):
    """Resolve an active emergency. Only admins and caregivers can resolve."""
    user = get_current_user(request)

    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can resolve emergencies")

    try:
        db = get_supabase()

        from datetime import datetime
        result = db.table("emergencies").update({
            "status": "resolved",
            "resolved_at": datetime.utcnow().isoformat()
        }).eq("id", emergency_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Emergency not found")

        return {"status": "resolved", "message": "Emergency resolved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
