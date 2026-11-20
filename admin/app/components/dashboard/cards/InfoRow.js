import { infoRowStyles as s } from "@/app/assets/dummyStyles.js";

const isEmpty = (value) =>
  value === undefined || value === null || value === "";

const InfoRow = ({ icon: Icon, label, value, wide = false }) => (
  <div className={`${s.container} ${wide ? s.wide : ""}`}>
    <div className={s.header}>
      {Icon && <Icon className={s.icon} />}
      <span>{label}</span>
    </div>
    <p className={s.value}>{isEmpty(value) ? "-" : value}</p>
  </div>
);

export default InfoRow;
