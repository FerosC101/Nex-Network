/**
 * Sanitizes consecutive character spam in real time.
 * Prevents 4 or more identical consecutive characters (max 3 allowed by default, e.g. "aaa" ok, 4th "a" blocked).
 */
export function sanitizeConsecutiveSpam(val: string, maxConsecutive = 3): string {
  if (!val) return val;
  const regex = new RegExp(`(.)\\1{${maxConsecutive},}`, 'gi');
  let sanitized = val;
  while (regex.test(sanitized)) {
    sanitized = sanitized.replace(regex, (_, char) => char.repeat(maxConsecutive));
  }
  return sanitized;
}
