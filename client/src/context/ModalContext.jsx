import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  // Confirm Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger', // 'danger' | 'warning' | 'primary'
    resolve: null
  });

  // Alert/Status Modal State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error' | 'warning' | 'info'
    title: '',
    message: '',
    details: '',
    buttonText: 'Got It',
    resolve: null
  });

  // Toasts State
  const [toasts, setToasts] = useState([]);

  // Toast Function
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Async Confirm Modal
  const showConfirm = useCallback((arg1, arg2, arg3) => {
    let config = {};
    let callback = null;

    if (typeof arg1 === 'string') {
      config = {
        title: arg1,
        message: typeof arg2 === 'string' ? arg2 : '',
        ...(typeof arg3 === 'object' && arg3 !== null ? arg3 : {})
      };
      if (typeof arg3 === 'function') {
        callback = arg3;
      } else if (typeof arg2 === 'function') {
        callback = arg2;
      }
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      config = arg1;
      if (typeof arg2 === 'function') {
        callback = arg2;
      } else if (typeof arg1.onConfirm === 'function') {
        callback = arg1.onConfirm;
      }
    }

    const {
      title = 'Are you sure?',
      message = '',
      details = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'danger'
    } = config;

    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        details,
        confirmText,
        cancelText,
        variant,
        resolve: async (result) => {
          if (result && callback) {
            try {
              await callback();
            } catch (err) {
              console.error('Error in showConfirm callback:', err);
            }
          }
          resolve(result);
        }
      });
    });
  }, []);

  const handleConfirmClose = (result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // Async Alert Modal
  const showAlert = useCallback(
    ({
      type = 'success',
      title = 'Notice',
      message = '',
      details = '',
      buttonText = 'Close'
    }) => {
      return new Promise((resolve) => {
        setAlertState({
          isOpen: true,
          type,
          title,
          message,
          details,
          buttonText,
          resolve
        });
      });
    },
    []
  );

  const showSuccess = useCallback((title, message, details = '') => {
    return showAlert({ type: 'success', title: title || 'Success', message, details });
  }, [showAlert]);

  const showError = useCallback((title, message, details = '') => {
    return showAlert({ type: 'error', title: title || 'Error', message, details });
  }, [showAlert]);

  const showWarning = useCallback((title, message, details = '') => {
    return showAlert({ type: 'warning', title: title || 'Warning', message, details });
  }, [showAlert]);

  const handleAlertClose = () => {
    if (alertState.resolve) {
      alertState.resolve(true);
    }
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider
      value={{
        showConfirm,
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showToast
      }}
    >
      {children}

      {/* ==================== CONFIRM MODAL ==================== */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative scale-in-center">
            {/* Header Icon & Title */}
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmState.variant === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                    : confirmState.variant === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                    : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                }`}
              >
                {confirmState.variant === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmState.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {confirmState.details && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                {confirmState.details}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg flex items-center gap-1.5 ${
                  confirmState.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : confirmState.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ALERT / STATUS MODAL ==================== */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative scale-in-center">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  alertState.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : alertState.type === 'error'
                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-lg shadow-rose-500/10'
                    : alertState.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                }`}
              >
                {alertState.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : alertState.type === 'error' ? (
                  <XCircle className="w-6 h-6" />
                ) : alertState.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {alertState.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {alertState.message}
                </p>
              </div>
            </div>

            {alertState.details && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono break-all">
                {alertState.details}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleAlertClose}
                className={`px-6 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg ${
                  alertState.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : alertState.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : alertState.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {alertState.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FLOATING TOASTS CONTAINER ==================== */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:bottom-5 z-[110] flex flex-col gap-2.5 sm:max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-bottom-3 duration-300 ${
              toast.type === 'success'
                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            )}
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
