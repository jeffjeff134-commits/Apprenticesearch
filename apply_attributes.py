import json
import os
import re

# Define the attribute dictionary logic
ATTRIBUTE_RULES = [
    {
        "category": "Audit/Finance",
        "keywords": ["accountancy", "accounting", "accountant", "audit", "finance", "bookkeeper", "claims", "underwriting", "payroll", "tax", "actuarial"],
        "attributes": ["Numerical Literacy", "Professional Integrity", "Stakeholder Management"]
    },
    {
        "category": "Digital/Software",
        "keywords": ["digital", "software", "technology", "developer", "data", "ai", "cyber", "it", "computing", "network", "cloud"],
        "attributes": ["Logical Reasoning", "Computational Thinking", "Agile Mindset"]
    },
    {
        "category": "Engineering/Manufacturing",
        "keywords": ["engineer", "engineering", "manufacturing", "surveyor", "technician", "construction", "electrician", "mechanic", "civil"],
        "attributes": ["Manual Dexterity", "Health & Safety Awareness", "Systems Thinking"]
    },
    {
        "category": "Business/Project Management",
        "keywords": ["management", "manager", "project", "business", "sales", "executive", "admin", "operations", "hr", "human resources", "marketing"],
        "attributes": ["Time Management", "Conflict Resolution", "Commercial Awareness"]
    }
]

DB_PATH = '/Users/craig/Desktop/Scout_Apprenticeship_Search/roles_db.json'

def apply_attributes():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    with open(DB_PATH, 'r') as f:
        try:
            roles = json.load(f)
        except json.JSONDecodeError:
            print("Error: Failed to decode JSON database.")
            return

    updated_count = 0
    
    for role in roles:
        title = role.get('role_title', '').lower()
        org = role.get('organization_name', '').lower()
        content_to_check = f"{title} {org}"
        
        # Remove existing "Inferred" attributes to ensure clean slate (and remove any from previous buggy runs)
        current_attributes = role.get('attributes', [])
        current_attributes = [a for a in current_attributes if a.get('source') != 'Inferred']
        
        # Determine attributes
        # Logic: First match determines the primary category. 
        # Detailed logic: Check specific categories first.
        
        matched_attributes = []
        
        # Priority Order: 
        # 1. Digital/Software
        # 2. Engineering/Manufacturing
        # 3. Audit/Finance
        # 4. Business/Project Management
        
        # Re-sorting the rules for processing priority
        priority_order = ["Digital/Software", "Engineering/Manufacturing", "Audit/Finance", "Business/Project Management"]
        
        assigned = False
        for category_name in priority_order:
            rule = next(r for r in ATTRIBUTE_RULES if r["category"] == category_name)
            
            for keyword in rule["keywords"]:
                # Use regex for word boundary matching
                # Escape keyword just in case
                pattern = r'\b' + re.escape(keyword) + r'\b'
                if re.search(pattern, content_to_check):
                    matched_attributes = rule["attributes"]
                    assigned = True
                    break
            if assigned:
                break
        
        # If no match found, we might leave it empty or mark as "General"
        # For now, only apply if matched.
        
        if assigned:
            # Create attribute objects
            attribute_objects = [{"name": attr, "source": "Inferred"} for attr in matched_attributes]
            
            # Since we cleared Inferred attributes, we can just append matches
            current_attributes.extend(attribute_objects)
            
            # Update the role
            role['attributes'] = current_attributes
            updated_count += 1

    with open(DB_PATH, 'w') as f:
        json.dump(roles, f, indent=4)

    print(f"Successfully processed {len(roles)} roles.")
    print(f"Updated {updated_count} roles with inferred attributes.")

if __name__ == "__main__":
    apply_attributes()
