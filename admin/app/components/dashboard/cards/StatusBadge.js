import { ChevronDown } from "lucide-react";
import { statusIcons, statusStyles } from "../StatusConfig.js";
import { statusBadgeStyles as s } from "@/app/assets/dummyStyles.js";

const StatusBadge = ({ status, withChevron = false }) => {
  const Icon = statusIcons[status];

  return (
    <div className={`${s.badge} ${statusStyles[status] || s.badgeFallback}`}>
      {Icon && <Icon className={s.icon} />}
      {status}
      {withChevron && <ChevronDown className={s.chevron} />}
    </div>
  );
};

export default StatusBadge;
