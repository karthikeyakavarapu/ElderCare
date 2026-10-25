"""
Complete seed script for ElderCare demo.
Creates all tables (if missing) and inserts full demo data.
Run from: c:\\Users\\vello\\OneDrive\\Desktop\\Elder care\\backend\\
Command:   python full_seed.py
"""
import os
import random
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY not found in .env")
    exit(1)

db = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ Connected to Supabase\n")


# ── HELPERS ───────────────────────────────────────────────────────────────────

def upsert_user(email, full_name, role, password, phone=None):
    """Insert user if not exists, return their ID."""
    result = db.table("users").select("id").eq("email", email).execute()
    if result.data:
        print(f"   ↪ User exists: {full_name}")
        return result.data[0]["id"]
    pwd_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    payload = {
        "email": email, "full_name": full_name,
        "role": role, "password_hash": pwd_hash
    }
    if phone:
        payload["phone"] = phone
    res = db.table("users").insert(payload).execute()
    print(f"   ✅ Created user: {full_name} ({role})")
    return res.data[0]["id"]


def upsert_elder(full_name, age, gender, blood_group, medical_conditions,
                 allergies, caregiver_id, family_id, cg_email, fam_email):
    """Insert elder if not exists, return their ID."""
    res = db.table("elders").select("id").eq("full_name", full_name).execute()
    if res.data:
        print(f"   ↪ Elder exists: {full_name}")
        return res.data[0]["id"]
    e_res = db.table("elders").insert({
        "full_name": full_name, "age": age, "gender": gender,
        "blood_group": blood_group, "medical_conditions": medical_conditions,
        "allergies": allergies,
        "assigned_caregiver_id": caregiver_id,
        "family_contact_id": family_id,
        "caregiver_email": cg_email,
        "family_contact_email": fam_email,
    }).execute()
    print(f"   ✅ Created elder: {full_name}")
    return e_res.data[0]["id"]


# ── STEP 1: USERS ─────────────────────────────────────────────────────────────
print("=" * 55)
print("STEP 1 — Users")
print("=" * 55)

admin_id = upsert_user(
    "nithinchinna2577@gmail.com", "Nithin Vivek", "admin",
    "Nithin@2577", "+91-9876543210"
)
admin2_id = upsert_user(
    "admin@eldercare.com", "System Admin", "admin",
    "Admin@2026", "+91-9000000001"
)

caregivers_data = [
    ("sarah.nurse@eldercare.com",  "Nurse Sarah Johnson",  "Nurse@123",  "+91-9111001001"),
    ("james.cg@eldercare.com",     "James Okafor RN",      "Nurse@123",  "+91-9111001002"),
    ("priya.cg@eldercare.com",     "Dr. Priya Sharma",     "Nurse@123",  "+91-9111001003"),
    ("caregiver@eldercare.com",    "Nurse Demo",           "Nurse@123",  "+91-9111001099"),
]
cg_ids = []
for email, name, pwd, phone in caregivers_data:
    uid = upsert_user(email, name, "caregiver", pwd, phone)
    cg_ids.append(uid)

family_data = [
    ("family@eldercare.com",     "Rajesh Kumar",     "Family@123", "+91-9222001001"),
    ("emily.fam@eldercare.com",  "Emily Chen",       "Family@123", "+91-9222001002"),
    ("carlos.fam@eldercare.com", "Carlos Martinez",  "Family@123", "+91-9222001003"),
    ("ananya.fam@eldercare.com", "Ananya Patel",     "Family@123", "+91-9222001004"),
    ("tom.fam@eldercare.com",    "Thomas Williams",  "Family@123", "+91-9222001005"),
]
fam_ids = []
for email, name, pwd, phone in family_data:
    uid = upsert_user(email, name, "family", pwd, phone)
    fam_ids.append(uid)

print()


# ── STEP 2: ELDERS ────────────────────────────────────────────────────────────
print("=" * 55)
print("STEP 2 — Elders (Patients)")
print("=" * 55)

