import { v4 as uuidv4 } from 'uuid';

export function generateApiKey(): string {
  return `fsk_${uuidv4().replace(/-/g, '')}`;
}
