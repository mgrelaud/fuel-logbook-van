import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const LARGEUR_ACTION = 96;
/** Déplacement horizontal à partir duquel on considère que c'est un glissé et non un appui. */
const SEUIL_INTENTION = 8;
/** Au relâché, on ouvre si le doigt a dépassé la moitié de la zone d'action. */
const SEUIL_OUVERTURE = LARGEUR_ACTION / 2;

/**
 * Ligne de liste qu'on fait glisser vers la gauche pour révéler la suppression.
 *
 * La suppression reste en deux gestes délibérés — glisser, puis appuyer — pour
 * qu'un frôlement dans le train ne fasse pas disparaître un souvenir.
 */
export function LigneGlissable({
  ouverte,
  onOuverture,
  onSupprimer,
  etiquette,
  children,
}: {
  ouverte: boolean;
  onOuverture: (ouverte: boolean) => void;
  onSupprimer: () => void;
  etiquette: string;
  children: React.ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const depart = useRef<{ x: number; y: number; base: number } | null>(null);
  const horizontal = useRef(false);
  const aGlisse = useRef(false);
  // Le décalage courant est aussi tenu dans une ref : au relâché, l'état React
  // du dernier `pointermove` peut ne pas être encore committé.
  const dxRef = useRef(0);

  function placer(valeur: number) {
    dxRef.current = valeur;
    setDx(valeur);
  }

  // Suit les fermetures décidées ailleurs : ouvrir une autre ligne referme celle-ci.
  // Le retour en place après un glissé, lui, est fait explicitement dans `fin` —
  // un flick peut livrer le `pointermove` et le `pointerup` dans la même tâche,
  // auquel cas React ne voit aucune dépendance changer et l'effet ne rejoue pas.
  useEffect(() => {
    if (!enCours) placer(ouverte ? -LARGEUR_ACTION : 0);
  }, [ouverte, enCours]);

  function debut(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    depart.current = { x: e.clientX, y: e.clientY, base: dxRef.current };
    horizontal.current = false;
    aGlisse.current = false;
  }

  function mouvement(e: React.PointerEvent) {
    const d = depart.current;
    if (!d) return;
    const ecartX = e.clientX - d.x;
    const ecartY = e.clientY - d.y;

    if (!horizontal.current) {
      // Tant que l'intention n'est pas claire, on laisse la page défiler.
      if (Math.abs(ecartY) > Math.abs(ecartX)) {
        depart.current = null;
        return;
      }
      if (Math.abs(ecartX) < SEUIL_INTENTION) return;
      horizontal.current = true;
      aGlisse.current = true;
      setEnCours(true);
    }

    placer(Math.max(-LARGEUR_ACTION, Math.min(0, d.base + ecartX)));
  }

  function fin() {
    depart.current = null;
    if (!horizontal.current) return;
    horizontal.current = false;
    const doitOuvrir = dxRef.current <= -SEUIL_OUVERTURE;
    setEnCours(false);
    placer(doitOuvrir ? -LARGEUR_ACTION : 0);
    onOuverture(doitOuvrir);
  }

  return (
    <li
      className="relative overflow-hidden"
      style={{ borderRadius: "var(--radius-2xl)" }}
      onPointerDown={debut}
      onPointerMove={mouvement}
      onPointerUp={fin}
      onPointerCancel={fin}
    >
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: LARGEUR_ACTION }}
        aria-hidden={!ouverte}
      >
        <button
          type="button"
          onClick={onSupprimer}
          aria-label={`Supprimer ${etiquette}`}
          tabIndex={ouverte ? 0 : -1}
          className="flex w-full flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground"
        >
          <Trash2 className="size-5" />
          <span className="text-[10px] font-semibold">Supprimer</span>
        </button>
      </div>

      <div
        // touch-pan-y : le navigateur garde le défilement vertical, on récupère l'horizontal.
        className="card-surface relative touch-pan-y p-4"
        style={{
          transform: `translateX(${dx}px)`,
          transition: enCours ? "none" : "transform 180ms ease-out",
        }}
        onClickCapture={(e) => {
          // Un glissé ne doit pas se terminer en ouverture de fiche ; et quand la
          // ligne est ouverte, le premier appui sert à refermer.
          if (aGlisse.current || ouverte) {
            e.preventDefault();
            e.stopPropagation();
            aGlisse.current = false;
            if (ouverte) onOuverture(false);
          }
        }}
      >
        {children}
      </div>
    </li>
  );
}
