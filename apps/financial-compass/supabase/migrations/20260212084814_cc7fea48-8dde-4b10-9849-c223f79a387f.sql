
-- Function to get referral leaderboard (top referrers by converted referrals)
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  display_name text,
  avatar_url text,
  converted_count bigint,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      CASE 
        WHEN p.full_name IS NOT NULL AND length(p.full_name) > 0 
        THEN split_part(p.full_name, ' ', 1) || ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.'
        ELSE 'Nutzer'
      END,
      'Nutzer'
    ) AS display_name,
    p.avatar_url,
    count(*) AS converted_count,
    row_number() OVER (ORDER BY count(*) DESC) AS rank
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_user_id
  WHERE r.status = 'converted'
  GROUP BY p.id, p.full_name, p.avatar_url
  HAVING count(*) > 0
  ORDER BY converted_count DESC
  LIMIT limit_count;
$$;