elders_spec = [
    ("Robert Jenkins",  82, "male",   "O+",  "Hypertension, Type 2 Diabetes",          "Penicillin",           0, 0),
    ("Martha Stewart",  76, "female", "A-",  "Osteoporosis, Mild Dementia",             "Aspirin",              0, 1),
    ("William Chen",    91, "male",   "B+",  "Chronic Heart Failure, Atrial Fibrillation","Sulfa Drugs",         1, 1),
    ("Dorothy Alvarez", 78, "female", "AB+", "Parkinson's Disease, Hypertension",       "None",                 1, 2),
    ("Harold Thompson", 85, "male",   "O-",  "Chronic Kidney Disease Stage 3",          "Ibuprofen, Codeine",   2, 2),
    ("Evelyn Patel",    73, "female", "A+",  "COPD, Type 2 Diabetes",                  "Latex",                2, 3),
    ("George Morrison", 88, "male",   "B-",  "Alzheimer's Disease, Hypertension",       "None",                 0, 3),
    ("Frances Kim",     80, "female", "O+",  "Post-Stroke Recovery, Dysphagia",         "Shellfish",            1, 4),
    ("Arthur Nguyen",   94, "male",   "AB-", "Congestive Heart Failure, Glaucoma",      "Warfarin (high dose)", 2, 4),
    ("Helen Okafor",    69, "female", "A+",  "Rheumatoid Arthritis, Mild Cognitive Impairment","Pollen, Dust Mites",3, 0),
]

elder_ids = []
for (name, age, gender, bg, mc, al, cg_idx, fam_idx) in elders_spec:
    eid = upsert_elder(
        name, age, gender, bg, mc, al,
        cg_ids[cg_idx], fam_ids[fam_idx],
        caregivers_data[cg_idx][0],
        family_data[fam_idx][0],
    )
    elder_ids.append(eid)

print()


# ── STEP 3: HEALTH METRICS (last 10 days) ────────────────────────────────────
print("=" * 55)
print("STEP 3 — Health Metrics (10 days per patient)")
print("=" * 55)

metric_count = 0
for eid in elder_ids:
    # Check if already seeded
    existing = db.table("health_metrics").select("id", count="exact").eq("elder_id", eid).execute()
    if existing.count and existing.count > 0:
        print(f"   ↪ Health metrics exist for elder, skipping")
        continue
    for day in range(10, -1, -1):
        date = datetime.utcnow() - timedelta(days=day)
        db.table("health_metrics").insert({
            "elder_id": eid,
            "heart_rate": random.randint(60, 95),
            "blood_pressure_systolic": random.randint(105, 150),
            "blood_pressure_diastolic": random.randint(62, 95),
            "temperature": round(random.uniform(36.1, 37.6), 1),
            "oxygen_level": random.randint(92, 100),
            "activity_level": random.choice(["sedentary", "light", "moderate", "active"]),
            "notes": random.choice([
                "Patient stable", "Mild discomfort reported",
                "Good response to medication", "Routine check",
                "Slightly elevated BP — monitored", ""
            ]),
            "recorded_at": date.isoformat()
        }).execute()
        metric_count += 1
print(f"   ✅ Inserted {metric_count} health metric records")
print()


# ── STEP 4: CARE TASKS ────────────────────────────────────────────────────────
print("=" * 55)
print("STEP 4 — Care Tasks")
print("=" * 55)

# Map elder name -> id
elder_map = {spec[0]: elder_ids[i] for i, spec in enumerate(elders_spec)}

