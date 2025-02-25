import OpenAI from 'openai';

// Initialize the OpenAI client
// NOTE: You will need to provide your own API key in a .env file or directly here
// For production, always use environment variables
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // For client-side usage (not recommended for production)
    baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

/**
 * Format the AI response to look like Google search results
 * @param {string} query The search query
 * @param {string} aiResponse The raw AI response text
 * @returns {Object} Formatted Google-like search results
 */
const formatResponseAsSearchResults = (query, aiResponse) => {
    // Split the response into paragraphs
    const paragraphs = aiResponse.split('\n\n').filter(p => p.trim().length > 0);

    // Generate random search time (for realism)
    const searchTime = (Math.random() * 0.5 + 0.1).toFixed(2);

    // Generate random result count (for realism)
    const resultCount = Math.floor(Math.random() * 900000000) + 100000000;
    const formattedResultCount = `About ${resultCount.toLocaleString()} results`;

    // Create search results from paragraphs
    const results = paragraphs.map((paragraph, index) => {
        // Create a title based on the paragraph content
        const words = paragraph.split(' ').slice(0, 7).join(' ');
        const title = index === 0
            ? `${query.charAt(0).toUpperCase() + query.slice(1)} - Overview`
            : `${words}...`;

        // Create a fake URL based on the content
        const domain = index === 0 ? 'wikipedia.org' : `example${index}.com`;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const url = `https://${domain}/${slug}`;

        return {
            title,
            url,
            snippet: paragraph.length > 160 ? paragraph.substring(0, 157) + '...' : paragraph,
            fullContent: aiResponse // Store the complete AI response in each result
        };
    });

    return {
        title: `Results for "${query}"`,
        searchTime,
        totalResults: formattedResultCount,
        results: results.slice(0, 8), // Limit to 8 results
        originalResponse: aiResponse // Also store at the top level
    };
};

/**
 * Search using OpenAI's API and format the response as Google search results
 * @param {string} query The search query
 * @returns {Promise<Object>} Formatted search results
 */
export const searchWithAI = async (query) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that provides comprehensive information similar to search results.
          
For each query:
1. Provide factual, accurate, and informative content
2. Break your response into 3-5 clear paragraphs for easy reading
3. Start with a general overview of the topic
4. Include specific details, facts, or examples in subsequent paragraphs
5. Be objective and educational in your response
6. Cover different aspects or perspectives of the topic

Your response will be formatted to look like Google search results, with each paragraph becoming a separate result entry.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const aiResponse = response.choices[0].message.content;
        return formatResponseAsSearchResults(query, aiResponse);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
};

export default {
    searchWithAI
}; 