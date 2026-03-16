
-- Create a function that calls the on-user-signup edge function
CREATE OR REPLACE FUNCTION public.notify_invite_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Directly update invitations for the new user's email
  UPDATE public.app_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE recipient_email = LOWER(NEW.email)
    AND status = 'sent';
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (which is created on every signup)
CREATE TRIGGER on_profile_created_update_invitations
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_invite_on_signup();
