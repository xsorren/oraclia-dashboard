/**
 * Service Kind Utilities
 * Centralized mapping for service types across the admin dashboard
 */

// Human-readable names for service kinds
export const SERVICE_KIND_NAMES: Record<string, string> = {
  flash_1carta: 'Pregunta Flash',
  flash_1carta_gratis: 'Pregunta Flash (Regalo)',
  privada_3cartas: 'Consulta Privada',
  extensa_5cartas: 'Consulta Extensa',
  lectura_solos_solas: 'Lectura Solos/Solas',
  lectura_amores_pasados: 'Lectura Amores Pasados',
  lectura_amores_nuevos: 'Lectura Amores Nuevos',
  lectura_almas_gemelas: 'Lectura Almas Gemelas',
  lectura_global: 'Lectura Global',
  ritual: 'Ritual',
  carta_astral: 'Carta Astral',
  sesion_reiki: 'Sesión de Reiki',
  registros_akashicos: 'Registros Akáshicos',
  sesion_numerologia: 'Sesión de Numerología',
  analisis_suenos: 'Análisis de Sueños',
};

// Emojis for visual identification
export const SERVICE_KIND_EMOJIS: Record<string, string> = {
  flash_1carta: '⚡',
  flash_1carta_gratis: '🎁',
  privada_3cartas: '💬',
  extensa_5cartas: '📖',
  lectura_solos_solas: '💔',
  lectura_amores_pasados: '⏳',
  lectura_amores_nuevos: '💕',
  lectura_almas_gemelas: '✨',
  lectura_global: '🌍',
  ritual: '🕯️',
  carta_astral: '⭐',
  sesion_reiki: '🙏',
  registros_akashicos: '📜',
  sesion_numerologia: '🔢',
  analisis_suenos: '🌙',
};

// Category groupings for services
export const SERVICE_CATEGORIES: Record<string, string[]> = {
  'Consultas Rápidas': ['flash_1carta', 'flash_1carta_gratis'],
  'Consultas Privadas': ['privada_3cartas', 'extensa_5cartas'],
  'Lecturas de Amor': ['lectura_solos_solas', 'lectura_amores_pasados', 'lectura_amores_nuevos', 'lectura_almas_gemelas'],
  'Servicios Especiales': ['carta_astral', 'sesion_reiki', 'registros_akashicos', 'sesion_numerologia', 'analisis_suenos', 'ritual'],
  'Otras': ['lectura_global'],
};

/**
 * Get human-readable name for a service kind
 */
export function getServiceName(serviceKind: string): string {
  return SERVICE_KIND_NAMES[serviceKind] || formatServiceKind(serviceKind);
}

/**
 * Get emoji for a service kind
 */
export function getServiceEmoji(serviceKind: string): string {
  return SERVICE_KIND_EMOJIS[serviceKind] || '🔮';
}

/**
 * Get formatted display with emoji and name
 */
export function getServiceDisplay(serviceKind: string): string {
  return `${getServiceEmoji(serviceKind)} ${getServiceName(serviceKind)}`;
}

/**
 * Format raw service_kind to title case (fallback)
 */
export function formatServiceKind(serviceKind: string): string {
  return serviceKind
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get category for a service
 */
export function getServiceCategory(serviceKind: string): string {
  for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
    if (services.includes(serviceKind)) {
      return category;
    }
  }
  return 'Otras';
}
