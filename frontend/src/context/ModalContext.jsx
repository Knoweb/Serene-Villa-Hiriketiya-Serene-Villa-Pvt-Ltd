import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle, X, Check, Lock, Sparkles 
} from 'lucide-react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm' | 'alert' | 'success' | 'danger' | 'warning' | 'info'
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
    showCancel: true,
    icon: null,
    resolve: null
  });

  const closeModal = useCallback((result = false) => {
    setModalState(prev => {
      if (prev.resolve) {
        prev.resolve(result);
      }
      return { ...prev, isOpen: false, resolve: null };
    });
  }, []);

  const showConfirm = useCallback(({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    type = 'confirm'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: isDanger ? 'danger' : type,
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        showCancel: true,
        resolve
      });
    });
  }, []);

  const showAlert = useCallback(({
    title = 'Notification',
    message = '',
    type = 'info', // 'success' | 'warning' | 'danger' | 'info'
    confirmText = 'OK'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText: '',
        isDanger: type === 'danger',
        showCancel: false,
        resolve
      });
    });
  }, []);

  const getThemeDetails = () => {
    switch (modalState.type) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-7 h-7 text-rose-600 animate-bounce" />,
          badgeBg: 'bg-rose-100/80 text-rose-700 border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 text-white',
          accentBorder: 'border-rose-100',
          gradientBg: 'from-rose-50/50 to-white'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-7 h-7 text-amber-600" />,
          badgeBg: 'bg-amber-100/80 text-amber-700 border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 text-white',
          accentBorder: 'border-amber-100',
          gradientBg: 'from-amber-50/50 to-white'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" />,
          badgeBg: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 text-white',
          accentBorder: 'border-emerald-100',
          gradientBg: 'from-emerald-50/50 to-white'
        };
      case 'info':
        return {
          icon: <Info className="w-7 h-7 text-sky-600" />,
          badgeBg: 'bg-sky-100/80 text-sky-800 border-sky-200',
          btnBg: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30 text-white',
          accentBorder: 'border-sky-100',
          gradientBg: 'from-sky-50/50 to-white'
        };
      case 'confirm':
      default:
        return {
          icon: <HelpCircle className="w-7 h-7 text-emerald-600" />,
          badgeBg: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
          btnBg: 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/30 text-white',
          accentBorder: 'border-emerald-100',
          gradientBg: 'from-emerald-50/40 via-white to-white'
        };
    }
  };

  const theme = getThemeDetails();

  return (
    <ModalContext.Provider value={{ showConfirm, showAlert, closeModal }}>
      {children}

      {/* Modern Pop-up Modal UI */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          {/* Backdrop with smooth blur */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              if (modalState.showCancel) closeModal(false);
              else closeModal(true);
            }}
          />

          {/* Dialog Container */}
          <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl border ${theme.accentBorder} overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 scale-100`}>
            
            {/* Top decorative header gradient */}
            <div className={`p-6 pb-4 bg-gradient-to-b ${theme.gradientBg} border-b border-slate-100/80 relative`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0`}>
                  {theme.icon}
                </div>
                <div className="flex-1 pr-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Serene Villa • Notification
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-snug mt-0.5">
                    {modalState.title}
                  </h3>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => closeModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-4 space-y-4">
              <div className="text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-line bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100/90">
                {modalState.message}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                {modalState.showCancel && (
                  <button
                    type="button"
                    onClick={() => closeModal(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    {modalState.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={() => closeModal(true)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 ${theme.btnBg}`}
                >
                  <Check size={14} />
                  {modalState.confirmText}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
