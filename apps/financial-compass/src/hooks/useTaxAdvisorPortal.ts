import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

export type AdvisorAccessStatus = 'active' | 'expired' | 'revoked';

export interface TaxAdvisorAccess {
  id: string;
  company_id: string;
  advisor_name: string;
  advisor_email: string;
  firm_name?: string;
  access_code: string;
  status: AdvisorAccessStatus;
  permissions: AdvisorPermissions;
  created_at: string;
  expires_at: string;
  last_access_at?: string;
  access_count: number;
}

export interface AdvisorPermissions {
  view_transactions: boolean;
  view_invoices: boolean;
  view_receipts: boolean;
  view_reports: boolean;
  export_datev: boolean;
  export_gdpdu: boolean;
  view_bank_accounts: boolean;
  view_contacts: boolean;
}

export interface AdvisorActivity {
  id: string;
  access_id: string;
  action: 'login' | 'view_report' | 'export_datev' | 'export_gdpdu' | 'view_transactions' | 'view_invoices' | 'download';
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface PortalSettings {
  company_id: string;
  portal_enabled: boolean;
  require_2fa: boolean;
  auto_expire_days: number;
  notification_on_access: boolean;
  allowed_ip_ranges?: string[];
}

const ACCESS_STORAGE_KEY = 'fintutto_tax_advisor_access';
const ACTIVITY_STORAGE_KEY = 'fintutto_tax_advisor_activity';
const SETTINGS_STORAGE_KEY = 'fintutto_tax_advisor_settings';

// Generate a random access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useTaxAdvisorPortal() {
  const { currentCompany } = useCompany();
  const [accessList, setAccessList] = useState<TaxAdvisorAccess[]>([]);
  const [activityLog, setActivityLog] = useState<AdvisorActivity[]>([]);
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    if (!currentCompany) return;

