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

    // Generate unique request ID to prevent caching
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const prompt = `
You are an expert luxury e-commerce SEO and content specialist for "Novraux", a high-end contemporary luxury brand.

[REQUEST ID: ${requestId}] - Generate UNIQUE content for this specific request.

${imageUrl ? `CRITICAL: Analyze the provided IMAGE FIRST to identify the product/item. Then generate appropriate content based on what you see.

VISUAL ANALYSIS INSTRUCTIONS:
- Carefully examine EVERY detail of this specific image
- Describe the item's key visual characteristics (material, color, design, style, texture, patterns)
- Identify the product category and type based on what you SEE
- Note unique features and design elements that make THIS item distinctive
- Consider the luxury positioning and target audience
- DO NOT reuse content from previous requests - this is a NEW, UNIQUE product` : ''}

Input Data:
Name: ${name || '(Generate a UNIQUE name based on visual analysis of THIS specific image)'}
Description: ${description || '(Generate a UNIQUE description based on visual analysis of THIS specific image)'}

Task: Generate luxury e-commerce content for a ${type}.

Requirements:
1. Meta Title: 50-60 characters, incorporate visual characteristics, highlight luxury and elegance
2. Meta Description: 150-160 characters, compelling, editorial style, reference visual qualities
3. Keywords: 5-8 comma-separated keywords based on the ${type}'s visual characteristics and luxury positioning
4. Focus Keyword: The most important 1-3 word keyword for this ${type}
5. Suggested Category: The primary category this ${type} belongs to (e.g., "Clothing", "Accessories", "Jewelry", "Home & Decor"). Just the category name, no description.
6. Suggested Slug: A URL-friendly slugified version of the ${type} name (lowercase, hyphens instead of spaces, no special characters)
${(!name || !description) ? `7. Content Generation: Generate UNIQUE luxury "generatedName" and "generatedDescription" based on ${imageUrl ? 'WHAT YOU SEE IN THE IMAGE - describe the specific item, its colors, materials, and unique characteristics' : 'the provided information'}` : ''}

Response format MUST be valid JSON with NO markdown blocks:
{
    ${(!name) ? '"generatedName": "...(UNIQUE name based on image analysis)",' : ''}
    ${(!description) ? '"generatedDescription": "...(UNIQUE description based on image analysis)",' : ''}
    "metaTitle": "...",
    "metaDescription": "...",
    "keywords": "keyword1, keyword2, keyword3",
    "focusKeyword": "main keyword",
    "suggestedCategory": "Category Name",
    "suggestedSlug": "product-slug-name"
}

${imageUrl ? 'IMPORTANT: Your response MUST reflect the SPECIFIC visual content of THIS image. Do not generate generic content.' : ''}
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
            // Handle relative URLs (from R2 proxy)
            let fetchUrl = url;
            if (url.startsWith('/')) {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                fetchUrl = `${baseUrl}${url}`;
            }

            console.log('📥 Fetching image from URL:', fetchUrl.slice(0, 80));
            const response = await fetch(fetchUrl, {
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
        const payload: any = {
            model: model, // llama-3.3-70b-versatile or gpt-4o
            messages: msgs,
            temperature: 0.7,
            response_format: { type: "json_object" }
        };

        // OpenAI/Groq image format handling
        // If image_url is present, ensure model supports it or fallback

        const response = await fetch(`${apiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API Error: ${response.status} - ${errorText}`);
        }

        return response.json();
    };

    try {
        // Decide which messages to use
        // If we fell back from Gemini, we might want to try OpenAI with Vision if supported
        // OR we might want to fall back to purely text.

        let finalMessages = messages;

        if (imageUrl) {
            // If we are here, it means either:
            // 1. Gemini wasn't configured, so we are trying the default provider (OpenAI/Groq).
            // 2. Gemini failed, and we caught the error.

            // If model is NOT vision-capable (like Llama 3 on Groq), we MUST fallback to text-only.
            // But we need to clean the prompt to avoid "Analyze this image" instructions.
            const isVisionModel = model.includes('gpt-4') || model.includes('vision') || model.includes('claude-3');

            if (!isVisionModel) {
                console.log(`⚠️ Model ${model} may not support vision. Falling back to TEXT-ONLY prompt.`);
                const textOnlyPrompt = `
You are an expert luxury e-commerce SEO and content specialist for "Novraux".
[REQUEST ID: ${requestId}]

Input Data:
Name: ${name || 'Product Name'}
Description: ${description || 'Product Description'}

Task: Generate luxury e-commerce content for a ${type}.
Requirements:
1. Meta Title: 50-60 chars, luxury and elegance
2. Meta Description: 150-160 chars, editorial style
3. Keywords: 5-8 comma-separated keywords
4. Focus Keyword: Main keyword
5. Suggested Category: Primary category name
6. Suggested Slug: URL-friendly slug
${(!name || !description) ? '7. Content Generation: Generate a sophisticated, generic luxury name and description since no specific details were provided.' : ''}

Response format (JSON only):
{
    ${(!name) ? '"generatedName": "...",' : ''}
    ${(!description) ? '"generatedDescription": "...",' : ''}
    "metaTitle": "...",
    "metaDescription": "...",
    "keywords": "...",
    "focusKeyword": "...",
    "suggestedCategory": "...",
    "suggestedSlug": "..."
}
                 `;

                finalMessages = [
                    { role: 'system', content: 'You are a luxury SEO assistant. Return JSON only.' },
                    { role: 'user', content: textOnlyPrompt }
                ];
            } else {
                console.log('📸 Attempting Vision with OpenAI/Compatible provider...');
                try {
                    // Fetch and convert image to base64 for OpenAI
                    const { base64, mimeType } = await urlToBase64(imageUrl);
                    const dataUrl = `data:${mimeType};base64,${base64}`;

                    finalMessages = [
                        { role: 'system', content: 'You are a luxury SEO assistant. You MUST respond ONLY with a valid JSON object. No preamble, no markdown blocks, just the raw JSON.' },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: prompt },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: dataUrl,
                                        detail: 'high'
                                    }
                                }
                            ]
                        }
                    ];
                } catch (conversionError) {
                    console.error('⚠️ Failed to prepare image for OpenAI Vision:', conversionError);
                    console.log('   Falling back to text-only prompt.');

                    const textOnlyPrompt = `
You are an expert luxury e-commerce SEO and content specialist for "Novraux".
[REQUEST ID: ${requestId}]

Input Data:
Name: ${name || 'Product Name'}
Description: ${description || 'Product Description'}

Task: Generate luxury e-commerce content for a ${type}.
Requirements:
1. Meta Title: 50-60 chars, luxury and elegance
2. Meta Description: 150-160 chars, editorial style
3. Keywords: 5-8 comma-separated keywords
4. Focus Keyword: Main keyword
5. Suggested Category: Primary category name
6. Suggested Slug: URL-friendly slug
${(!name || !description) ? '7. Content Generation: Generate a sophisticated, generic luxury name and description since no specific details were provided.' : ''}

Response format (JSON only):
{
    ${(!name) ? '"generatedName": "...",' : ''}
    ${(!description) ? '"generatedDescription": "...",' : ''}
    "metaTitle": "...",
    "metaDescription": "...",
    "keywords": "...",
    "focusKeyword": "...",
    "suggestedCategory": "...",
    "suggestedSlug": "..."
}
                 `;

                    finalMessages = [
                        { role: 'system', content: 'You are a luxury SEO assistant. Return JSON only.' },
                        { role: 'user', content: textOnlyPrompt }
                    ];
                }
            }
        }

        console.log('📝 Calling AI provider...');
        const data = await makeRequest(finalMessages);
        const content = data.choices[0].message.content || '';
        console.log('✅ AI generation complete');
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

/**
 * Generate article topic ideas based on a niche or context.
 */
export async function generateArticleTopics(niche: string = 'luxury fashion'): Promise<string[]> {
    const apiKey = process.env.AI_API_KEY;
    const apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) throw new Error('AI_API_KEY is not configured');

    const prompt = `
      Generate 5 engaging, editorial-style blog post titles for a luxury fashion brand named "Novraux".
      Focus on the niche: "${niche}".
      Titles should be sophisticated, intriguing, and SEO-friendly.
      Return ONLY a JSON array of strings, e.g., ["Title 1", "Title 2"].
    `;

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a luxury fashion editor. Return JSON array only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) throw new Error('Failed to generate topics');

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('🤖 AI Topics Response:', content);

    try {
        const parsed = JSON.parse(content);
        console.log('📋 Parsed topics:', parsed);

        // Handle { "titles": [...] } or { "topics": [...] } or just [...]
        if (Array.isArray(parsed)) return parsed;
        if (parsed.titles && Array.isArray(parsed.titles)) return parsed.titles;
        if (parsed.topics && Array.isArray(parsed.topics)) return parsed.topics;

        // Check for any array property
        const arrays = Object.values(parsed).filter(v => Array.isArray(v));
        if (arrays.length > 0) return arrays[0] as string[];

        throw new Error('No array found in response');
    } catch (e) {
        console.error('Failed to parse topics JSON:', content);
        throw new Error(`Invalid topics response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

/**
 * Generate a full blog article in Markdown format.
 */
export async function generateFullArticle(title: string, excerpt?: string): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    const apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) throw new Error('AI_API_KEY is not configured');

    const prompt = `
      Write a sophisticated editorial article for "Novraux", a luxury fashion brand.
      
      Article Title: "${title}"
      ${excerpt ? `Focus/Angle: "${excerpt}"` : ''}
      
      STRUCTURE & FORMATTING:
      - Start with a compelling opening paragraph (2-3 sentences) that hooks readers immediately
      - Use ONLY 2-3 H2 headers (##) max for main sections - don't overuse headers!
      - Body should be 4-6 flowing paragraphs with natural transitions
      - Use **bold** sparingly for emphasis on key terms only
      - End with a concluding thought or call-to-action
      
      TONE & STYLE:
      - Sophisticated and authoritative, like Vogue or Harper's Bazaar
      - Natural, conversational elegance - avoid corporate/robotic language
      - NO phrases like "In this article..." or "We will explore..."
      - Write in present tense, engage the reader directly
      
      CONTENT GUIDELINES:
      - Length: 600-800 words
      - Include specific, actionable insights (styling tips, trends, techniques)
      - Reference current fashion moments or timeless principles
      - Maintain the luxury brand's voice: refined, confident, tasteful
      - Add subtle product/brand mentions naturally if relevant
      
      IMPORTANT: Focus on quality prose over structure. Less headers, more substance.
    `;

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a seasoned luxury fashion editor. Write with elegance, authority, and natural flow. Avoid excessive formatting - let the prose speak.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.75, // Slightly higher for more creative, natural prose
        }),
    });

    if (!response.ok) throw new Error('Failed to generate article');

    const data = await response.json();
    return data.choices[0].message.content || '';
}

