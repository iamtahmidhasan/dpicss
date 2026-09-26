/**
 * Input Validation Utilities
 * Comprehensive validation for common input types
 */

// Email validation (RFC 5322 compliant)
export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string')
  }

  const trimmed = email.trim().toLowerCase()

  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    throw new Error('Invalid email format')
  }

  if (trimmed.length > 254) {
    throw new Error('Email is too long (max 254 characters)')
  }

  return trimmed
}

// String validation with length constraints
export function validateString(
  value: unknown,
  {
    fieldName = 'field',
    minLength = 1,
    maxLength = 500,
    pattern,
  }: {
    fieldName?: string
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  } = {},
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }

  const trimmed = value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()

  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`)
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`)
  }

  if (pattern && !pattern.test(trimmed)) {
    throw new Error(`${fieldName} format is invalid`)
  }

  // XSS prevention for plain-text fields: disallow HTML/control payloads entirely.
  const lower = trimmed.toLowerCase()
  const hasHtmlLikeMarkup = trimmed.includes('<') || trimmed.includes('>')
  const hasScriptScheme = lower.includes('javascript:') || lower.includes('vbscript:')
  const hasInlineHandler = lower.includes('onerror=') || lower.includes('onload=')

  if (hasHtmlLikeMarkup || hasScriptScheme || hasInlineHandler) {
    throw new Error(`${fieldName} contains invalid characters`)
  }

  return trimmed
}

// Username validation
export function validateUsername(username: unknown): string {
  if (typeof username !== 'string') {
    throw new Error('Username must be a string')
  }

  const trimmed = username.trim().toLowerCase()

  // Alphanumeric, underscore, hyphen only
  const usernameRegex = /^[a-z0-9_-]{3,30}$/

  if (!usernameRegex.test(trimmed)) {
    throw new Error('Username must be 3-30 characters (letters, numbers, _, -)')
  }

  return trimmed
}

// Password validation
export function validatePassword(
  password: unknown,
  {
    minLength = 8,
    requireNumbers = true,
    requireSpecial = false,
  }: {
    minLength?: number
    requireNumbers?: boolean
    requireSpecial?: boolean
  } = {},
): string {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string')
  }

  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters`)
  }

  if (requireNumbers && !/\d/.test(password)) {
    throw new Error('Password must contain at least one number')
  }

  if (requireSpecial && !/[!@#$%^&*]/.test(password)) {
    throw new Error('Password must contain at least one special character')
  }

  // Prevent user enumeration in error messages
  return password
}

// Number validation
export function validateNumber(
  value: unknown,
  {
    fieldName = 'field',
    min,
    max,
  }: {
    fieldName?: string
    min?: number
    max?: number
  } = {},
): number {
  const num = Number(value)

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`)
  }

  if (min !== undefined && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`)
  }

  if (max !== undefined && num > max) {
    throw new Error(`${fieldName} must be at most ${max}`)
  }

  return num
}

// URL validation
export function validateUrl(
  url: unknown,
  { allowedHosts = [] }: { allowedHosts?: string[] } = {},
): string {
  if (typeof url !== 'string') {
    throw new Error('URL must be a string')
  }

  const trimmed = url.trim()

  try {
    const parsed = new URL(trimmed)

    // Allow http/https only
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must use http:// or https://')
    }

    // Host whitelist check
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
      throw new Error(`Domain not allowed. Allowed: ${allowedHosts.join(', ')}`)
    }

    return trimmed
  } catch (err) {
    throw new Error(`Invalid URL format`)
  }
}

// Array validation
export function validateArray(
  value: unknown,
  {
    fieldName = 'field',
    minItems = 0,
    maxItems = 100,
    itemType = 'string',
  }: {
    fieldName?: string
    minItems?: number
    maxItems?: number
    itemType?: 'string' | 'number'
  } = {},
): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }

  if (value.length < minItems) {
    throw new Error(`${fieldName} must have at least ${minItems} items`)
  }

  if (value.length > maxItems) {
    throw new Error(`${fieldName} must have at most ${maxItems} items`)
  }

  if (itemType === 'string') {
    return value.map((item) => validateString(item, { fieldName: `${fieldName} item` }))
  }

  if (itemType === 'number') {
    return value.map((item) => validateNumber(item, { fieldName: `${fieldName} item` }))
  }

  return value
}

// UUID validation
export function validateUUID(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('ID must be a string')
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(value)) {
    throw new Error('Invalid ID format')
  }

  return value
}

/**
 * Safe error messages for API responses
 * Don't expose internal validation details
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle validation errors
    if (
      error.message.includes('required') ||
      error.message.includes('invalid') ||
      error.message.includes('must')
    ) {
      return error.message
    }

    // Hide internal errors
    return 'Invalid input provided'
  }

  return 'Invalid input provided'
}
