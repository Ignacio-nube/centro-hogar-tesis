/**
 * Escapa los wildcards de LIKE para evitar que un input del usuario
 * coincida con todo (ej: search="%" → vacío sin escapar).
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, '\\$&')
}
