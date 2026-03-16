
ALTER TABLE public.companies DISABLE TRIGGER on_company_created;

INSERT INTO public.companies (id, name, is_personal, theme_index)
VALUES ('d1e2f3a4-b5c6-7890-abcd-ef1234567890', 'Alexander – Privat', true, 0);

INSERT INTO public.company_members (company_id, user_id, role)
VALUES ('d1e2f3a4-b5c6-7890-abcd-ef1234567890', 'a79136c4-f7d7-482e-b7d0-0febba17f29d', 'owner');

ALTER TABLE public.companies ENABLE TRIGGER on_company_created;
