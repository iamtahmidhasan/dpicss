import { getPayload, type Payload, type SanitizedConfig } from 'payload'
import configPromise from '@payload-config'

type PayloadConfigInput = Promise<SanitizedConfig> | SanitizedConfig

type RetryOptions = {
  attempts?: number
  delayMs?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function getPayloadWithRetry(
  configInput?: PayloadConfigInput,
  options?: RetryOptions,
): Promise<Payload> {
  const attempts = Math.max(1, options?.attempts ?? 2)
  const delayMs = Math.max(0, options?.delayMs ?? 250)

  let lastError: unknown = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const resolvedConfig = await (configInput ?? configPromise)
      return await getPayload({ config: resolvedConfig })
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await sleep(delayMs * attempt)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to initialize Payload')
}
