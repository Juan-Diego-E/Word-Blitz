// Íconos SVG (lucide) referenciados por nombre desde la capa de datos.
// Reemplaza a los emojis: render consistente entre dispositivos.
import {
  AlarmClock, Armchair, BookUser, Briefcase, Building2, Bus, CalendarDays,
  Check, CircleHelp, Clapperboard, CookingPot, CupSoda, Dumbbell, Flower2,
  Ghost, Globe, Guitar, Hand, Infinity as InfinityIcon, Languages, Layers,
  MessageCircle, Music, Palette, PawPrint, Salad, Settings, Shirt, Smartphone,
  Star, Tag, Timer, Trophy, Tv, Umbrella, User, Utensils, Wrench, X,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  'alarm-clock': AlarmClock,
  armchair: Armchair,
  'book-user': BookUser,
  briefcase: Briefcase,
  'building-2': Building2,
  bus: Bus,
  'calendar-days': CalendarDays,
  check: Check,
  clapperboard: Clapperboard,
  'cooking-pot': CookingPot,
  'cup-soda': CupSoda,
  dumbbell: Dumbbell,
  'flower-2': Flower2,
  ghost: Ghost,
  globe: Globe,
  guitar: Guitar,
  hand: Hand,
  infinity: InfinityIcon,
  languages: Languages,
  layers: Layers,
  'message-circle': MessageCircle,
  music: Music,
  palette: Palette,
  'paw-print': PawPrint,
  salad: Salad,
  settings: Settings,
  shirt: Shirt,
  smartphone: Smartphone,
  star: Star,
  tag: Tag,
  timer: Timer,
  trophy: Trophy,
  tv: Tv,
  umbrella: Umbrella,
  user: User,
  utensils: Utensils,
  wrench: Wrench,
  x: X,
};

interface Props {
  name?: string;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, className, strokeWidth = 2 }: Props) {
  const C = (name && icons[name]) || CircleHelp;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
