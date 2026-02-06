-- Enable RLS on faq_articles with public read
ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read FAQ articles"
ON public.faq_articles FOR SELECT
USING (is_published = true);