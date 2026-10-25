from fastapi import APIRouter, HTTPException, Request
from .db import get_supabase
from .auth import get_current_user
from .models import HealthMetricInput

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])


@router.get("/stats")
async def get_dashboard_stats(request: Request):
    """
    Get aggregated dashboard statistics.
    Admin: full stats | Caregiver: assigned elders | Family: own elder
    """
    user = get_current_user(request)

    try:
        db = get_supabase()

        # Get counts based on role
        if user["role"] == "admin":
            elders = db.table("elders").select("id", count="exact").execute()
            caregivers = db.table("users").select("id", count="exact").eq("role", "caregiver").execute()
            active_emergencies = db.table("emergencies").select("id", count="exact").eq("status", "active").execute()
            messages = db.table("messages").select("id", count="exact").execute()
            health = db.table("health_metrics").select("heart_rate, oxygen_level").execute()
        elif user["role"] == "caregiver":
            elders = db.table("elders").select("id", count="exact").eq("assigned_caregiver_id", user["user_id"]).execute()
            caregivers = {"count": 1}
            active_emergencies = db.table("emergencies").select("id, elder_id, elders!inner(assigned_caregiver_id)", count="exact").eq("status", "active").eq("elders.assigned_caregiver_id", user["user_id"]).execute()
            messages = db.table("messages").select("id", count="exact").eq("sender_id", user["user_id"]).execute()
            elder_ids_result = db.table("elders").select("id").eq("assigned_caregiver_id", user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            health = db.table("health_metrics").select("heart_rate, oxygen_level").in_("elder_id", elder_ids).execute() if elder_ids else type("obj", (), {"data": []})()
        else:
            elders = db.table("elders").select("id", count="exact").eq("family_contact_id", user["user_id"]).execute()
            caregivers = {"count": 0}
            active_emergencies = db.table("emergencies").select("id, elder_id, elders!inner(family_contact_id)", count="exact").eq("status", "active").eq("elders.family_contact_id", user["user_id"]).execute()
            messages = db.table("messages").select("id", count="exact").eq("sender_id", user["user_id"]).execute()
            elder_ids_result = db.table("elders").select("id").eq("family_contact_id", user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            health = db.table("health_metrics").select("heart_rate, oxygen_level").in_("elder_id", elder_ids).execute() if elder_ids else type("obj", (), {"data": []})()

        # Calculate averages
        avg_heart = None
        avg_oxygen = None
        if health.data:
            hearts = [h["heart_rate"] for h in health.data if h.get("heart_rate")]
            oxygens = [h["oxygen_level"] for h in health.data if h.get("oxygen_level")]
            avg_heart = round(sum(hearts) / len(hearts), 1) if hearts else None
            avg_oxygen = round(sum(oxygens) / len(oxygens), 1) if oxygens else None

        return {
            "total_elders": elders.count if hasattr(elders, "count") else (elders.get("count", 0) if isinstance(elders, dict) else 0),
            "total_caregivers": caregivers.count if hasattr(caregivers, "count") else (caregivers.get("count", 0) if isinstance(caregivers, dict) else 0),
            "active_emergencies": active_emergencies.count if hasattr(active_emergencies, "count") else 0,
            "messages_sent": messages.count if hasattr(messages, "count") else 0,
            "avg_heart_rate": avg_heart,
            "avg_oxygen_level": avg_oxygen
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health-metrics")
async def get_health_metrics(request: Request, elder_id: str = None, days: int = 7):
    """
    Get time-series health metrics for chart rendering.
    Returns data for the past N days.
    """
    user = get_current_user(request)

    try:
        db = get_supabase()
        from datetime import datetime, timedelta

        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

        query = db.table("health_metrics").select("*").gte("recorded_at", start_date).order("recorded_at", desc=False)

        if elder_id:
            query = query.eq("elder_id", elder_id)
        elif user["role"] == "caregiver":
            # Only show metrics for assigned elders
            elder_ids_result = db.table("elders").select("id").eq("assigned_caregiver_id", user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            if elder_ids:
                query = query.in_("elder_id", elder_ids)
        elif user["role"] == "family":
            elder_ids_result = db.table("elders").select("id").eq("family_contact_id", user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            if elder_ids:
                query = query.in_("elder_id", elder_ids)

        result = query.limit(200).execute()

        return {"metrics": result.data, "total": len(result.data), "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emergency-summary")
async def get_emergency_summary(request: Request):
    """
    Get emergency summary data for chart rendering.
    Groups emergencies by type and status.
    """
    user = get_current_user(request)

    try:
        db = get_supabase()

        if user["role"] == "admin":
            result = db.table("emergencies").select("type, status, created_at").order("created_at", desc=False).execute()
        elif user["role"] == "caregiver":
            result = db.table("emergencies").select("type, status, created_at, elder_id, elders!inner(assigned_caregiver_id)").eq("elders.assigned_caregiver_id", user["user_id"]).order("created_at", desc=False).execute()
        else:
            result = db.table("emergencies").select("type, status, created_at, elder_id, elders!inner(family_contact_id)").eq("elders.family_contact_id", user["user_id"]).order("created_at", desc=False).execute()

        # Group by type
        type_counts = {}
        status_counts = {"active": 0, "resolved": 0, "cancelled": 0}
        for e in result.data:
            t = e.get("type", "other")
            s = e.get("status", "active")
            type_counts[t] = type_counts.get(t, 0) + 1
            if s in status_counts:
                status_counts[s] += 1

        return {
            "by_type": [{"name": k, "count": v} for k, v in type_counts.items()],
            "by_status": [{"name": k, "count": v} for k, v in status_counts.items()],
            "total": len(result.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health-metrics")
async def record_health_metric(data: HealthMetricInput, request: Request):
    """Record a new health metric. Only admins and caregivers can record."""
    user = get_current_user(request)

    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can record health metrics")

    try:
        db = get_supabase()

        metric_data = {
            "elder_id": data.elder_id,
            "heart_rate": data.heart_rate,
            "blood_pressure_systolic": data.blood_pressure_systolic,
            "blood_pressure_diastolic": data.blood_pressure_diastolic,
            "temperature": data.temperature,
            "oxygen_level": data.oxygen_level,
            "activity_level": data.activity_level,
            "notes": data.notes
        }
        # Remove None values
        metric_data = {k: v for k, v in metric_data.items() if v is not None}

        result = db.table("health_metrics").insert(metric_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to record health metric")

        return {"id": result.data[0]["id"], "message": "Health metric recorded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/elders")
async def get_elders(request: Request):
    """Get list of elders based on user's role."""
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


@router.get("/medicines")
async def get_medicines(request: Request, elder_id: str = None):
    """Get list of medicines for a patient."""
    user = get_current_user(request)

    try:
        db = get_supabase()
        
        query = db.table("medicines").select("*").order("created_at", desc=False)
        
        if elder_id:
            query = query.eq("elder_id", elder_id)
        elif user["role"] == "caregiver":
            # Only show medicines for assigned elders
            elder_ids_result = db.table("elders").select("id").eq("assigned_caregiver_id", user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            if elder_ids:
                query = query.in_("elder_id", elder_ids)
        elif user["role"] == "family":
            elder_ids_result = db.table("elders").select("id").eq("family_contact_id", user["user_id"]).execute()
            elder_ids = [e["id"] for e in elder_ids_result.data] if elder_ids_result.data else []
            if elder_ids:
                query = query.in_("elder_id", elder_ids)

        result = query.execute()
        return {"medicines": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/medicines")
async def add_medicine(request: Request, data: dict):
    """Add a new medicine schedule. Accessible by admins and caregivers."""
    user = get_current_user(request)
    
    if user["role"] not in ["admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only admins and caregivers can add medicines")

    try:
        db = get_supabase()
        
        medicine_data = {
            "elder_id": data.get("elder_id"),
            "name": data.get("name"),
            "dosage": data.get("dosage"),
            "frequency": data.get("frequency"),
            "time": data.get("time"),
            "status": "pending"
        }
        
        result = db.table("medicines").insert(medicine_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to add medicine")
            
        return {"medicine": result.data[0], "message": "Medicine added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/medicines/{medicine_id}/status")
async def update_medicine_status(medicine_id: str, request: Request, data: dict):
    """Update medicine taking status (taken, missed, pending)."""
    user = get_current_user(request)
    status = data.get("status")

    if status not in ["taken", "missed", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        db = get_supabase()
        from datetime import datetime
        
        update_data = {
            "status": status,
            "last_updated": datetime.utcnow().isoformat(),
            "updated_by": user["user_id"]
        }
        
        result = db.table("medicines").update(update_data).eq("id", medicine_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Medicine not found")
            
        return {"status": "success", "medicine": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
#  DATASET ENDPOINTS  (Admin-only, for the Datasets page)
# ─────────────────────────────────────────────────────────────

@router.get("/patients-dataset")
async def get_patients_dataset(request: Request):
    """Return full patient dataset with caregiver & family names. Admin only."""
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        db = get_supabase()
        elders = db.table("elders").select("*").order("full_name").execute()
        users_res = db.table("users").select("id, full_name, email, phone, role").execute()
        user_map = {u["id"]: u for u in users_res.data}

        rows = []
        for e in elders.data:
            cg = user_map.get(e.get("assigned_caregiver_id"), {})
            fm = user_map.get(e.get("family_contact_id"), {})
            rows.append({
                "id": e["id"],
                "full_name": e.get("full_name", "—"),
                "age": e.get("age"),
                "gender": e.get("gender", "—"),
                "blood_group": e.get("blood_group", "—"),
                "medical_conditions": e.get("medical_conditions", "None"),
                "allergies": e.get("allergies", "None"),
                "room_number": e.get("room_number", "—"),
                "admission_date": e.get("admission_date", "—"),
                "caregiver_name": cg.get("full_name", "Unassigned"),
                "caregiver_email": cg.get("email", "—"),
                "family_name": fm.get("full_name", "Unassigned"),
                "family_email": fm.get("email", "—"),
                "family_phone": fm.get("phone", "—"),
            })
        return {"patients": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/family-dataset")
async def get_family_dataset(request: Request):
    """Return all family-role users with their linked patients. Admin only."""
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        db = get_supabase()
        families = db.table("users").select("id, full_name, email, phone, created_at").eq("role", "family").execute()
        elders_res = db.table("elders").select("id, full_name, age, family_contact_id").execute()

        # Build map: family_id -> list of elders
        family_patients: dict = {}
        for e in elders_res.data:
            fid = e.get("family_contact_id")
            if fid:
                family_patients.setdefault(fid, []).append(e["full_name"])

        rows = []
        for fm in families.data:
            patients = family_patients.get(fm["id"], [])
            rows.append({
                "id": fm["id"],
                "full_name": fm["full_name"],
                "email": fm["email"],
                "phone": fm.get("phone", "—"),
                "linked_patients": ", ".join(patients) if patients else "None",
                "patient_count": len(patients),
                "joined": fm.get("created_at", "—"),
            })
        return {"family_members": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/caregiver-assignments")
async def get_caregiver_assignments(request: Request):
    """Return all caregivers with their assigned patients. Admin only."""
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        db = get_supabase()
        caregivers = db.table("users").select("id, full_name, email, phone, created_at").eq("role", "caregiver").execute()
        elders_res = db.table("elders").select("id, full_name, age, medical_conditions, assigned_caregiver_id").execute()

        # Build map: caregiver_id -> list of elder dicts
        cg_patients: dict = {}
        for e in elders_res.data:
            cid = e.get("assigned_caregiver_id")
            if cid:
                cg_patients.setdefault(cid, []).append(e)

        rows = []
        for cg in caregivers.data:
            patients = cg_patients.get(cg["id"], [])
            rows.append({
                "id": cg["id"],
                "full_name": cg["full_name"],
                "email": cg["email"],
                "phone": cg.get("phone", "—"),
                "assigned_count": len(patients),
                "patient_names": ", ".join(p["full_name"] for p in patients) if patients else "None",
                "patient_conditions": "; ".join(
                    f"{p['full_name']}: {p.get('medical_conditions', 'N/A')}" for p in patients
                ) if patients else "—",
                "joined": cg.get("created_at", "—"),
            })
        return {"caregivers": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/care-tasks-dataset")
async def get_care_tasks_dataset(request: Request):
    """Return all care tasks across all patients with elder name. Admin only."""
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        db = get_supabase()
        tasks_res = db.table("care_tasks").select("*").order("created_at", desc=True).execute()
        elders_res = db.table("elders").select("id, full_name").execute()
        elder_map = {e["id"]: e["full_name"] for e in elders_res.data}

        rows = []
        for t in tasks_res.data:
            rows.append({
                "id": t["id"],
                "patient_name": elder_map.get(t.get("elder_id"), "Unknown"),
                "task_name": t.get("task_name", "—"),
                "status": t.get("status", "pending"),
                "created_at": t.get("created_at", "—"),
                "updated_at": t.get("updated_at", "—"),
            })
        return {"tasks": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/medicines-dataset")
async def get_medicines_dataset(request: Request):
    """Return all medicines across all patients with elder name. Admin only."""
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        db = get_supabase()
        meds_res = db.table("medicines").select("*").order("created_at", desc=True).execute()
        elders_res = db.table("elders").select("id, full_name").execute()
        elder_map = {e["id"]: e["full_name"] for e in elders_res.data}

        rows = []
        for m in meds_res.data:
            rows.append({
                "id": m["id"],
                "patient_name": elder_map.get(m.get("elder_id"), "Unknown"),
                "name": m.get("name", "—"),
                "dosage": m.get("dosage", "—"),
                "frequency": m.get("frequency", "—"),
                "time": m.get("time", "—"),
                "status": m.get("status", "pending"),
                "created_at": m.get("created_at", "—"),
            })
        return {"medicines": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

