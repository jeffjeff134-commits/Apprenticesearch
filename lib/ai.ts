import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Check if API key is configured
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn('GOOGLE_GENERATIVE_AI_API_KEY not configured. AI features will be disabled.');
}

/**
 * Analyze user interests and suggest career paths
 * @param interests - Array of user interests
 * @param skills - Array of user skills
 * @returns AI-generated career suggestions
 */
export async function analyzeCareerPath(interests: string[], skills: string[]) {
    if (!apiKey) {
        throw new Error('Google API key not configured');
    }

    const prompt = `Given a student with the following profile:
Interests: ${interests.join(', ')}
Skills: ${skills.join(', ')}

Suggest 3-5 suitable apprenticeship career paths. For each path, explain:
1. Why it matches their profile
2. Key skills they should develop
3. Typical career progression

Format the response as JSON with this structure:
{
  "suggestions": [
    {
      "careerPath": "string",
      "matchReason": "string",
      "keySkills": ["string"],
      "progression": "string"
    }
  ]
}`;

    const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt,
    });

    return JSON.parse(text);
}

/**
 * Generate personalized application advice using AI
 * @param roleTitle - The apprenticeship role title
 * @param userSkills - User's skills and experiences
 * @returns AI-generated application tips
 */
export async function generateApplicationAdvice(
    roleTitle: string,
    userSkills: string[]
) {
    if (!apiKey) {
        throw new Error('Google API key not configured');
    }

    const prompt = `A student is applying for a "${roleTitle}" apprenticeship.
Their skills include: ${userSkills.join(', ')}

Provide 3 specific, actionable tips for their application that:
1. Highlight how their skills match the role
2. Suggest specific examples they could mention
3. Address potential gaps in experience

Keep each tip concise (2-3 sentences).`;

    const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt,
    });

    return text;
}

/**
 * Match user profile to roles and calculate compatibility score
 * @param userSkills - User's skills
 * @param userInterests - User's interests
 * @param roleTitle - Role title to match against
 * @param roleAttributes - Role's required attributes
 * @returns Match score (0-100) and explanation
 */
export async function calculateMatchScore(
    userSkills: string[],
    userInterests: string[],
    roleTitle: string,
    roleAttributes: string[]
) {
    if (!apiKey) {
        // Fallback: simple keyword matching
        const allUserTerms = [...userSkills, ...userInterests].map(t => t.toLowerCase());
        const roleTerms = [...roleTitle.toLowerCase().split(' '), ...roleAttributes.map(a => a.toLowerCase())];

        const matches = allUserTerms.filter(term =>
            roleTerms.some(roleTerm => roleTerm.includes(term) || term.includes(roleTerm))
        );

        const score = Math.min(100, (matches.length / allUserTerms.length) * 100);

        return {
            score: Math.round(score),
            explanation: `Found ${matches.length} matching skills/interests`
        };
    }

    const prompt = `Rate the match between a candidate and job on a scale of 0-100:

Candidate:
- Skills: ${userSkills.join(', ')}
- Interests: ${userInterests.join(', ')}

Role: ${roleTitle}
Required attributes: ${roleAttributes.join(', ')}

Respond with JSON:
{
  "score": number (0-100),
  "explanation": "brief explanation of the match"
}`;

    const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt,
    });

    return JSON.parse(text);
}
