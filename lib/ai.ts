/**
 * AI Utility Library
 * Handles interaction with OpenAI-compatible APIs for SEO content generation.
 */

export interface SEOSuggestion {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    focusKeyword: string;
    generatedName?: string;
    generatedDescription?: string;
}

/**
 * Generate SEO metadata for a product or category using AI.
 */
export async function generateSEOWithAI(
    name: string,
    description: string,
    type: 'product' | 'category' = 'product',
    imageUrl?: string
): Promise<SEOSuggestion> {
    const apiKey = process.env.AI_API_KEY;
    const apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-4o';

    if (!apiKey) {
        throw new Error('AI_API_KEY is not configured in environment variables.');
    }

    const prompt = `
        You are an expert luxury e-commerce SEO and content specialist for "Novraux", a high-end contemporary luxury brand.
        
        Analyze the provided input${imageUrl ? ' (including the image)' : ''} to generate content for a ${type}.
        
        Input Data:
        Name: ${name || '(Generate a luxury name based on the image)'}
        Description: ${description || '(Generate a compelling luxury description based on the image)'}
        ${imageUrl ? `Image URL: ${imageUrl}` : ''}
        
        Requirements:
        1. Meta Title: 50-60 characters, highlights luxury and elegance.
        2. Meta Description: 150-160 characters, compelling, editorial style.
        3. Keywords: 5-8 comma-separated keywords relevant to luxury and this item.
        4. Focus Keyword: The most important 1-3 word keyword for this ${type}.
        ${(!name || !description) ? `5. Content Generation: Since the name or description was missing, generate a suitable luxury "generatedName" and "generatedDescription" based on the image.` : ''}
        
        Response format must be valid JSON:
        {
            ${(!name) ? '"generatedName": "...",' : ''}
            ${(!description) ? '"generatedDescription": "...",' : ''}
            "metaTitle": "...",
            "metaDescription": "...",
            "keywords": "...",
            "focusKeyword": "..."
        }
    `;

    const messages: any[] = [
        { role: 'system', content: 'You are a luxury SEO assistant. You MUST respond ONLY with a valid JSON object. No preamble, no markdown blocks, just the raw JSON.' },
    ];

    if (imageUrl) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageUrl,
                        detail: 'high'
                    }
                }
            ]
        });
    } else {
        messages.push({ role: 'user', content: prompt });
    }

    // Helper to fetch image and convert to base64
    const urlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    };

    // Google Gemini Logic
    const googleKey = process.env.GOOGLE_AI_KEY;

    if (imageUrl && googleKey) {
        try {
            console.log('Using Google Gemini for Vision...');
            const imageBase64 = await urlToBase64(imageUrl);

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleKey}`;
            const geminiBody = {
                contents: [{
                    parts: [
                        { text: prompt + "\n\nProvide the response as valid JSON." },
                        {
                            inline_data: {
                                mime_type: "image/jpeg", // Assuming JPEG/WebP, Gemini is flexible
                                data: imageBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            };

            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiBody)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API Error: ${errText}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Proceed to parsing
            return parseResponse(content);
        } catch (error) {
            console.error('Gemini Vision failed, falling back to text-only Groq:', error);
            // Fall through to Groq text-only logic
        }
    }

    // Existing Groq/OpenAI Logic (Text-Only or Fallback)
    const makeRequest = async (msgs: any[]) => {
        const response = await fetch(`${apiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model, // llama-3.3-70b-versatile
                messages: msgs,
                temperature: 0.1,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API Error: ${errorText}`);
        }

        return response.json();
    };

    try {
        // We only use Groq for text-only now, or if Gemini failed
        const textOnlyMessages = [
            { role: 'system', content: 'You are a luxury SEO assistant. You MUST respond ONLY with a valid JSON object.' },
            { role: 'user', content: prompt }
        ];

        const data = await makeRequest(textOnlyMessages);
        const content = data.choices[0].message.content || '';
        return parseResponse(content);

    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
}

// Helper to parse JSON from AI response
function parseResponse(content: string): SEOSuggestion {
    const extractJSON = (text: string): string => {
        const jsonPart = text.match(/\{[\s\S]*\}/);
        return jsonPart ? jsonPart[0] : text;
    };

    const cleanedContent = extractJSON(content).trim();

    try {
        const parsed = JSON.parse(cleanedContent);
        return {
            metaTitle: parsed.metaTitle || parsed.meta_title || parsed.title || '',
            metaDescription: parsed.metaDescription || parsed.meta_description || parsed.description || '',
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords.join(', ') : (parsed.keywords || ''),
            focusKeyword: parsed.focusKeyword || parsed.focus_keyword || parsed.main_keyword || '',
            generatedName: parsed.generatedName || parsed.generated_name || '',
            generatedDescription: parsed.generatedDescription || parsed.generated_description || ''
        } as SEOSuggestion;
    } catch (parseError) {
        console.error('Failed to parse AI JSON:', cleanedContent);
        throw new Error(`AI returned invalid content: ${cleanedContent.slice(0, 50)}...`);
    }
}