care_tasks = [
    # Robert Jenkins
    (elder_map["Robert Jenkins"],  "Morning blood pressure check",              "completed"),
    (elder_map["Robert Jenkins"],  "Administer insulin (8 AM)",                 "completed"),
    (elder_map["Robert Jenkins"],  "Afternoon walk (20 mins)",                  "pending"),
    (elder_map["Robert Jenkins"],  "Evening blood sugar monitoring",             "pending"),
    # Martha Stewart
    (elder_map["Martha Stewart"],  "Memory exercise session",                   "completed"),
    (elder_map["Martha Stewart"],  "Calcium supplement with lunch",             "pending"),
    (elder_map["Martha Stewart"],  "Evening fall-risk mobility check",          "pending"),
    (elder_map["Martha Stewart"],  "Bone density medication — weekly dose",     "completed"),
    # William Chen
    (elder_map["William Chen"],    "Cardiac monitoring (12-lead ECG)",          "completed"),
    (elder_map["William Chen"],    "Fluid intake log (1.5L target)",            "completed"),
    (elder_map["William Chen"],    "Daily weight for fluid retention check",    "pending"),
    # Dorothy Alvarez
    (elder_map["Dorothy Alvarez"], "Physical therapy exercises",                "pending"),
    (elder_map["Dorothy Alvarez"], "Parkinson's tremor assessment",             "pending"),
    (elder_map["Dorothy Alvarez"], "Medication on schedule (L-DOPA)",           "completed"),
    # Harold Thompson
    (elder_map["Harold Thompson"], "Weight measurement (morning)",              "completed"),
    (elder_map["Harold Thompson"], "Restrict dietary potassium — verify meal", "pending"),
    (elder_map["Harold Thompson"], "Weekly injection preparation",              "completed"),
    # Evelyn Patel
    (elder_map["Evelyn Patel"],    "Inhaler administration (morning)",          "completed"),
    (elder_map["Evelyn Patel"],    "Blood glucose check (fasting)",             "completed"),
    (elder_map["Evelyn Patel"],    "Oxygen saturation check",                  "pending"),
    # George Morrison
    (elder_map["George Morrison"], "Reality orientation activity",              "pending"),
    (elder_map["George Morrison"], "Antihypertensive given at 9 AM",           "completed"),
    (elder_map["George Morrison"], "Supervised outdoor walk",                  "pending"),
    # Frances Kim
    (elder_map["Frances Kim"],     "Swallowing therapy session",               "pending"),
    (elder_map["Frances Kim"],     "Stroke recovery physio",                   "completed"),
    (elder_map["Frances Kim"],     "Speech therapy exercise",                  "pending"),
    # Arthur Nguyen
    (elder_map["Arthur Nguyen"],   "Eye drop administration (glaucoma)",        "completed"),
    (elder_map["Arthur Nguyen"],   "Heart failure daily weight check",          "pending"),
    (elder_map["Arthur Nguyen"],   "Low-sodium diet compliance check",          "completed"),
    # Helen Okafor
    (elder_map["Helen Okafor"],    "Joint mobility exercise",                  "completed"),
    (elder_map["Helen Okafor"],    "Cognitive function screening",              "pending"),
    (elder_map["Helen Okafor"],    "Weekly methotrexate administration",        "completed"),
]

task_count = 0
for elder_id, task_name, status in care_tasks:
    # Skip if task already exists for this elder
    existing = db.table("care_tasks").select("id").eq("elder_id", elder_id).eq("task_name", task_name).execute()
    if existing.data:
        continue
    try:
        db.table("care_tasks").insert({
            "elder_id": elder_id,
            "task_name": task_name,
            "status": status
        }).execute()
        task_count += 1
    except Exception as e:
        print(f"   ⚠ Task skipped ({task_name}): {e}")

print(f"   ✅ Inserted {task_count} care tasks")
print()


# ── STEP 5: MEDICINES ─────────────────────────────────────────────────────────
print("=" * 55)
print("STEP 5 — Medicines")
print("=" * 55)

