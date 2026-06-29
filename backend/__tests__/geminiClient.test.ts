import { describe, it, expect, vi } from 'vitest'
import { GeminiClient } from '../src/services/ai/geminiClient.js'

const apiBody = (obj: unknown) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }),
})

describe('GeminiClient', () => {
  it('posts to the model endpoint with the key and returns parsed JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(apiBody({ ok: 1 }) as Response)
    const c = new GeminiClient({ key: 'K', model: 'gemini-2.0-flash', baseUrl: 'https://g', fetchFn })
    const out = await c.generate('hello', { type: 'OBJECT' })
    expect(out).toEqual({ ok: 1 })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://g/v1beta/models/gemini-2.0-flash:generateContent?key=K')
    expect((init as RequestInit).method).toBe('POST')
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent.generationConfig.responseMimeType).toBe('application/json')
    expect(sent.generationConfig.responseSchema).toEqual({ type: 'OBJECT' })
    expect(sent.contents[0].parts[0].text).toBe('hello')
  })

  it('throws on a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' } as Response)
    const c = new GeminiClient({ key: 'K', fetchFn })
    await expect(c.generate('x', {})).rejects.toThrow(/gemini/i)
  })

  it('throws when the model returns non-JSON text', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }),
    } as Response)
    const c = new GeminiClient({ key: 'K', fetchFn })
    await expect(c.generate('x', {})).rejects.toThrow()
  })
})
