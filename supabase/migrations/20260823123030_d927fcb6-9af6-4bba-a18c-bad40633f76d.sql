CREATE TABLE public.pleins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  litres numeric NOT NULL CHECK (litres > 0),
  km numeric NOT NULL CHECK (km > 0),
  cout numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pleins_user_id_date_idx ON public.pleins (user_id, date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pleins TO authenticated;
GRANT ALL ON public.pleins TO service_role;

ALTER TABLE public.pleins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own pleins" ON public.pleins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);