medicines = [
    # Robert Jenkins – Hypertension + Diabetes
    ("Robert Jenkins",  "Lisinopril",           "10mg",     "Daily",             "8:00 AM with water",              "taken"),
    ("Robert Jenkins",  "Metformin",            "500mg",    "Twice Daily",       "After breakfast & dinner",        "taken"),
    ("Robert Jenkins",  "Aspirin",              "81mg",     "Daily",             "Morning with food",               "pending"),
    ("Robert Jenkins",  "Atorvastatin",         "20mg",     "Daily",             "Bedtime",                         "taken"),
    # Martha Stewart – Osteoporosis + Dementia
    ("Martha Stewart",  "Alendronate",          "70mg",     "Weekly",            "Monday morning, fasting",         "taken"),
    ("Martha Stewart",  "Donepezil",            "5mg",      "Daily",             "Bedtime",                         "pending"),
    ("Martha Stewart",  "Calcium + Vit D",      "600mg",    "Twice Daily",       "With lunch & dinner",             "taken"),
    ("Martha Stewart",  "Omeprazole",           "20mg",     "Daily",             "Before breakfast",                "taken"),
    # William Chen – Heart Failure + AFib
    ("William Chen",    "Furosemide",           "40mg",     "Daily",             "8:00 AM",                         "taken"),
    ("William Chen",    "Digoxin",              "0.125mg",  "Daily",             "9:00 AM",                         "taken"),
    ("William Chen",    "Rivaroxaban",          "20mg",     "Daily",             "With evening meal",               "missed"),
    ("William Chen",    "Spironolactone",       "25mg",     "Daily",             "Morning with food",               "taken"),
    # Dorothy Alvarez – Parkinson's + Hypertension
    ("Dorothy Alvarez", "Levodopa/Carbidopa",   "100/25mg", "Three times daily", "7 AM, 1 PM, 7 PM",               "taken"),
    ("Dorothy Alvarez", "Amlodipine",           "5mg",      "Daily",             "Morning",                         "pending"),
    ("Dorothy Alvarez", "Trihexyphenidyl",      "2mg",      "Twice daily",       "Morning & afternoon",             "taken"),
    # Harold Thompson – CKD
    ("Harold Thompson", "Erythropoietin",       "4000 IU",  "Weekly",            "Monday injection",                "taken"),
    ("Harold Thompson", "Phosphate binder",     "800mg",    "Three times daily", "With each meal",                  "pending"),
    ("Harold Thompson", "Calcitriol",           "0.25mcg",  "Daily",             "Morning",                         "taken"),
    # Evelyn Patel – COPD + Diabetes
    ("Evelyn Patel",    "Tiotropium inhaler",   "18mcg",    "Daily",             "Morning",                         "taken"),
    ("Evelyn Patel",    "Salbutamol inhaler",   "100mcg",   "As needed",         "When breathless",                 "pending"),
    ("Evelyn Patel",    "Glipizide",            "5mg",      "Daily",             "30 min before breakfast",         "taken"),
    ("Evelyn Patel",    "Prednisolone",         "5mg",      "Daily",             "Morning with food",               "taken"),
    # George Morrison – Alzheimer's + Hypertension
    ("George Morrison", "Memantine",            "10mg",     "Twice Daily",       "Morning & evening",               "taken"),
    ("George Morrison", "Ramipril",             "5mg",      "Daily",             "Morning",                         "pending"),
    ("George Morrison", "Rivastigmine",         "4.6mg",    "Daily",             "Patch every 24h",                 "taken"),
    # Frances Kim – Post-Stroke
    ("Frances Kim",     "Clopidogrel",          "75mg",     "Daily",             "With food",                       "taken"),
    ("Frances Kim",     "Atorvastatin",         "40mg",     "Daily",             "Bedtime",                         "taken"),
    ("Frances Kim",     "Ramipril",             "2.5mg",    "Daily",             "Morning",                         "pending"),
    # Arthur Nguyen – Heart Failure + Glaucoma
    ("Arthur Nguyen",   "Latanoprost drops",    "1 drop",   "Daily",             "Bedtime – left eye",              "taken"),
    ("Arthur Nguyen",   "Carvedilol",           "6.25mg",   "Twice Daily",       "Morning & evening with food",     "pending"),
    ("Arthur Nguyen",   "Furosemide",           "80mg",     "Daily",             "Morning",                         "taken"),
    # Helen Okafor – RA + Mild Cognitive
    ("Helen Okafor",    "Methotrexate",         "7.5mg",    "Weekly",            "Saturday morning",                "taken"),
    ("Helen Okafor",    "Folic acid",           "5mg",      "Daily",             "Every day except Saturday",       "taken"),
    ("Helen Okafor",    "Hydroxychloroquine",   "200mg",    "Twice Daily",       "With meals",                      "pending"),
]

med_count = 0
for elder_name, med_name, dosage, freq, time_inst, status in medicines:
    elder_id = elder_map.get(elder_name)
    if not elder_id:
        print(f"   ⚠ Elder not found: {elder_name}")
        continue
    # Skip duplicates
    existing = db.table("medicines").select("id").eq("elder_id", elder_id).eq("name", med_name).execute()
    if existing.data:
        continue
    try:
        db.table("medicines").insert({
            "elder_id": elder_id, "name": med_name, "dosage": dosage,
            "frequency": freq, "time": time_inst, "status": status
        }).execute()
        med_count += 1
    except Exception as e:
        print(f"   ⚠ Medicine skipped ({med_name}): {e}")

print(f"   ✅ Inserted {med_count} medicines")
print()


# ── STEP 6: EMERGENCIES ───────────────────────────────────────────────────────
print("=" * 55)
print("STEP 6 — Emergency Records")
print("=" * 55)

