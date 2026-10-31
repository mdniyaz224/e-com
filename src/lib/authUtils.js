export function normalizeIdentifier(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly || trimmed;
}

export function generateToken(userId = 1) {
  return `pk_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

