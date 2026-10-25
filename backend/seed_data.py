import os
import random
from datetime import datetime, timedelta
import bcrypt
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in .env")
    exit(1)

db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def upsert_user(email, full_name, role, password, phone=None):
    """Insert user if not exists, return their ID."""
    result = db.table("users").select("id").eq("email", email).execute()
    if result.data:
        return result.data[0]["id"]
    pwd_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    payload = {"email": email, "full_name": full_name, "role": role, "password_hash": pwd_hash}
    if phone:
        payload["phone"] = phone
    res = db.table("users").insert(payload).execute()
    return res.data[0]["id"]


def seed_database():
    print("Starting enriched database seeding...")

    # ── ADMIN ──────────────────────────────────────────────────
    admin_id = upsert_user("admin@eldercare.com", "System Admin", "admin", "admin123", "+1-800-000-0001")
    print(f"Admin: {admin_id}")

    # ── CAREGIVERS ─────────────────────────────────────────────
    caregivers = [
        ("sarah.nurse@eldercare.com",  "Nurse Sarah Johnson",    "nurse123",  "+1-555-201-0001"),
        ("james.cg@eldercare.com",     "James Okafor RN",        "nurse123",  "+1-555-201-0002"),
        ("priya.cg@eldercare.com",     "Dr. Priya Sharma",       "nurse123",  "+1-555-201-0003"),
        ("caregiver@eldercare.com",    "Nurse Demo",             "nurse123",  "+1-555-201-0099"),
    ]
    cg_ids = []
    for email, name, pwd, phone in caregivers:
        uid = upsert_user(email, name, "caregiver", pwd, phone)
        cg_ids.append(uid)
        print(f"  Caregiver: {name}")

    # ── FAMILY MEMBERS ─────────────────────────────────────────
    family_users = [
        ("family@eldercare.com",       "Rajesh Kumar",           "family123", "+1-555-301-0001"),
        ("emily.fam@eldercare.com",    "Emily Chen",             "family123", "+1-555-301-0002"),
        ("carlos.fam@eldercare.com",   "Carlos Martinez",        "family123", "+1-555-301-0003"),
        ("ananya.fam@eldercare.com",   "Ananya Patel",           "family123", "+1-555-301-0004"),
        ("tom.fam@eldercare.com",      "Thomas Williams",        "family123", "+1-555-301-0005"),
    ]
    fam_ids = []
    for email, name, pwd, phone in family_users:
        uid = upsert_user(email, name, "family", pwd, phone)
        fam_ids.append(uid)
        print(f"  Family: {name}")

    print("Users ready.")

    # ── ELDERS ─────────────────────────────────────────────────
    elders_data = [
        {
            "full_name": "Robert Jenkins",
            "age": 82, "gender": "male", "blood_group": "O+",
            "medical_conditions": "Hypertension, Type 2 Diabetes",
            "allergies": "Penicillin",
            "caregiver_idx": 0, "family_idx": 0,
        },
        {
            "full_name": "Martha Stewart",
            "age": 76, "gender": "female", "blood_group": "A-",
            "medical_conditions": "Osteoporosis, Mild Dementia",
            "allergies": "Aspirin",
            "caregiver_idx": 0, "family_idx": 1,
        },
        {
            "full_name": "William Chen",
            "age": 91, "gender": "male", "blood_group": "B+",
            "medical_conditions": "Chronic Heart Failure, Atrial Fibrillation",
            "allergies": "Sulfa Drugs",
            "caregiver_idx": 1, "family_idx": 1,
        },
        {
            "full_name": "Dorothy Alvarez",
            "age": 78, "gender": "female", "blood_group": "AB+",
            "medical_conditions": "Parkinson's Disease, Hypertension",
            "allergies": "None",
            "caregiver_idx": 1, "family_idx": 2,
        },
        {
            "full_name": "Harold Thompson",
            "age": 85, "gender": "male", "blood_group": "O-",
            "medical_conditions": "Chronic Kidney Disease Stage 3",
            "allergies": "Ibuprofen, Codeine",
            "caregiver_idx": 2, "family_idx": 2,
        },
        {
            "full_name": "Evelyn Patel",
            "age": 73, "gender": "female", "blood_group": "A+",
            "medical_conditions": "COPD, Type 2 Diabetes",
            "allergies": "Latex",
            "caregiver_idx": 2, "family_idx": 3,
        },
        {
            "full_name": "George Morrison",
            "age": 88, "gender": "male", "blood_group": "B-",
            "medical_conditions": "Alzheimer's Disease, Hypertension",
            "allergies": "None",
            "caregiver_idx": 0, "family_idx": 3,
        },
        {
            "full_name": "Frances Kim",
            "age": 80, "gender": "female", "blood_group": "O+",
            "medical_conditions": "Post-Stroke Recovery, Dysphagia",
            "allergies": "Shellfish",
            "caregiver_idx": 1, "family_idx": 4,
        },
        {
            "full_name": "Arthur Nguyen",
            "age": 94, "gender": "male", "blood_group": "AB-",
            "medical_conditions": "Congestive Heart Failure, Glaucoma",
            "allergies": "Warfarin (high dose)",
            "caregiver_idx": 2, "family_idx": 4,
        },
        {
            "full_name": "Helen Okafor",
            "age": 69, "gender": "female", "blood_group": "A+",
            "medical_conditions": "Rheumatoid Arthritis, Mild Cognitive Impairment",
            "allergies": "Pollen, Dust Mites",
            "caregiver_idx": 3, "family_idx": 0,
        },
    ]

    elders_created = []
    for elder in elders_data:
        res = db.table("elders").select("id").eq("full_name", elder["full_name"]).execute()
        if not res.data:
            caregiver_id = cg_ids[elder["caregiver_idx"]]
            family_id = fam_ids[elder["family_idx"]]
            cg_email = caregivers[elder["caregiver_idx"]][0]
            fam_email = family_users[elder["family_idx"]][0]

            e_res = db.table("elders").insert({
                "full_name": elder["full_name"],
                "age": elder["age"],
                "gender": elder["gender"],
                "blood_group": elder["blood_group"],
                "medical_conditions": elder["medical_conditions"],
                "allergies": elder["allergies"],
                "assigned_caregiver_id": caregiver_id,
                "family_contact_id": family_id,
                "caregiver_email": cg_email,
                "family_contact_email": fam_email,
            }).execute()
            elder_id = e_res.data[0]["id"]
            print(f"  Created elder: {elder['full_name']}")
        else:
            elder_id = res.data[0]["id"]
            print(f"  Elder exists: {elder['full_name']}")
        elders_created.append(elder_id)

    print(f"Elders ready: {len(elders_created)} records.")

    # ── HEALTH METRICS (last 7 days per elder) ─────────────────
    print("Generating health metrics...")
    for elder_id in elders_created:
        for day in range(7, -1, -1):
            date = datetime.utcnow() - timedelta(days=day)
            db.table("health_metrics").insert({
                "elder_id": elder_id,
                "heart_rate": random.randint(62, 90),
                "blood_pressure_systolic": random.randint(108, 145),
                "blood_pressure_diastolic": random.randint(65, 92),
                "temperature": round(random.uniform(36.2, 37.5), 1),
                "oxygen_level": random.randint(93, 100),
                "activity_level": random.choice(["sedentary", "light", "moderate", "active"]),
                "recorded_at": date.isoformat()
            }).execute()

    # ── EMERGENCIES ─────────────────────────────────────────────
    print("Generating emergencies...")
    emergency_samples = [
        {"elder_id": elders_created[0], "triggered_by": fam_ids[0], "type": "fall",
         "description": "Found on the floor in the living room", "status": "resolved",
         "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
         "resolved_at": (datetime.utcnow() - timedelta(days=3) + timedelta(hours=1)).isoformat()},
        {"elder_id": elders_created[1], "triggered_by": cg_ids[0], "type": "medical",
         "description": "Chest pain – ambulance called", "status": "active",
         "created_at": datetime.utcnow().isoformat()},
        {"elder_id": elders_created[2], "triggered_by": cg_ids[1], "type": "unresponsive",
         "description": "Patient unresponsive during breakfast", "status": "resolved",
         "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
         "resolved_at": (datetime.utcnow() - timedelta(hours=22)).isoformat()},
    ]
    for em in emergency_samples:
        try:
            db.table("emergencies").insert(em).execute()
        except Exception as ex:
            print(f"  (Emergency insert skipped: {ex})")

    # ── MESSAGES ───────────────────────────────────────────────
    print("Generating messages...")
    messages_samples = [
        {"sender_id": fam_ids[0], "recipient_email": caregivers[0][0],
         "subject": "Medication question", "body": "Did mom take her blood pressure meds this morning?", "status": "sent"},
        {"sender_id": fam_ids[1], "recipient_email": caregivers[1][0],
         "subject": "Weekly update request", "body": "Could you send a weekly health summary for William?", "status": "sent"},
        {"sender_id": cg_ids[0], "recipient_email": family_users[0][0],
         "subject": "Health update", "body": "Robert had a good day. BP readings are stable.", "status": "sent"},
    ]
    for msg in messages_samples:
        try:
            db.table("messages").insert(msg).execute()
        except Exception as ex:
            print(f"  (Message insert skipped: {ex})")

    # ── CARE TASKS ─────────────────────────────────────────────
    print("Generating care tasks...")
    care_tasks_samples = [
        # Robert Jenkins
        {"elder_id": elders_created[0], "task_name": "Morning blood pressure check",       "status": "completed"},
        {"elder_id": elders_created[0], "task_name": "Administer insulin (8 AM)",          "status": "completed"},
        {"elder_id": elders_created[0], "task_name": "Afternoon walk (20 mins)",            "status": "pending"},
        # Martha Stewart
        {"elder_id": elders_created[1], "task_name": "Memory exercise session",             "status": "completed"},
        {"elder_id": elders_created[1], "task_name": "Calcium supplement with lunch",       "status": "pending"},
        {"elder_id": elders_created[1], "task_name": "Evening fall-risk mobility check",    "status": "pending"},
        # William Chen
        {"elder_id": elders_created[2], "task_name": "Cardiac monitoring (12-lead ECG)",   "status": "completed"},
        {"elder_id": elders_created[2], "task_name": "Fluid intake log (1.5L target)",      "status": "completed"},
        # Dorothy Alvarez
        {"elder_id": elders_created[3], "task_name": "Physical therapy exercises",          "status": "pending"},
        {"elder_id": elders_created[3], "task_name": "Parkinson's tremor assessment",       "status": "pending"},
        # Harold Thompson
        {"elder_id": elders_created[4], "task_name": "Weight measurement (morning)",        "status": "completed"},
        {"elder_id": elders_created[4], "task_name": "Restrict dietary potassium — verify meal", "status": "pending"},
        # Evelyn Patel
        {"elder_id": elders_created[5], "task_name": "Inhaler administration (morning)",   "status": "completed"},
        {"elder_id": elders_created[5], "task_name": "Blood glucose check (fasting)",       "status": "completed"},
        # George Morrison
        {"elder_id": elders_created[6], "task_name": "Reality orientation activity",        "status": "pending"},
        {"elder_id": elders_created[6], "task_name": "Antihypertensive given at 9 AM",      "status": "completed"},
        # Frances Kim
        {"elder_id": elders_created[7], "task_name": "Swallowing therapy session",          "status": "pending"},
        {"elder_id": elders_created[7], "task_name": "Stroke recovery physio",              "status": "completed"},
        # Arthur Nguyen
        {"elder_id": elders_created[8], "task_name": "Eye drop administration (glaucoma)", "status": "completed"},
        {"elder_id": elders_created[8], "task_name": "Heart failure daily weight check",    "status": "pending"},
        # Helen Okafor
        {"elder_id": elders_created[9], "task_name": "Joint mobility exercise",             "status": "completed"},
        {"elder_id": elders_created[9], "task_name": "Cognitive function screening",        "status": "pending"},
    ]
    task_count = 0
    for task in care_tasks_samples:
        try:
            db.table("care_tasks").insert(task).execute()
            task_count += 1
        except Exception as ex:
            print(f"  (Care task skipped: {ex})")

    # ── MEDICINES ──────────────────────────────────────────────
    print("Generating medicines...")
    medicines_samples = [
        # Robert Jenkins – Hypertension + Diabetes
        {"elder_id": elders_created[0], "name": "Lisinopril",     "dosage": "10mg",  "frequency": "Daily",        "time": "8:00 AM with water",    "status": "taken"},
        {"elder_id": elders_created[0], "name": "Metformin",       "dosage": "500mg", "frequency": "Twice Daily",  "time": "After breakfast & dinner", "status": "taken"},
        {"elder_id": elders_created[0], "name": "Aspirin",         "dosage": "81mg",  "frequency": "Daily",        "time": "Morning with food",      "status": "pending"},
        # Martha Stewart – Osteoporosis + Dementia
        {"elder_id": elders_created[1], "name": "Alendronate",     "dosage": "70mg",  "frequency": "Weekly",       "time": "Monday morning, fasting", "status": "taken"},
        {"elder_id": elders_created[1], "name": "Donepezil",       "dosage": "5mg",   "frequency": "Daily",        "time": "Bedtime",                "status": "pending"},
        {"elder_id": elders_created[1], "name": "Calcium + Vit D", "dosage": "600mg", "frequency": "Twice Daily",  "time": "With lunch & dinner",    "status": "taken"},
        # William Chen – Heart Failure + AFib
        {"elder_id": elders_created[2], "name": "Furosemide",      "dosage": "40mg",  "frequency": "Daily",        "time": "8:00 AM",                "status": "taken"},
        {"elder_id": elders_created[2], "name": "Digoxin",         "dosage": "0.125mg","frequency": "Daily",       "time": "9:00 AM",                "status": "taken"},
        {"elder_id": elders_created[2], "name": "Rivaroxaban",     "dosage": "20mg",  "frequency": "Daily",        "time": "With evening meal",      "status": "missed"},
        # Dorothy Alvarez – Parkinson's + Hypertension
        {"elder_id": elders_created[3], "name": "Levodopa/Carbidopa","dosage": "100/25mg","frequency": "Three times daily","time": "7 AM, 1 PM, 7 PM", "status": "taken"},
        {"elder_id": elders_created[3], "name": "Amlodipine",      "dosage": "5mg",   "frequency": "Daily",        "time": "Morning",                "status": "pending"},
        # Harold Thompson – CKD
        {"elder_id": elders_created[4], "name": "Erythropoietin",  "dosage": "4000 IU","frequency": "Weekly",      "time": "Monday injection",        "status": "taken"},
        {"elder_id": elders_created[4], "name": "Phosphate binder","dosage": "800mg", "frequency": "Three times daily","time": "With each meal",      "status": "pending"},
        # Evelyn Patel – COPD + Diabetes
        {"elder_id": elders_created[5], "name": "Tiotropium inhaler","dosage": "18mcg","frequency": "Daily",       "time": "Morning",                "status": "taken"},
        {"elder_id": elders_created[5], "name": "Salbutamol inhaler","dosage": "100mcg","frequency": "As needed",  "time": "When breathless",        "status": "pending"},
        {"elder_id": elders_created[5], "name": "Glipizide",       "dosage": "5mg",   "frequency": "Daily",        "time": "30 min before breakfast","status": "taken"},
        # George Morrison – Alzheimer's + Hypertension
        {"elder_id": elders_created[6], "name": "Memantine",       "dosage": "10mg",  "frequency": "Twice Daily",  "time": "Morning & evening",      "status": "taken"},
        {"elder_id": elders_created[6], "name": "Ramipril",        "dosage": "5mg",   "frequency": "Daily",        "time": "Morning",                "status": "pending"},
        # Frances Kim – Post-Stroke
        {"elder_id": elders_created[7], "name": "Clopidogrel",     "dosage": "75mg",  "frequency": "Daily",        "time": "With food",              "status": "taken"},
        {"elder_id": elders_created[7], "name": "Atorvastatin",    "dosage": "40mg",  "frequency": "Daily",        "time": "Bedtime",                "status": "taken"},
        # Arthur Nguyen – Heart Failure + Glaucoma
        {"elder_id": elders_created[8], "name": "Latanoprost drops","dosage": "1 drop","frequency": "Daily",        "time": "Bedtime – left eye",     "status": "taken"},
        {"elder_id": elders_created[8], "name": "Carvedilol",      "dosage": "6.25mg","frequency": "Twice Daily",  "time": "Morning & evening with food","status": "pending"},
        # Helen Okafor – RA + Mild Cognitive
        {"elder_id": elders_created[9], "name": "Methotrexate",    "dosage": "7.5mg", "frequency": "Weekly",       "time": "Saturday morning",       "status": "taken"},
        {"elder_id": elders_created[9], "name": "Folic acid",      "dosage": "5mg",   "frequency": "Daily",        "time": "Every day except Saturday","status": "taken"},
    ]
    med_count = 0
    for med in medicines_samples:
        try:
            db.table("medicines").insert(med).execute()
            med_count += 1
        except Exception as ex:
            print(f"  (Medicine insert skipped: {ex})")

    print("\n✅ Enriched seeding completed!")
    print(f"   👴 {len(elders_created)} patients")
    print(f"   🩺 {len(caregivers)} caregivers")
    print(f"   👨‍👩‍👧 {len(family_users)} family accounts")
    print(f"   ✅ {task_count} care tasks")
    print(f"   💊 {med_count} medicines")
    print("\nLog in as admin@eldercare.com / admin123 to see the Datasets tab.")


if __name__ == "__main__":
    seed_database()
