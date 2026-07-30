/**
 * Normalizes a time string to HH:MM format (e.g. "8:15" or "07.10" -> "08:15", "07:10").
 * Returns the normalized string, or the original trimmed string if it doesn't match a time pattern.
 */
export function normalizeTime(time: string): string {
  if (!time) return '';
  const trimmed = time.trim().replace('.', ':');
  
  // Regex to match H:MM or HH:MM
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = trimmed.match(timeRegex);
  
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }
  
  return trimmed;
}

/**
 * Normalizes a crew name. If the crew name resembles a time (e.g. "8:15" or "07.10"),
 * it normalizes it to "08:15", "07:10". Otherwise, returns the trimmed name.
 */
export function normalizeCrewName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  
  // If it resembles time (either with colon or dot, e.g. "8:15", "08.15", "7.10")
  const normalizedTime = normalizeTime(trimmed);
  if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return normalizedTime;
  }
  
  return trimmed;
}
