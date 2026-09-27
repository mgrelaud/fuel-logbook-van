-- Relevé du compteur kilométrique au moment du plein.
--
-- Jusqu'ici on saisissait `km`, la distance lue sur le totaliseur partiel depuis
-- le dernier plein avec distance. Une coupure de batterie remet ce partiel à
-- zéro et fait perdre la distance en cours. Le compteur total, lui, ne se
-- réinitialise pas : la distance d'un bloc devient l'écart entre deux relevés.
--
-- `km` est conservé pour l'historique déjà saisi ; un plein nouveau n'a que
-- `compteur`.
ALTER TABLE public.pleins ADD COLUMN compteur numeric CHECK (compteur >= 0);
