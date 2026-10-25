"""
Targeted seed: insert only care_tasks and medicines for existing elders.
Run once after seed_data.py has already created the elders.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Fetch existing elders in alphabetical order (same order as seed_data.py)
elders_res = db.table("elders").select("id, full_name").order("full_name").execute()
elders = {e["full_name"]: e["id"] for e in elders_res.data}
print("Elders found:", list(elders.keys()))

def eid(name):
    return elders.get(name)

# ── CARE TASKS ──────────────────────────────────────────────────────────────
care_tasks = [
    (eid("Arthur Nguyen"),   "Eye drop administration (glaucoma)",           "completed"),
    (eid("Arthur Nguyen"),   "Heart failure daily weight check",              "pending"),
    (eid("Dorothy Alvarez"), "Physical therapy exercises",                   "pending"),
    (eid("Dorothy Alvarez"), "Parkinson's tremor assessment",                "pending"),
    (eid("Evelyn Patel"),    "Inhaler administration (morning)",              "completed"),
    (eid("Evelyn Patel"),    "Blood glucose check (fasting)",                "completed"),
    (eid("Frances Kim"),     "Swallowing therapy session",                   "pending"),
    (eid("Frances Kim"),     "Stroke recovery physio",                       "completed"),
    (eid("George Morrison"), "Reality orientation activity",                 "pending"),
    (eid("George Morrison"), "Antihypertensive given at 9 AM",               "completed"),
    (eid("Harold Thompson"), "Weight measurement (morning)",                  "completed"),
    (eid("Harold Thompson"), "Restrict dietary potassium - verify meal",     "pending"),
    (eid("Helen Okafor"),    "Joint mobility exercise",                      "completed"),
    (eid("Helen Okafor"),    "Cognitive function screening",                  "pending"),
    (eid("Martha Stewart"),  "Memory exercise session",                      "completed"),
    (eid("Martha Stewart"),  "Calcium supplement with lunch",                "pending"),
    (eid("Martha Stewart"),  "Evening fall-risk mobility check",             "pending"),
    (eid("Robert Jenkins"),  "Morning blood pressure check",                 "completed"),
    (eid("Robert Jenkins"),  "Administer insulin (8 AM)",                    "completed"),
    (eid("Robert Jenkins"),  "Afternoon walk (20 mins)",                     "pending"),
    (eid("William Chen"),    "Cardiac monitoring (12-lead ECG)",             "completed"),
    (eid("William Chen"),    "Fluid intake log (1.5L target)",               "completed"),
]

task_count = 0
for elder_id, task_name, status in care_tasks:
    if not elder_id:
        print(f"  Skipping task (elder not found): {task_name}")
        continue
    try:
        db.table("care_tasks").insert({"elder_id": elder_id, "task_name": task_name, "status": status}).execute()
        task_count += 1
    except Exception as e:
        print(f"  Task insert error: {e}")

print(f"Inserted {task_count} care tasks.")

# ── MEDICINES ────────────────────────────────────────────────────────────────
medicines = [
    ("Robert Jenkins",   "Lisinopril",          "10mg",     "Daily",             "8:00 AM with water",              "taken"),
    ("Robert Jenkins",   "Metformin",            "500mg",    "Twice Daily",       "After breakfast & dinner",         "taken"),
    ("Robert Jenkins",   "Aspirin",              "81mg",     "Daily",             "Morning with food",                "pending"),
    ("Martha Stewart",   "Alendronate",          "70mg",     "Weekly",            "Monday morning, fasting",          "taken"),
    ("Martha Stewart",   "Donepezil",            "5mg",      "Daily",             "Bedtime",                          "pending"),
    ("Martha Stewart",   "Calcium + Vit D",      "600mg",    "Twice Daily",       "With lunch & dinner",             "taken"),
    ("William Chen",     "Furosemide",           "40mg",     "Daily",             "8:00 AM",                         "taken"),
    ("William Chen",     "Digoxin",              "0.125mg",  "Daily",             "9:00 AM",                         "taken"),
    ("William Chen",     "Rivaroxaban",          "20mg",     "Daily",             "With evening meal",               "missed"),
    ("Dorothy Alvarez",  "Levodopa/Carbidopa",   "100/25mg", "Three times daily", "7 AM, 1 PM, 7 PM",               "taken"),
    ("Dorothy Alvarez",  "Amlodipine",           "5mg",      "Daily",             "Morning",                         "pending"),
    ("Harold Thompson",  "Erythropoietin",       "4000 IU",  "Weekly",            "Monday injection",                "taken"),
    ("Harold Thompson",  "Phosphate binder",     "800mg",    "Three times daily", "With each meal",                  "pending"),
    ("Evelyn Patel",     "Tiotropium inhaler",   "18mcg",    "Daily",             "Morning",                         "taken"),
    ("Evelyn Patel",     "Salbutamol inhaler",   "100mcg",   "As needed",         "When breathless",                 "pending"),
    ("Evelyn Patel",     "Glipizide",            "5mg",      "Daily",             "30 min before breakfast",         "taken"),
    ("George Morrison",  "Memantine",            "10mg",     "Twice Daily",       "Morning & evening",               "taken"),
    ("George Morrison",  "Ramipril",             "5mg",      "Daily",             "Morning",                         "pending"),
    ("Frances Kim",      "Clopidogrel",          "75mg",     "Daily",             "With food",                       "taken"),
    ("Frances Kim",      "Atorvastatin",         "40mg",     "Daily",             "Bedtime",                         "taken"),
    ("Arthur Nguyen",    "Latanoprost drops",    "1 drop",   "Daily",             "Bedtime - left eye",              "taken"),
    ("Arthur Nguyen",    "Carvedilol",           "6.25mg",   "Twice Daily",       "Morning & evening with food",     "pending"),
    ("Helen Okafor",     "Methotrexate",         "7.5mg",    "Weekly",            "Saturday morning",                "taken"),
    ("Helen Okafor",     "Folic acid",           "5mg",      "Daily",             "Every day except Saturday",       "taken"),
]

med_count = 0
for name, med_name, dosage, freq, time_inst, status in medicines:
    elder_id = eid(name)
    if not elder_id:
        print(f"  Skipping medicine (elder not found): {name} - {med_name}")
        continue
    try:
        db.table("medicines").insert({
            "elder_id": elder_id, "name": med_name, "dosage": dosage,
            "frequency": freq, "time": time_inst, "status": status
        }).execute()
        med_count += 1
    except Exception as e:
        print(f"  Medicine insert error: {e}")

print(f"Inserted {med_count} medicines.")
print("\n✅ Tasks & Medicines seeded into Supabase!")