/**
 * Generate an image using Hugging Face Inference API.
 * Returns ArrayBuffer of the image.
 */
export async function generateArticleImage(prompt: string): Promise<ArrayBuffer> {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) throw new Error('HUGGINGFACE_API_KEY is not configured');

    console.log('🎨 Generating image via Hugging Face:', prompt);

    // Using SDXL Base 1.0 for high quality
    // Alternative: stabilityai/stable-diffusion-2-1
    const model = "stabilityai/stable-diffusion-xl-base-1.0";

    const response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
            headers: {
                Authorization: `Bearer ${hfKey}`,
                "Content-Type": "application/json",
                "x-use-cache": "false"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `luxury fashion photography, editorial shot, ${prompt}, 8k, highly detailed, professional lighting, photorealistic`,
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error('HF Error:', errText);
        throw new Error(`Hugging Face API Error: ${response.statusText}`);
    }

    return await response.arrayBuffer();
}

/**
 * Generate a product design image for Print-on-Demand.
 * Returns ArrayBuffer (PNG/JPG).
 */
export async function generateProductDesign(prompt: string): Promise<ArrayBuffer> {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) throw new Error('HUGGINGFACE_API_KEY is not configured');

    console.log('🎨 Generating POD Design:', prompt);

    // Using SDXL or a specific model good for graphics/vectors if available
    const model = "stabilityai/stable-diffusion-xl-base-1.0";

    const response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
            headers: {
                Authorization: `Bearer ${hfKey}`,
                "Content-Type": "application/json",
                "x-use-cache": "false"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `t-shirt design, vector art style, ${prompt}, isolated on white background, high quality, 8k, flat color`,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`Hugging Face API Error: ${response.statusText}`);
    }

    return await response.arrayBuffer();
}


