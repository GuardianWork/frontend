import {
  Bell,
  BriefcaseBusiness,
  Building2,
  FileText,
  Gift,
  Mail,
  Megaphone,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory } from "@/services/notifications";

const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  job: BriefcaseBusiness,
  application: FileText,
  company: Building2,
  account: UserRound,
  verification: ShieldCheck,
  announcement: Megaphone,
  community: Users,
  reward: Gift,
  promotion: Mail,
  system: Bell,
};

export function NotificationCategoryIcon({
  category,
  size = 18,
}: {
  category: NotificationCategory;
  size?: number;
}) {
  const Icon = CATEGORY_ICONS[category] ?? Bell;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
