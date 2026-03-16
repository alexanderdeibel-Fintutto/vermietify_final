-- Multi-tenant financial accounting app schema

-- Companies (Mandanten)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles with company membership
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company memberships (user can belong to multiple companies)
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Bank accounts per company
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  iban TEXT,
  bic TEXT,
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts (customers/suppliers)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('customer', 'supplier', 'both')) DEFAULT 'customer',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions/Bookings
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  category TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  type TEXT CHECK (type IN ('incoming', 'outgoing')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  due_date DATE,
  issue_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Receipts/Documents
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  amount DECIMAL(15,2),
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Helper function to check company membership
CREATE OR REPLACE FUNCTION public.is_company_member(company_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = company_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Companies policies (via membership)
CREATE POLICY "Users can view companies they belong to" ON public.companies FOR SELECT USING (public.is_company_member(id));
CREATE POLICY "Users can create companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update company" ON public.companies FOR UPDATE USING (public.is_company_member(id));

-- Company members policies
CREATE POLICY "Members can view company members" ON public.company_members FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Authenticated users can join companies" ON public.company_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can delete membership" ON public.company_members FOR DELETE USING (auth.uid() = user_id);

-- Bank accounts policies
CREATE POLICY "Members can view bank accounts" ON public.bank_accounts FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update bank accounts" ON public.bank_accounts FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Members can delete bank accounts" ON public.bank_accounts FOR DELETE USING (public.is_company_member(company_id));

-- Contacts policies
CREATE POLICY "Members can view contacts" ON public.contacts FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create contacts" ON public.contacts FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update contacts" ON public.contacts FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Members can delete contacts" ON public.contacts FOR DELETE USING (public.is_company_member(company_id));

-- Transactions policies
CREATE POLICY "Members can view transactions" ON public.transactions FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create transactions" ON public.transactions FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update transactions" ON public.transactions FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Members can delete transactions" ON public.transactions FOR DELETE USING (public.is_company_member(company_id));

-- Invoices policies
CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create invoices" ON public.invoices FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update invoices" ON public.invoices FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Members can delete invoices" ON public.invoices FOR DELETE USING (public.is_company_member(company_id));

-- Receipts policies
CREATE POLICY "Members can view receipts" ON public.receipts FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create receipts" ON public.receipts FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update receipts" ON public.receipts FOR UPDATE USING (public.is_company_member(company_id));
CREATE POLICY "Members can delete receipts" ON public.receipts FOR DELETE USING (public.is_company_member(company_id));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();