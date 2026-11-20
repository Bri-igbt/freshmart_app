import { toastStyles as s } from "@/app/assets/dummyStyles.js";

const TYPE_STYLES = {
  success: s.toastSuccess,
  warning: s.toastWarning,
  error: s.toastError,
};

const Toast = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${s.toast} ${TYPE_STYLES[toast.type] || s.toastSuccess}`}
    >
      {toast.message}
    </div>
  );
};

export default Toast;