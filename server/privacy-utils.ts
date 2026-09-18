import { Report, User } from './types.js';

export function maskName(name?: string): string {
  if (!name) return 'Resident';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].slice(0, 1)}.`;
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return 'Protected';
  const clean = phone.trim();
  if (clean.length <= 4) return '***';
  // Keep first 5 chars and last 3 chars, mask the middle
  const prefix = clean.slice(0, Math.min(6, clean.length - 3));
  const suffix = clean.slice(-3);
  return `${prefix} *** ${suffix}`;
}

export function maskMeterNumber(meter?: string): string {
  if (!meter) return '';
  const clean = meter.trim();
  if (clean.length <= 4) return '****';
  return `******${clean.slice(-4)}`;
}

export function maskAccountReference(account?: string): string {
  if (!account) return '';
  const clean = account.trim();
  if (clean.length <= 3) return '***';
  return `***${clean.slice(-3)}`;
}

/**
 * Sanitizes report data based on viewer's role and authorization.
 * - Resident owner, District Manager, and System Admin have full operational access.
 * - Field Engineers get technical location and fault data with masked citizen contact info.
 * - General/Public viewers get fully anonymized citizen info.
 */
export function sanitizeReportForUser(report: Report, user: User | null): Report {
  if (!report) return report;

  // If user is owner or system admin
  if (user && (user.id === report.reporterId || user.role === 'ADMIN' || user.role === 'SYSTEM_ADMINISTRATOR')) {
    return report;
  }

  // If user is district manager or verifier in the SAME district
  if (
    user &&
    (user.role === 'MANAGER' || user.role === 'PROVIDER_MANAGER' || user.role === 'VERIFIER') &&
    user.district &&
    report.district &&
    user.district.toLowerCase() === report.district.toLowerCase()
  ) {
    return report;
  }

  // If user is field engineer: mask citizen personal credentials to protect privacy while preserving fault diagnosis
  if (user && user.role === 'ENGINEER') {
    return {
      ...report,
      reporterName: maskName(report.reporterName),
      reporterPhone: maskPhone(report.reporterPhone),
      meterNumber: maskMeterNumber(report.meterNumber),
      accountReference: maskAccountReference(report.accountReference)
    };
  }

  // Public / unauthenticated / other resident: completely anonymize
  return {
    ...report,
    reporterName: 'Resident Report',
    reporterPhone: 'Protected for Privacy',
    meterNumber: report.meterNumber ? '******' : undefined,
    accountReference: report.accountReference ? '******' : undefined
  };
}
