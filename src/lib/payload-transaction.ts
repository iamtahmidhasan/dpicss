import type { PayloadRequest } from 'payload'

type PayloadDbWithTransactions = {
  beginTransaction?: () => Promise<string>
  commitTransaction?: (id: string | Promise<string>) => Promise<void>
  rollbackTransaction?: (id: string | Promise<string>) => Promise<void>
}

/**
 * Runs a unit of work inside a Payload DB transaction when adapter support exists.
 * Falls back to normal execution if transactions are unavailable.
 */
export async function withPayloadTransaction<T>(
  req: PayloadRequest,
  work: () => Promise<T>,
): Promise<T> {
  const db = req.payload.db as unknown as PayloadDbWithTransactions

  if (!db?.beginTransaction || !db?.commitTransaction || !db?.rollbackTransaction) {
    return work()
  }

  const previousTransactionId = req.transactionID
  const transactionId = await db.beginTransaction()
  req.transactionID = transactionId

  try {
    const result = await work()
    await db.commitTransaction(transactionId)
    return result
  } catch (error) {
    await db.rollbackTransaction(transactionId)
    throw error
  } finally {
    req.transactionID = previousTransactionId
  }
}
