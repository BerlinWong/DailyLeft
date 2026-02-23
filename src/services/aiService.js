import axios from 'axios'
import dayjs from 'dayjs'

const API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

/**
 * AI Service for parsing transaction text using SiliconFlow (DeepSeek-R1).
 */
export const parseTransaction = async (text) => {
  if (!API_KEY || API_KEY === 'your_siliconflow_api_key') {
    console.warn('SiliconFlow API Key is missing. Using fallback mock.')
    return mockFallback(text)
  }

  const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  
  const systemPrompt = `Extract transaction data from the user's text.
Return ONLY a strict JSON object with these fields:
- amount: number (positive)
- category: one of ['Food', 'Transport', 'Shopping', 'Housing', 'Entertainment', 'Medical', 'Salary', 'Other']
- description: string (brief summary)
- date: ISO 8601 string

Current DateTime: ${currentDateTime}
Rules:
- If category is unclear, use 'Other'.
- If date is not mentioned, use current date.
- No markdown, no explanation, just JSON.`

  try {
    const response = await axios.post(API_URL, {
      model: 'deepseek-ai/DeepSeek-R1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const content = response.data.choices[0].message.content
    // Extract JSON if AI wrapped it in code blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    
    return {
      amount: Number(result.amount) || 0,
      category: result.category || 'Other',
      description: result.description || text,
      date: result.date || new Date().toISOString()
    }
  } catch (error) {
    console.error('AI Parsing Error:', error)
    return mockFallback(text)
  }
}

const mockFallback = async (text) => {
  await new Promise(resolve => setTimeout(resolve, 800))
  const amountMatch = text.match(/\d+(\.\d+)?/)
  return {
    amount: amountMatch ? parseFloat(amountMatch[0]) : 0,
    category: 'Other',
    description: text,
    date: new Date().toISOString()
  }
}
