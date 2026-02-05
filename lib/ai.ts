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
    suggestedCategory?: string; // Suggested category name
    suggestedSlug?: string; // Suggested product slug
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

${imageUrl ? `CRITICAL: Analyze the provided IMAGE FIRST to identify the product/item. Then generate appropriate content based on what you see.

VISUAL ANALYSIS INSTRUCTIONS:
- Describe the item's key visual characteristics (material, color, design, style)
- Identify the product category and type
- Note unique features and design elements
- Consider the luxury positioning and target audience` : ''}

Input Data:
Name: ${name || '(Will be generated based on visual analysis)'}
Description: ${description || '(Will be generated based on visual analysis)'}

Task: Generate luxury e-commerce content for a ${type}.

Requirements:
1. Meta Title: 50-60 characters, incorporate visual characteristics, highlight luxury and elegance
2. Meta Description: 150-160 characters, compelling, editorial style, reference visual qualities
3. Keywords: 5-8 comma-separated keywords based on the ${type}'s visual characteristics and luxury positioning
4. Focus Keyword: The most important 1-3 word keyword for this ${type}
5. Suggested Category: The primary category this ${type} belongs to (e.g., "Clothing", "Accessories", "Jewelry", "Home & Decor"). Just the category name, no description.
6. Suggested Slug: A URL-friendly slugified version of the ${type} name (lowercase, hyphens instead of spaces, no special characters)
${(!name || !description) ? `7. Content Generation: Generate suitable luxury "generatedName" and "generatedDescription" based on ${imageUrl ? 'WHAT YOU SEE IN THE IMAGE' : 'the provided information'}` : ''}

Response format MUST be valid JSON with NO markdown blocks:
{
    ${(!name) ? '"generatedName": "...(based on image if available)",' : ''}
    ${(!description) ? '"generatedDescription": "...(based on image if available)",' : ''}
    "metaTitle": "...",
    "metaDescription": "...",
    "keywords": "keyword1, keyword2, keyword3",
    "focusKeyword": "main keyword",
    "suggestedCategory": "Category Name",
    "suggestedSlug": "product-slug-name"
}

${imageUrl ? 'Remember: BASE YOUR RESPONSE ON THE VISUAL ANALYSIS OF THE IMAGE PROVIDED' : ''}
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

    // Helper to fetch image and convert to base64 with MIME type detection
    const urlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
        try {
            console.log('📥 Fetching image from URL:', url.slice(0, 80));
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Novraux-AI/1.0' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Detect MIME type from header
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const mimeType = contentType.split(';')[0].trim();
            console.log('📸 Image MIME type detected:', mimeType);
            
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            console.log('✅ Image converted to base64, size:', Math.round(base64.length / 1024), 'KB');
            
            return { base64, mimeType };
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error('❌ Image fetch failed:', errMsg);
            throw new Error(`Cannot fetch image: ${errMsg}`);
        }
    };

    // Google Gemini Logic - Vision-first approach
    const googleKey = process.env.GOOGLE_AI_KEY;

    if (imageUrl && googleKey) {
        try {
            console.log('\n🤖 === GEMINI VISION ATTEMPT ===');
            console.log('🔍 Image URL received:', imageUrl.slice(0, 100), '...');
            
            const { base64, mimeType } = await urlToBase64(imageUrl);
            
            console.log('🎨 Preparing Gemini request with:');
            console.log('   - MIME type:', mimeType);
            console.log('   - Image size:', Math.round(base64.length / 1024), 'KB');
            console.log('   - Prompt length:', prompt.length, 'characters');

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleKey}`;
            
            const geminiBody = {
                contents: [{
                    parts: [
                        { 
                            text: prompt + "\n\n⚠️ CRITICAL: Return ONLY valid JSON. No markdown, no explanation." 
                        },
                        {
                            inline_data: {
                                mime_type: mimeType, // ✅ Use detected MIME type
                                data: base64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            };

            console.log('📤 Sending request to Gemini API...');
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiBody)
            });

            console.log('📥 Gemini response status:', response.status);

            if (!response.ok) {
                const errText = await response.text();
                console.error('❌ Gemini HTTP Error:', response.status);
                console.error('   Response body:', errText.slice(0, 200));
                throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 100)}`);
            }

            const data = await response.json();
            console.log('✅ Gemini response received');
            console.log('   Candidates:', data.candidates?.length || 0);
            
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!content) {
                console.error('❌ No content in Gemini response');
                console.error('   Full response:', JSON.stringify(data).slice(0, 300));
                throw new Error('Gemini returned empty response');
            }

            console.log('✅ Content extracted, length:', content.length);
            console.log('✅ === GEMINI VISION SUCCESS ===\n');
            return parseResponse(content);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('\n❌ === GEMINI VISION FAILED ===');
            console.error('   Error:', errMsg);
            
            // ✅ Check if it's a localhost/proxy URL issue (expected in local development)
            if (imageUrl && (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1'))) {
                console.warn('⚠️ Image is on localhost - cannot access from Gemini API');
                console.warn('   To enable image analysis:');
                console.warn('   1. Configure R2_BUCKET_NAME for public access, OR');
                console.warn('   2. Use NEXT_PUBLIC_R2_PUBLIC_URL with proper domain');
                console.warn('   Falling back to text-only generation...');
                // Fall through to text-only - this is OK for localhost
            } else if (errMsg.includes('Cannot fetch image') || errMsg.includes('404')) {
                console.error('❌ IMAGE URL IS NOT ACCESSIBLE FROM GEMINI');
                console.error('   Error details:', errMsg);
                console.warn('   Falling back to text-only generation...');
                // Fall through to text-only - will still generate content
            } else {
                console.error('   Falling back to TEXT-ONLY generation');
            }
            // Fall through to text-only backup
        }
    } else if (imageUrl && !googleKey) {
        console.warn('\n⚠️ Image provided but GOOGLE_AI_KEY not configured!');
        console.warn('   Using text-only generation instead of vision\n');
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
        // Fallback: Text-only generation (when Gemini fails or no image provided)
        if (imageUrl) {
            console.log('\n⚠️ Using TEXT-ONLY fallback (image analysis failed)');
            console.log('   Results will be generic, not based on the image\n');
        }
        
        const textOnlyMessages = [
            { role: 'system', content: 'You are a luxury SEO assistant. You MUST respond ONLY with a valid JSON object. No markdown, no explanation.' },
            { role: 'user', content: prompt }
        ];

        console.log('📝 Calling Groq for text-only generation...');
        const data = await makeRequest(textOnlyMessages);
        const content = data.choices[0].message.content || '';
        console.log('✅ Groq text-only generation complete');
        return parseResponse(content);

    } catch (error) {
        console.error('❌ ALL AI GENERATION FAILED:', error);
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
            generatedDescription: parsed.generatedDescription || parsed.generated_description || '',
            suggestedCategory: parsed.suggestedCategory || parsed.suggested_category || '',
            suggestedSlug: parsed.suggestedSlug || parsed.suggested_slug || ''
        } as SEOSuggestion;
    } catch (parseError) {
        console.error('Failed to parse AI JSON:', cleanedContent);
        throw new Error(`AI returned invalid content: ${cleanedContent.slice(0, 50)}...`);
    }
}
