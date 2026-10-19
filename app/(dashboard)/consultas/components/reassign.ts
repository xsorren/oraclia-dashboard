import type { PrivateConsultation } from '@/lib/api/admin';
import type { ReassignConsultationTarget } from './ReassignConsultationModal';

/**
 * Derivar a otra tarotista solo tiene sentido si la consulta sigue SIN
 * respuesta: una cancelada ya devolvió el crédito y una respondida primero hay
 * que reabrirla. Espeja las guardas de `handleReassignPrivateConsultation` en
 * la EF admin-dashboard (ALREADY_ANSWERED / ALREADY_CANCELLED).
 */
export function isReassignable(consultation: {
    status: string;
    last_message?: { sender_type?: string } | null;
}): boolean {
    if (!['open', 'claimed', 'expired'].includes(consultation.status)) return false;
    return consultation.last_message?.sender_type !== 'reader';
}

export function toReassignTarget(
    consultation: Pick<PrivateConsultation, 'id' | 'status' | 'user' | 'reader'>,
    serviceLabel: string,
): ReassignConsultationTarget {
    return {
        kind: 'private',
        id: consultation.id,
        status: consultation.status,
        serviceLabel,
        clientName: consultation.user?.display_name || 'el cliente',
        currentReaderId: consultation.reader?.id ?? null,
        currentReaderName: consultation.reader?.display_name ?? null,
    };
}