    const storedAccess = localStorage.getItem(`${ACCESS_STORAGE_KEY}_${currentCompany.id}`);
    const storedActivity = localStorage.getItem(`${ACTIVITY_STORAGE_KEY}_${currentCompany.id}`);
    const storedSettings = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_${currentCompany.id}`);

    if (storedAccess) {
      try {
        setAccessList(JSON.parse(storedAccess));
      } catch {
        setAccessList([]);
      }
    } else {
      // Demo data
      setAccessList([
        {
          id: 'advisor-1',
          company_id: currentCompany.id,
          advisor_name: 'Dr. Michael Steuer',
          advisor_email: 'steuer@kanzlei-steuer.de',
          firm_name: 'Kanzlei Steuer & Partner',
          access_code: 'A5K9-M2X7-P4L8-Q6T3',
          status: 'active',
          permissions: {
            view_transactions: true,
            view_invoices: true,
            view_receipts: true,
            view_reports: true,
            export_datev: true,
            export_gdpdu: true,
            view_bank_accounts: true,
            view_contacts: true,
          },
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
          last_access_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 15,
        },
      ]);
    }

    if (storedActivity) {
      try {
        setActivityLog(JSON.parse(storedActivity));
      } catch {
        setActivityLog([]);
      }
    } else {
      // Demo activity
      setActivityLog([
        {
          id: 'act-1',
          access_id: 'advisor-1',
          action: 'login',
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'act-2',
          access_id: 'advisor-1',
          action: 'view_report',
          details: 'BWA Januar - Dezember 2024',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
        },
        {
          id: 'act-3',
          access_id: 'advisor-1',
          action: 'export_datev',
          details: 'Buchungen Q4 2024',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 600000).toISOString(),
        },
      ]);
    }

    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch {
        setSettings(getDefaultSettings(currentCompany.id));
      }
    } else {
      setSettings(getDefaultSettings(currentCompany.id));
    }

    setLoading(false);
  }, [currentCompany]);

  // Save functions
  const saveAccessList = useCallback((list: TaxAdvisorAccess[]) => {
    if (!currentCompany) return;
    localStorage.setItem(`${ACCESS_STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(list));
    setAccessList(list);
  }, [currentCompany]);

  const saveActivityLog = useCallback((log: AdvisorActivity[]) => {
    if (!currentCompany) return;
    localStorage.setItem(`${ACTIVITY_STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(log));
    setActivityLog(log);
  }, [currentCompany]);

  const saveSettings = useCallback((newSettings: PortalSettings) => {
    if (!currentCompany) return;
    localStorage.setItem(`${SETTINGS_STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(newSettings));
    setSettings(newSettings);
  }, [currentCompany]);

  // Create new advisor access
  const createAccess = useCallback((
    data: Pick<TaxAdvisorAccess, 'advisor_name' | 'advisor_email' | 'firm_name' | 'permissions'>,
    expiresInDays: number = 365
  ) => {
    if (!currentCompany) return null;

    const newAccess: TaxAdvisorAccess = {
      id: `advisor-${Date.now()}`,
      company_id: currentCompany.id,
      advisor_name: data.advisor_name,
      advisor_email: data.advisor_email,
      firm_name: data.firm_name,
      access_code: generateAccessCode(),
      status: 'active',
      permissions: data.permissions,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      access_count: 0,
    };

    saveAccessList([newAccess, ...accessList]);
    return newAccess;
  }, [currentCompany, accessList, saveAccessList]);

  // Revoke access
  const revokeAccess = useCallback((accessId: string) => {
    const updated = accessList.map(a =>
      a.id === accessId
        ? { ...a, status: 'revoked' as AdvisorAccessStatus }
        : a
    );
    saveAccessList(updated);
  }, [accessList, saveAccessList]);

  // Extend access
  const extendAccess = useCallback((accessId: string, additionalDays: number) => {
    const updated = accessList.map(a => {
      if (a.id !== accessId) return a;
      const currentExpiry = new Date(a.expires_at);
      const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      return { ...a, expires_at: newExpiry.toISOString(), status: 'active' as AdvisorAccessStatus };
    });
    saveAccessList(updated);
  }, [accessList, saveAccessList]);

  // Regenerate access code
  const regenerateCode = useCallback((accessId: string) => {
    const updated = accessList.map(a =>
      a.id === accessId
        ? { ...a, access_code: generateAccessCode() }
        : a
    );
    saveAccessList(updated);
    return updated.find(a => a.id === accessId)?.access_code;
  }, [accessList, saveAccessList]);

  // Update permissions
  const updatePermissions = useCallback((accessId: string, permissions: AdvisorPermissions) => {
    const updated = accessList.map(a =>
      a.id === accessId
        ? { ...a, permissions }
        : a
    );
    saveAccessList(updated);
  }, [accessList, saveAccessList]);

  // Log activity (simulated)
  const logActivity = useCallback((accessId: string, action: AdvisorActivity['action'], details?: string) => {
    const activity: AdvisorActivity = {
      id: `act-${Date.now()}`,
      access_id: accessId,
      action,
      details,
      ip_address: '192.168.1.100', // Simulated
      timestamp: new Date().toISOString(),
    };

    const updated = [activity, ...activityLog].slice(0, 100); // Keep last 100
    saveActivityLog(updated);

    // Update access count
    const accessUpdated = accessList.map(a =>
      a.id === accessId
        ? { ...a, access_count: a.access_count + 1, last_access_at: new Date().toISOString() }
        : a
    );
    saveAccessList(accessUpdated);
  }, [accessList, activityLog, saveAccessList, saveActivityLog]);

  // Get activity for a specific access
  const getActivityForAccess = useCallback((accessId: string) => {
    return activityLog.filter(a => a.access_id === accessId);
  }, [activityLog]);

  // Get statistics
  const getStats = useCallback(() => {
    const activeAccess = accessList.filter(a => a.status === 'active');
    const expiredAccess = accessList.filter(a =>
      a.status === 'active' && new Date(a.expires_at) < new Date()
    );

    return {
      totalAdvisors: accessList.length,
      activeAdvisors: activeAccess.length - expiredAccess.length,
      totalLogins: accessList.reduce((sum, a) => sum + a.access_count, 0),
      recentActivity: activityLog.slice(0, 5),
    };
  }, [accessList, activityLog]);

  // Check if access is valid
  const isAccessValid = useCallback((accessId: string) => {
    const access = accessList.find(a => a.id === accessId);
    if (!access) return false;
    if (access.status !== 'active') return false;
    if (new Date(access.expires_at) < new Date()) return false;
    return true;
  }, [accessList]);

  return {
    accessList,
    activityLog,
    settings,
    loading,
    createAccess,
    revokeAccess,
    extendAccess,
    regenerateCode,
    updatePermissions,
    updateSettings: saveSettings,
    logActivity,
    getActivityForAccess,
    getStats,
    isAccessValid,
  };
}

function getDefaultSettings(companyId: string): PortalSettings {
  return {
    company_id: companyId,
    portal_enabled: true,
    require_2fa: false,
    auto_expire_days: 365,
    notification_on_access: true,
  };
}
