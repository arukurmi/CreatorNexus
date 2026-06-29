type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

interface Opts { key: string; model?: string; baseUrl?: string; fetchFn?: FetchFn }

/**
 * Thin wrapper over the Gemini Generative Language API with structured JSON output.
 * One job: prompt + responseSchema → parsed JSON object (throws on transport/parse error).
 */
export class GeminiClient {
  private key: string
  private model: string
  private baseUrl: string
  private fetchFn: FetchFn
  constructor(opts: Opts) {
    this.key = opts.key
    this.model = opts.model ?? 'gemini-2.0-flash'
    this.baseUrl = opts.baseUrl ?? 'https://generativelanguage.googleapis.com'
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as FetchFn)
  }

  async generate(prompt: string, schema: object): Promise<unknown> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.key}`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      const err = new Error(`Gemini request failed: ${res.status} ${detail.slice(0, 200)}`) as Error & { status?: number }
      err.status = res.status
      throw err
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini returned no content')
    return JSON.parse(text)
  }
}
