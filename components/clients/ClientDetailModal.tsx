'use client';

import { SignedAvatar } from '@/components/common/SignedAvatar';
import type {
    ClientConsultation,
    ClientEntitlement,
    ClientFlashQuestion,
    ClientLedgerEntry,
    ClientPayment,
    ClientProfile,
    ClientStats,
} from '@/lib/api/admin';
import { useClientDetail } from '@/lib/hooks/useClients';
import { formatCurrency } from '@/lib/utils/currency';
import type { Currency } from '@/types/database';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/dates';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Gift,
    Mail,
    MapPin,
    MessageSquare,
    Package,
    Receipt,
    ShieldOff,
    Sparkles,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    clientId: string;
    onClose: () => void;
}

type TabKey = 'resumen' | 'compras' | 'creditos' | 'consultas';

const tabs: { key: TabKey; label: string; icon: typeof Activity }[] = [
    { key: 'resumen', label: 'Resumen', icon: Activity },
    { key: 'compras', label: 'Compras', icon: Receipt },
    { key: 'creditos', label: 'Créditos', icon: Sparkles },
    { key: 'consultas', label: 'Consultas', icon: MessageSquare },
];

export function ClientDetailModal({ clientId, onClose }: Props) {
    const { data: detail, isLoading, isError, error } = useClientDetail(clientId);
    const [activeTab, setActiveTab] = useState<TabKey>('resumen');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                        <p className="text-slate-400">Cargando perfil del cliente...</p>
                    </div>
                ) : isError || !detail?.data ? (
                    <div className="p-12 flex flex-col items-center text-center space-y-4">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <div className="text-slate-300 text-sm">
                            {error instanceof Error
                                ? error.message
                                : 'No se pudo cargar la información del cliente.'}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-purple-400 hover:text-purple-300 text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <Header profile={detail.data.profile} onClose={onClose} />
                        <TabBar activeTab={activeTab} onChange={setActiveTab} />
                        <div className="overflow-y-auto flex-1 px-6 py-5">
                            {activeTab === 'resumen' && (
                                <ResumenTab profile={detail.data.profile} stats={detail.data.stats} />
                            )}
                            {activeTab === 'compras' && (
                                <ComprasTab payments={detail.data.payments} />
                            )}
                            {activeTab === 'creditos' && (
                                <CreditosTab
                                    entitlements={detail.data.entitlements}
                                    ledger={detail.data.ledger}
                                />
                            )}
                            {activeTab === 'consultas' && (
                                <ConsultasTab
                                    consultations={detail.data.consultations}
                                    flashQuestions={detail.data.flash_questions}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header({ profile, onClose }: { profile: ClientProfile; onClose: () => void }) {
    const isBanned = profile.banned_until && new Date(profile.banned_until) > new Date();
    return (
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                    <SignedAvatar
                        src={profile.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                        fallback={<User className="w-6 h-6 text-slate-400" />}
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-lg truncate">
                            {profile.display_name || 'Sin nombre'}
                        </h3>
                        {!profile.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/40 text-slate-400 border border-slate-600/40">
                                Inactivo
                            </span>
                        )}
                        {isBanned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                                <ShieldOff className="w-3 h-3" /> Baneado
                            </span>
                        )}
                    </div>
                    {profile.email && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-sm">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{profile.email}</span>
                        </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                        Cliente desde {formatDateTime(profile.created_at)}
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                aria-label="Cerrar"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}

// ── Tab bar ───────────────────────────────────────────────────────────────
function TabBar({
    activeTab,
    onChange,
}: {
    activeTab: TabKey;
    onChange: (tab: TabKey) => void;
}) {
    return (
        <div className="border-b border-slate-800 px-2 flex gap-1 shrink-0 overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => {
                const active = key === activeTab;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                            active
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

// ── Tab: Resumen ──────────────────────────────────────────────────────────
function ResumenTab({ profile, stats }: { profile: ClientProfile; stats: ClientStats }) {
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    icon={MessageSquare}
                    label="Consultas"
                    value={stats.total_consultations}
                    color="purple"
                />
                <StatCard
                    icon={Receipt}
                    label="Pagos exitosos"
                    value={stats.successful_payments_count}
                    color="emerald"
                />
                <StatCard
                    icon={Sparkles}
                    label="Créditos disp."
                    value={stats.total_remaining_units}
                    color="amber"
                />
                <StatCard
                    icon={Activity}
                    label="Última actividad"
                    value={
                        stats.last_activity_at
                            ? formatRelativeTime(stats.last_activity_at)
                            : '—'
                    }
                    color="blue"
                />
            </div>

            {/* Gasto total por moneda */}
            {Object.keys(stats.total_spent_by_currency).length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Gasto total
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.total_spent_by_currency).map(([cur, amt]) => (
                            <div
                                key={cur}
                                className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm"
                            >
                                <span className="text-slate-400 mr-2">{cur}</span>
                                <span className="text-white font-semibold">
                                    {formatCurrency(amt, cur as Currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Consultas por estado */}
            {Object.keys(stats.consultations_by_status).length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">
                        Consultas por estado
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.consultations_by_status).map(([status, count]) => (
                            <span
                                key={status}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                            >
                                {status}: <span className="text-white font-bold">{count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Información personal */}
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Información</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <InfoRow label="Moneda preferida" value={profile.preferred_currency} />
                    <InfoRow label="País" value={profile.country} icon={MapPin} />
                    <InfoRow label="Zona horaria" value={profile.timezone} />
                    <InfoRow label="Onboarding" value={profile.onboarding_complete ? 'Completo' : 'Pendiente'} />
                    <InfoRow label="Signo zodiacal" value={profile.zodiac_sign} />
                    <InfoRow label="Signo lunar" value={profile.moon_sign} />
                    <InfoRow label="Ascendente" value={profile.rising_sign} />
                    <InfoRow
                        label="Último login"
                        value={profile.last_sign_in_at ? formatDateTime(profile.last_sign_in_at) : 'Nunca'}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Tab: Compras ──────────────────────────────────────────────────────────
function ComprasTab({ payments }: { payments: ClientPayment[] }) {
    if (payments.length === 0) {
        return <Empty message="Este cliente no tiene compras registradas." icon={Receipt} />;
    }
    return (
        <div className="space-y-2">
            {payments.map((p) => (
                <div
                    key={p.id}
                    className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg flex items-center gap-3"
                >
                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            paymentStatusColor(p.status)
                        }`}
                    >
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium truncate">
                                {p.pack_name ?? p.pack_sku ?? 'Pago'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                                paymentStatusColor(p.status)
                            }`}>
                                {p.status}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            {p.provider} · {formatDateTime(p.created_at)}
                            {p.units_granted ? ` · +${p.units_granted} créditos` : ''}
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-white font-semibold text-sm">
                            {formatCurrency(p.amount_money, p.currency as Currency)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Tab: Créditos ─────────────────────────────────────────────────────────
function CreditosTab({
    entitlements,
    ledger,
}: {
    entitlements: ClientEntitlement[];
    ledger: ClientLedgerEntry[];
}) {
    const activeEntitlements = entitlements.filter((e) => !e.is_expired);
    const expiredEntitlements = entitlements.filter((e) => e.is_expired);

    return (
        <div className="space-y-6">
            {/* Active entitlements */}
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Créditos activos
                </h4>
                {activeEntitlements.length === 0 ? (
                    <Empty message="Sin créditos activos." icon={Package} compact />
                ) : (
                    <div className="space-y-2">
                        {activeEntitlements.map((e) => (
                            <EntitlementRow key={e.id} entitlement={e} />
                        ))}
                    </div>
                )}
            </div>

            {/* Expired */}
            {expiredEntitlements.length > 0 && (
                <details>
                    <summary className="text-sm font-semibold text-slate-400 mb-2 cursor-pointer hover:text-slate-300">
                        Créditos expirados ({expiredEntitlements.length})
                    </summary>
                    <div className="space-y-2 mt-2">
                        {expiredEntitlements.map((e) => (
                            <EntitlementRow key={e.id} entitlement={e} expired />
                        ))}
                    </div>
                </details>
            )}

            {/* Ledger history */}
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Movimientos
                </h4>
                {ledger.length === 0 ? (
                    <Empty message="Sin movimientos registrados." icon={Activity} compact />
                ) : (
                    <div className="space-y-1.5">
                        {ledger.map((entry) => (
                            <div
                                key={entry.id}
                                className="px-3 py-2 bg-slate-800/30 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-sm"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                            entry.entry_type === 'credit'
                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                : 'bg-amber-500/15 text-amber-400'
                                        }`}
                                    >
                                        {entry.entry_type === 'credit' ? (
                                            <Gift className="w-3 h-3" />
                                        ) : (
                                            <Zap className="w-3 h-3" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-slate-200 truncate">
                                            {entry.ref_type.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {formatDateTime(entry.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-medium ${
                                        entry.entry_type === 'credit'
                                            ? 'bg-emerald-500/15 text-emerald-400'
                                            : 'bg-amber-500/15 text-amber-400'
                                    }`}
                                >
                                    {entry.entry_type}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EntitlementRow({
    entitlement,
    expired,
}: {
    entitlement: ClientEntitlement;
    expired?: boolean;
}) {
    const used = entitlement.total_purchased - entitlement.remaining_units;
    const pct = entitlement.total_purchased > 0
        ? Math.round((used / entitlement.total_purchased) * 100)
        : 0;
    return (
        <div
            className={`p-3 rounded-lg border ${
                expired
                    ? 'bg-slate-800/20 border-slate-800 opacity-60'
                    : 'bg-slate-800/40 border-slate-700'
            }`}
        >
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                        {entitlement.pack_name ?? entitlement.pack_sku}
                    </div>
                    <div className="text-xs text-slate-500">
                        {entitlement.service_kind} · adquirido{' '}
                        {formatDateTime(entitlement.purchased_at)}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-sm">
                        <span className="text-white font-bold">{entitlement.remaining_units}</span>
                        <span className="text-slate-500"> / {entitlement.total_purchased}</span>
                    </div>
                    {entitlement.expires_at && (
                        <div className="text-xs text-slate-500">
                            Expira {formatDateTime(entitlement.expires_at)}
                        </div>
                    )}
                </div>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${
                        expired
                            ? 'bg-slate-600'
                            : pct < 50
                                ? 'bg-emerald-500'
                                : pct < 90
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                    }`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ── Tab: Consultas ────────────────────────────────────────────────────────
function ConsultasTab({
    consultations,
    flashQuestions,
}: {
    consultations: ClientConsultation[];
    flashQuestions: ClientFlashQuestion[];
}) {
    if (consultations.length === 0 && flashQuestions.length === 0) {
        return <Empty message="Este cliente no tiene consultas." icon={MessageSquare} />;
    }
    return (
        <div className="space-y-6">
            {consultations.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">
                        Consultas ({consultations.length})
                    </h4>
                    <div className="space-y-2">
                        {consultations.map((c) => (
                            <div
                                key={c.id}
                                className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg"
                            >
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-white text-sm font-medium truncate">
                                            {c.service_kind.replace(/_/g, ' ')}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-medium ${
                                                consultationStatusColor(c.status)
                                            }`}
                                        >
                                            {c.status}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {formatDateTime(c.created_at)}
                                    </span>
                                </div>
                                {c.reader && (
                                    <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        Tarotista:{' '}
                                        <span className="text-purple-400">
                                            {c.reader.display_name ?? '—'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {flashQuestions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Preguntas Flash ({flashQuestions.length})
                    </h4>
                    <div className="space-y-2">
                        {flashQuestions.map((q) => (
                            <div
                                key={q.id}
                                className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg"
                            >
                                <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-medium ${
                                            consultationStatusColor(q.status)
                                        }`}
                                    >
                                        {q.status}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {formatDateTime(q.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-200 line-clamp-3 break-words">
                                    {q.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: typeof Activity;
    label: string;
    value: string | number;
    color: 'purple' | 'emerald' | 'amber' | 'blue';
}) {
    const colorMap = {
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    return (
        <div className={`p-3 border rounded-lg ${colorMap[color]}`}>
            <Icon className="w-4 h-4 mb-1.5" />
            <div className="text-xs opacity-70">{label}</div>
            <div className="text-lg font-bold text-white truncate">{value}</div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string | null;
    icon?: typeof Activity;
}) {
    if (!value) return null;
    return (
        <div className="flex items-start justify-between gap-3 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
            </span>
            <span className="text-slate-200 text-sm text-right truncate max-w-[60%]">
                {value}
            </span>
        </div>
    );
}

function Empty({
    message,
    icon: Icon,
    compact,
}: {
    message: string;
    icon: typeof Activity;
    compact?: boolean;
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center text-center text-slate-500 ${
                compact ? 'py-6' : 'py-12'
            }`}
        >
            <Icon className={compact ? 'w-6 h-6 mb-2' : 'w-10 h-10 mb-3'} />
            <p className="text-sm">{message}</p>
        </div>
    );
}

function paymentStatusColor(status: string): string {
    switch (status) {
        case 'paid':
        case 'succeeded':
        case 'completed':
            return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
        case 'pending':
        case 'created':
        case 'authorized':
            return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
        case 'failed':
        case 'cancelled':
        case 'refunded':
            return 'bg-red-500/15 text-red-400 border-red-500/20';
        default:
            return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
}

function consultationStatusColor(status: string): string {
    switch (status) {
        case 'answered':
            return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
        case 'open':
            return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
        case 'claimed':
            return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
        case 'cancelled':
        case 'expired':
            return 'bg-red-500/15 text-red-400 border-red-500/20';
        case 'closed':
            return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
        default:
            return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
}

// keep Clock import-side-effect to satisfy lints if we add it back later
void Clock;
void CheckCircle2;
