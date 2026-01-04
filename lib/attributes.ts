// Attribute inference rules ported from Python script
export interface AttributeRule {
    category: string;
    keywords: string[];
    attributes: string[];
}

export const ATTRIBUTE_RULES: AttributeRule[] = [
    {
        category: 'Audit/Finance',
        keywords: [
            'accountancy', 'accounting', 'accountant', 'audit', 'finance',
            'bookkeeper', 'claims', 'underwriting', 'payroll', 'tax', 'actuarial'
        ],
        attributes: ['Numerical Literacy', 'Professional Integrity', 'Stakeholder Management']
    },
    {
        category: 'Digital/Software',
        keywords: [
            'digital', 'software', 'technology', 'developer', 'data',
            'ai', 'cyber', 'it', 'computing', 'network', 'cloud'
        ],
        attributes: ['Logical Reasoning', 'Computational Thinking', 'Agile Mindset']
    },
    {
        category: 'Engineering/Manufacturing',
        keywords: [
            'engineer', 'engineering', 'manufacturing', 'surveyor', 'technician',
            'construction', 'electrician', 'mechanic', 'civil'
        ],
        attributes: ['Manual Dexterity', 'Health & Safety Awareness', 'Systems Thinking']
    },
    {
        category: 'Business/Project Management',
        keywords: [
            'management', 'manager', 'project', 'business', 'sales',
            'executive', 'admin', 'operations', 'hr', 'human resources', 'marketing'
        ],
        attributes: ['Time Management', 'Conflict Resolution', 'Commercial Awareness']
    }
];

// Priority order for category matching
const PRIORITY_ORDER = [
    'Digital/Software',
    'Engineering/Manufacturing',
    'Audit/Finance',
    'Business/Project Management'
];

/**
 * Infer attributes for a role based on title and organization name
 * @param roleTitle - The job title
 * @param organizationName - The organization/company name
 * @returns Array of inferred attribute names
 */
export function inferAttributes(roleTitle: string, organizationName: string): string[] {
    const contentToCheck = `${roleTitle} ${organizationName}`.toLowerCase();

    // Check categories in priority order
    for (const categoryName of PRIORITY_ORDER) {
        const rule = ATTRIBUTE_RULES.find(r => r.category === categoryName);
        if (!rule) continue;

        // Check if any keyword matches (word boundary)
        for (const keyword of rule.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(contentToCheck)) {
                return rule.attributes;
            }
        }
    }

    // No match found
    return [];
}

/**
 * Get the category for a role based on inferred attributes
 * @param roleTitle - The job title
 * @param organizationName - The organization/company name
 * @returns Category name or null
 */
export function inferCategory(roleTitle: string, organizationName: string): string | null {
    const contentToCheck = `${roleTitle} ${organizationName}`.toLowerCase();

    for (const categoryName of PRIORITY_ORDER) {
        const rule = ATTRIBUTE_RULES.find(r => r.category === categoryName);
        if (!rule) continue;

        for (const keyword of rule.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(contentToCheck)) {
                return categoryName;
            }
        }
    }

    return null;
}
