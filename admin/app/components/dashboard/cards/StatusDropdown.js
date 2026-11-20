"use client";

import { useEffect, useRef, useState } from "react";
import StatusBadge from "./StatusBadge";
import { statusDropdownStyles as s } from "@/app/assets/dummyStyles.js";
import { statusIcons } from "../StatusConfig";

const STATUS_FLOW = {
  Processing: ["On the way", "Delivered", "Cancelled"],
  "On the way": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

const MENU_WIDTH = 200;
const MENU_HEIGHT = 180;

const StatusDropdown = ({ order, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimer = useRef(null);

  const currentStatus = order.orderStatus;
  const options = STATUS_FLOW[currentStatus] || [];
  const isFinal = options.length === 0;

  const openMenu = () => {
    clearTimeout(closeTimer.current);

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)
      );
      const opensUp = window.innerHeight - rect.bottom < MENU_HEIGHT;

      setMenuPosition(
        opensUp
          ? { left, bottom: window.innerHeight - rect.top + 8 }
          : { left, top: rect.bottom + 8 }
      );
    }
    setIsOpen(true);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const handleSelect = (status) => {
    if (
      status === "Cancelled" &&
      !window.confirm("Cancel this order? This can't be undone.")
    ) {
      return;
    }

    setIsOpen(false);
    onStatusChange(order.orderId, status);
  };

  useEffect(() => {
    return () => clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      const inside =
        buttonRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target);
      if (!inside) setIsOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const close = () => setIsOpen(false);

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  if (isFinal) {
    return <StatusBadge status={currentStatus} />;
  }

  return (
    <>
      <div
        className={s.triggerWrapper}
        onMouseEnter={openMenu}
        onMouseLeave={closeMenu}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={s.triggerButton}
        >
          <StatusBadge status={currentStatus} withChevron />
        </button>
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className={s.dropdownMenu}
          style={menuPosition}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          {options.map((status) => {
            const Icon = statusIcons[status];

            return (
              <button
                key={status}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(status)}
                className={s.optionButton}
              >
                {Icon && <Icon className={s.optionIcon} />}
                {status}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default StatusDropdown;
