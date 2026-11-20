import { XCircle } from "lucide-react";
import { statusTimelineStyles as s } from "@/app/assets/dummyStyles.js";

const STEPS = ["Processing", "On the way", "Delivered"];

const StatusTimeline = ({ status }) => {
  if (status === "Cancelled") {
    return (
      <div className={s.cancelledContainer}>
        <XCircle className={s.cancelledIcon} />
        <span className={s.cancelledText}>Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className={s.timeline}>
      {STEPS.map((step, index) => {
        const active = currentIndex >= index;
        const last = index === STEPS.length - 1;
        const lineActive = currentIndex > index;

        return (
          <div key={step} className={s.stepWrapper}>
            <div className={s.stepInner}>
              <span
                className={`${s.stepDot} ${
                  active ? s.stepDotActive : s.stepDotInactive
                }`}
              />

              <span
                className={`${s.stepLabel} ${
                  active ? s.stepLabelActive : s.stepLabelInactive
                }`}
              >
                {step}
              </span>
            </div>

            {!last && (
              <span
                className={`${s.stepLine} ${
                  lineActive ? s.stepLineActive : s.stepLineInactive
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