emergencies = [
    {
        "elder_id": elder_map["Robert Jenkins"],
        "triggered_by": fam_ids[0],
        "type": "fall",
        "description": "Found on the floor in the living room, responsive but in pain",
        "status": "resolved",
        "resolved_at": (datetime.utcnow() - timedelta(days=3) + timedelta(hours=1)).isoformat(),
    },
    {
        "elder_id": elder_map["Martha Stewart"],
        "triggered_by": cg_ids[0],
        "type": "medical",
        "description": "Chest pain reported — ambulance called, BP 160/100",
        "status": "resolved",
        "resolved_at": (datetime.utcnow() - timedelta(days=2) + timedelta(hours=3)).isoformat(),
    },
    {
        "elder_id": elder_map["William Chen"],
        "triggered_by": cg_ids[1],
        "type": "other",
        "description": "Patient unresponsive during breakfast — recovered in 10 mins",
        "status": "resolved",
        "resolved_at": (datetime.utcnow() - timedelta(hours=22)).isoformat(),
    },
    {
        "elder_id": elder_map["George Morrison"],
        "triggered_by": fam_ids[3],
        "type": "soc",
        "description": "Wandered outside facility at night — found safely",
        "status": "active",
    },
]

em_count = 0
for em in emergencies:
    try:
        db.table("emergencies").insert(em).execute()
        em_count += 1
    except Exception as e:
        print(f"   ⚠ Emergency skipped: {e}")

print(f"   ✅ Inserted {em_count} emergency records")
print()


# ── STEP 7: MESSAGES ──────────────────────────────────────────────────────────
print("=" * 55)
print("STEP 7 — Messages")
print("=" * 55)

messages = [
    {
        "sender_id": fam_ids[0],
        "recipient_email": caregivers_data[0][0],
        "subject": "Medication question",
        "body": "Did Robert take his blood pressure meds this morning? He seemed a bit confused.",
        "status": "sent"
    },
    {
        "sender_id": fam_ids[1],
        "recipient_email": caregivers_data[1][0],
        "subject": "Weekly update request",
        "body": "Could you send a weekly health summary for William? We'd like to share it with his cardiologist.",
        "status": "sent"
    },
    {
        "sender_id": cg_ids[0],
        "recipient_email": family_data[0][0],
        "subject": "Robert's health update",
        "body": "Robert had a good day. BP readings are stable at 128/82. He completed his afternoon walk.",
        "status": "sent"
    },
    {
        "sender_id": cg_ids[1],
        "recipient_email": family_data[1][0],
        "subject": "William Chen — fluid monitoring",
        "body": "William reached his 1.5L fluid intake goal today. Weight stable at 74kg. No signs of oedema.",
        "status": "sent"
    },
    {
        "sender_id": fam_ids[2],
        "recipient_email": caregivers_data[1][0],
        "subject": "Dorothy physio schedule",
        "body": "Can we reschedule Dorothy's physio session to Friday? The family would like to attend.",
        "status": "sent"
    },
]

msg_count = 0
for msg in messages:
    try:
        db.table("messages").insert(msg).execute()
        msg_count += 1
    except Exception as e:
        print(f"   ⚠ Message skipped: {e}")

print(f"   ✅ Inserted {msg_count} messages")
print()


# ── DONE ──────────────────────────────────────────────────────────────────────
print("=" * 55)
print("✅ FULL SEED COMPLETE — Demo data ready!")
print("=" * 55)
print(f"""
📊 Summary:
   👑  Admin accounts  : 2  (nithinchinna2577@gmail.com / Nithin@2577)
   🩺  Caregivers      : {len(cg_ids)}  (sarah.nurse@eldercare.com / Nurse@123)
   👨‍👩‍👧  Family members  : {len(fam_ids)}  (family@eldercare.com / Family@123)
   👴  Patients        : {len(elder_ids)}
   💊  Medicines       : {med_count}
   ✅  Care tasks      : {task_count}
   🚨  Emergencies     : {em_count}
   💬  Messages        : {msg_count}
   📈  Health metrics  : {metric_count}

🔐 Login credentials:
   Admin    → nithinchinna2577@gmail.com  /  Nithin@2577
   Caregiver→ sarah.nurse@eldercare.com   /  Nurse@123
   Family   → family@eldercare.com        /  Family@123
""")
