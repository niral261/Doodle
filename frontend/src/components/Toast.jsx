import React, { useEffect, useState } from "react";
import "./Toast.css";

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    info: "💬",
    success: "🎉",
    warning: "⚠️",
  };

  return (
    <div className={`toast toast-${toast.type} ${exiting ? "toast-exit" : ""}`}>
      <span className="toast-icon">{icons[toast.type] || "💬"}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => {
          setExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
      >
        ✕
      </button>
    </div>
  );
}

function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

export default Toast;
