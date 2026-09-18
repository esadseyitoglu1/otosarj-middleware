import { useRef } from 'react';

/**
 * Pseudonim oturum kimligi -- her sayfa yuklemesinde yeni bir kimlik
 * uretilir. Kisisel veri degil, motorun R5 suppression kurali icin
 * "ayni oturum tekrar mi soruyor" kontrolu yapmasina yarar (bkz. Guvenlik G2).
 */
function generateSessionId(): string {
  const rand = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `web-${hex}`;
}

export function useSessionId(): string {
  const ref = useRef<string | null>(null);
  if (!ref.current) ref.current = generateSessionId();
  return ref.current;
}
