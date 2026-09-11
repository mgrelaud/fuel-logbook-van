-- Boîte noire — système d'historique personnel.
-- Deux tables génériques : des rubriques définies par l'utilisateur (concerts,
-- spectacles, et tout ce qu'il ajoutera ensuite) et les fiches qu'elles contiennent.
-- La table `pleins` du module carburant reste inchangée.

CREATE TABLE public.rubriques (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom text NOT NULL CHECK (btrim(nom) <> ''),
  icone text NOT NULL DEFAULT 'Sparkles',
  couleur text NOT NULL DEFAULT 'orange',
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE TABLE public.fiches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rubrique_id uuid NOT NULL REFERENCES public.rubriques ON DELETE CASCADE,
  titre text NOT NULL CHECK (btrim(titre) <> ''),
  sous_titre text,
  date date,
  heure time,
  lieu text,
  ville text,
  statut text NOT NULL DEFAULT 'vu' CHECK (statut IN ('vu', 'reserve', 'envie', 'annule')),
  note smallint CHECK (note BETWEEN 0 AND 5),
  avis text,
  prix numeric CHECK (prix >= 0),
  places integer CHECK (places > 0),
  tags text[] NOT NULL DEFAULT '{}',
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Clé d'origine pour un import : rejouer l'import ne crée pas de doublon.
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fiches_user_date_idx ON public.fiches (user_id, date DESC NULLS LAST);
CREATE INDEX fiches_rubrique_idx ON public.fiches (rubrique_id, date DESC NULLS LAST);
CREATE INDEX fiches_tags_idx ON public.fiches USING gin (tags);
CREATE UNIQUE INDEX fiches_source_idx ON public.fiches (user_id, source) WHERE source IS NOT NULL;

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER fiches_touch_updated_at
  BEFORE UPDATE ON public.fiches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rubriques TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiches TO authenticated;
GRANT ALL ON public.rubriques TO service_role;
GRANT ALL ON public.fiches TO service_role;

ALTER TABLE public.rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chacun gère ses propres rubriques" ON public.rubriques
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Chacun gère ses propres fiches" ON public.fiches
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
