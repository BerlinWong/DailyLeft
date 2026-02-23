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
  
  const systemPrompt = `Extract transaction data.
Current Local Time: ${currentDateTime}

Return ONLY a strict JSON object:
- amount: number
- category: ['Food', 'Transport', 'Shopping', 'Housing', 'Entertainment', 'Medical', 'Salary', 'Other']
- description: string
- date: string (format: YYYY-MM-DD HH:mm:ss)

Rules:
1. Use 'Current Local Time' as the base. Resolve relative dates ('today', 'yesterday', '昨天') from it.
2. TIME DEFAULTS — only override the time when the user explicitly mentions a meal period:
   - Morning / 早 (早饭/早餐/早上) → 08:00:00
   - Noon / 午 (午饭/午餐/中午) → 12:00:00
   - Evening / 晚 (晚饭/晚餐/晚上) → 19:00:00
3. If no time or meal period is mentioned, use the EXACT time from 'Current Local Time'.
4. Output 'date' in local timezone as 'YYYY-MM-DD HH:mm:ss'. Never use UTC.
5. No markdown, no explanation.`

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
      date: result.date ? dayjs(result.date).toISOString() : dayjs().toISOString()
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
