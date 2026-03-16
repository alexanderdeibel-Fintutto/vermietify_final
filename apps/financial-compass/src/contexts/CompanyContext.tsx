import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  tax_id?: string;
  address?: string;
  legal_form?: string;
  vat_id?: string;
  zip?: string;
  city?: string;
  chart_of_accounts?: string;
  is_personal?: boolean;
  theme_index?: number;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company | null) => void;
  personalCompany: Company | null;
  businessCompanies: Company[];
  loading: boolean;
  refetchCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const ensurePersonalCompany = async (): Promise<Company | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mein';
      
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({ name: `${displayName} – Privat`, is_personal: true })
        .select()
        .single();

      if (error) {
        console.error('Error creating personal company:', error);
        return null;
      }

      return newCompany;
    } catch (error) {
      console.error('Error ensuring personal company:', error);
      return null;
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data: memberships } = await supabase
        .from('company_members')
        .select('company_id');

      let companiesData: Company[] = [];

      if (memberships && memberships.length > 0) {
        const companyIds = memberships.map(m => m.company_id);
        const { data } = await supabase
          .from('companies')
          .select('id, name, tax_id, address, legal_form, vat_id, zip, city, chart_of_accounts, is_personal, theme_index')
          .in('id', companyIds);

        companiesData = data || [];
      }

      // Check if personal company exists, create if not
      const hasPersonal = companiesData.some(c => c.is_personal);
      if (!hasPersonal) {
        const personalCompany = await ensurePersonalCompany();
        if (personalCompany) {
          companiesData.push(personalCompany);
        }
      }

      // Sort: personal first, then alphabetical
      const sorted = [...companiesData].sort((a, b) => {
        if (a.is_personal && !b.is_personal) return -1;
        if (!a.is_personal && b.is_personal) return 1;
        return a.name.localeCompare(b.name);
      });
      setCompanies(sorted);
      if (!currentCompany && sorted.length > 0) {
        const personal = sorted.find(c => c.is_personal);
        setCurrentCompany(personal || sorted[0]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const personalCompany = companies.find(c => c.is_personal) || null;
  const businessCompanies = companies.filter(c => !c.is_personal);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        setCurrentCompany,
        personalCompany,
        businessCompanies,
        loading,
        refetchCompanies: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
