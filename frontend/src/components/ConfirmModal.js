import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'default' }) => {
  if (!isOpen) return null;

  const isDelete = type === 'delete' || title?.toLowerCase().includes('delete') || title?.toLowerCase().includes('remove');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          {isDelete && (
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
            </div>
          )}
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h3>
        </div>
        <p className={`text-sm text-slate-600 dark:text-slate-400 mb-6 ${isDelete ? 'ml-13' : ''}`}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-2xl transition-colors shadow-md ${
              isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-indigo-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;