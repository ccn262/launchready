import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, Radio, ShieldCheck } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Operational overview and readiness status",
    icon: LayoutDashboard,
  },
  {
    href: "/crew",
    label: "Crew",
    description: "Availability, qualifications, and cover",
    icon: Users,
  },
  {
    href: "/dla",
    label: "DLA",
    description: "Duty rota and launch-alert coordination",
    icon: Radio,
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Stations, organisations, and controls",
    icon: ShieldCheck,
  },
];
