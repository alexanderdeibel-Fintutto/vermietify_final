-- Update handle_new_user to store referred_by from referral code and update referral record
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  personal_company_id uuid;
  display_name text;
  ref_code text;
  referrer_id uuid;
BEGIN
  -- Get referral code from signup metadata
  ref_code := NEW.raw_user_meta_data->>'referral_code';

  -- Look up referrer by referral code
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code LIMIT 1;
  END IF;

  -- Insert profile with referred_by
  INSERT INTO public.profiles (id, email, full_name, referred_by)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', referrer_id);

  -- Update referral record status to converted
  IF referrer_id IS NOT NULL THEN
    UPDATE public.referrals
    SET status = 'converted',
        converted_at = now(),
        referred_user_id = NEW.id
    WHERE referral_code = ref_code
      AND referred_email = LOWER(NEW.email)
      AND status = 'pending';
  END IF;

  -- Determine display name
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create personal company
  personal_company_id := gen_random_uuid();
  INSERT INTO public.companies (id, name, is_personal)
  VALUES (personal_company_id, display_name || ' – Privat', true);

  -- Add user as owner of personal company
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (personal_company_id, NEW.id, 'owner');

  RETURN NEW;
END;
$function$;