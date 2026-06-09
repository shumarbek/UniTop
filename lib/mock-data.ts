import { BadgeCheck, Gamepad2, GraduationCap, Heart, MessageCircle, Network, Users } from "lucide-react";

export const purposes = [
  { value: "friendship", label: "Do'stlik", icon: Users },
  { value: "communication", label: "Suhbat", icon: MessageCircle },
  { value: "relationship", label: "Munosabat", icon: Heart },
  { value: "gaming_partner", label: "O'yin sherigi", icon: Gamepad2 },
  { value: "study_partner", label: "O'qish sherigi", icon: GraduationCap },
  { value: "networking", label: "Networking", icon: Network }
] as const;

export const interests = ["Kitob", "Sport", "IT", "Musiqa", "Sayohat", "Kino", "Til o'rganish", "Startap"];

export const demoProfiles = [
  {
    id: "p1",
    name: "Madina",
    age: 22,
    region: "Toshkent",
    district: "Yunusobod",
    purpose: "Do'stlik",
    bio: "IT, kitob va sokin suhbatlarni yaxshi ko'raman.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    interests: ["IT", "Kitob", "Kino"],
    verified: true
  },
  {
    id: "p2",
    name: "Aziz",
    age: 24,
    region: "Samarqand",
    district: "Urgut",
    purpose: "Networking",
    bio: "Startaplar, ingliz tili va futbolga qiziqaman.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    interests: ["Startap", "Sport", "Til o'rganish"],
    verified: true
  }
];

export const adminQueue = [
  { id: "UP-1042", name: "Jasmina", status: "pending", region: "Farg'ona", score: 91 },
  { id: "UP-1043", name: "Bekzod", status: "pending", region: "Buxoro", score: 84 },
  { id: "UP-1044", name: "Sevara", status: "rejected", region: "Toshkent", score: 62 }
];

export const stats = [
  { label: "Foydalanuvchilar", value: "12 480", icon: Users },
  { label: "Premium", value: "842", icon: BadgeCheck },
  { label: "Matchlar", value: "3 219", icon: Heart },
  { label: "Bugungi ro'yxat", value: "186", icon: MessageCircle }
];
