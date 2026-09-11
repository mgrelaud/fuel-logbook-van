import {
  Baby,
  Bike,
  BookOpen,
  Camera,
  Coffee,
  Drama,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Mic,
  Mountain,
  Music,
  Palette,
  Plane,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Ticket,
  Trophy,
  Tv,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * Choix d'icônes proposé à la création d'une rubrique. Une liste fermée plutôt
 * qu'un import dynamique de lucide : le bundle reste petit et le nom stocké en
 * base est toujours résoluble.
 */
export const ICONES: Record<string, LucideIcon> = {
  Music,
  Drama,
  Film,
  Tv,
  Mic,
  Ticket,
  UtensilsCrossed,
  Wine,
  Coffee,
  Plane,
  Mountain,
  Bike,
  Dumbbell,
  Trophy,
  Gamepad2,
  BookOpen,
  Palette,
  Camera,
  ShoppingBag,
  Home,
  Baby,
  Heart,
  Stethoscope,
  GraduationCap,
  MapPin,
  Fuel,
  Sparkles,
};

export const NOMS_ICONES = Object.keys(ICONES);

export function Icone({ nom, className }: { nom: string; className?: string }) {
  const Composant = ICONES[nom] ?? Sparkles;
  return <Composant className={className} />;
}
