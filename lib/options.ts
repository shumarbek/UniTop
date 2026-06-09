import { Gamepad2, GraduationCap, Heart, MessageCircle, Network, Users } from "lucide-react";

export const purposes = [
  { value: "friendship", label: "Do'stlik", icon: Users },
  { value: "communication", label: "Suhbat", icon: MessageCircle },
  { value: "relationship", label: "Munosabat", icon: Heart },
  { value: "gaming_partner", label: "O'yin sherigi", icon: Gamepad2 },
  { value: "study_partner", label: "O'qish sherigi", icon: GraduationCap },
  { value: "networking", label: "Networking", icon: Network }
] as const;

export const interests = ["Kitob", "Sport", "IT", "Musiqa", "Sayohat", "Kino", "Til o'rganish", "Startap"];