/**
 * Generate article angle/topic proposals based on a title.
 * Returns 3-5 specific angles or subtopics.
 */
export async function generateArticleAngles(title: string): Promise<string[]> {
    const apiKey = process.env.AI_API_KEY;
    const apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) throw new Error('AI_API_KEY is not configured');

    const prompt = `
      Based on the article title: "${title}"
      
      Generate 4 specific article angles or subtopics that would make compelling sections or approaches.
      Each angle should be a unique perspective or focus area.
      
      Return ONLY a JSON object with an "angles" array of strings.
      Example: {"angles": ["Angle 1", "Angle 2", "Angle 3", "Angle 4"]}
    `;

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a luxury fashion editor. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) throw new Error('Failed to generate angles');

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('🎯 AI Angles Response:', content);

    try {
        const parsed = JSON.parse(content);
        console.log('📋 Parsed angles:', parsed);

        if (parsed.angles && Array.isArray(parsed.angles)) return parsed.angles;

        // Check for any array property
        const arrays = Object.values(parsed).filter(v => Array.isArray(v));
        if (arrays.length > 0) return arrays[0] as string[];

        throw new Error('No array found in response');
    } catch (e) {
        console.error('Failed to parse angles JSON:', content);
        throw new Error(`Invalid angles response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

/**
 * Generate SEO metadata for an article based on title and content.
 */
export async function generateArticleSEO(
    title: string,
    content: string
): Promise<{
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    focusKeyword: string;
}> {
    const apiKey = process.env.AI_API_KEY;
    const apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) throw new Error('AI_API_KEY is not configured');

    const contentPreview = content.slice(0, 500); // First 500 chars

    const prompt = `
      You are an SEO expert for a luxury fashion blog called "Novraux".
      
      Article Title: "${title}"
      Content Preview: "${contentPreview}..."
      
      Generate SEO metadata for this article:
      1. metaTitle: 50-60 characters, compelling and keyword-rich
      2. metaDescription: 120-160 characters, engaging preview
      3. keywords: 5-7 relevant keywords (comma-separated)
      4. focusKeyword: The single most important keyword
      
      Return ONLY a JSON object with these exact keys.
      Example: {
        "metaTitle": "Example Title | Novraux",
        "metaDescription": "Discover...",
        "keywords": "luxury fashion, trends, style",
        "focusKeyword": "luxury fashion"
      }
    `;

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are an SEO specialist. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) throw new Error('Failed to generate SEO');

    const data = await response.json();
    const content_response = data.choices[0].message.content;

    console.log('🔍 AI SEO Response:', content_response);

    try {
        const parsed = JSON.parse(content_response);

        return {
            metaTitle: parsed.metaTitle || title,
            metaDescription: parsed.metaDescription || '',
            keywords: parsed.keywords || '',
            focusKeyword: parsed.focusKeyword || ''
        };
    } catch (e) {
        console.error('Failed to parse SEO JSON:', content_response);
        throw new Error(`Invalid SEO response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}
