import { useCallback, useEffect, useRef, useState } from "react";

export const useToast = (duration = 2500) => {
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const toastTimer = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      clearTimeout(toastTimer.current);
      pending.forEach(clearTimeout);
    };
  }, []);

  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const showToast = useCallback(
    (type, message) => {
      clearTimeout(toastTimer.current);
      setToast({ show: true, type, message });
      toastTimer.current = setTimeout(
        () => setToast((prev) => ({ ...prev, show: false })),
        duration
      );
    },
    [duration]
  );

  return { toast, showToast, later };
};
