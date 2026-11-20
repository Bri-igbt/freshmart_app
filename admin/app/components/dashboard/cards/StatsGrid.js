import { statsGridStyles as s } from "@/app/assets/dummyStyles.js";

const StatsGrid = ({ cards = [] }) => {
  return (
    <div className={s.grid}>
      {cards.map(({ title, value, sub, icon: Icon }) => (
        <article key={title} className={s.card}>
          <div className={s.cardInner}>
            <div>
              <p className={s.cardTitle}>{title}</p>
              <p className={s.cardValue}>{value}</p>
            </div>

            <span className={s.cardIconWrapper}>
              {Icon && <Icon className={s.cardIcon} />}
            </span>
          </div>

          <p className={s.cardSubtext}>{sub}</p>
        </article>
      ))}
    </div>
  );
};

export default StatsGrid;
