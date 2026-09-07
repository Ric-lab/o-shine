import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    Icon = HelpCircle,
    colorTheme = "indigo", // indigo, red, green, etc.
    showCancel = true,
    secondaryAction = null,
    secondaryLabel = "Secondary"
}) {
    if (!isOpen) return null;

    // Map themes to classes
    const themes = {
        indigo: {
            bg: 'bg-indigo-50',
            text: 'text-indigo-500',
            border: 'border-indigo-200',
            btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
        },
        red: {
            bg: 'bg-red-50',
            text: 'text-red-500',
            border: 'border-red-200',
            btn: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-orange-200'
        },
        green: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            border: 'border-green-200',
            btn: 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30'
        },
        fireball: {
            bg: 'bg-red-50',
            text: 'text-red-500',
            border: 'border-red-200',
            btn: 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30'
        }
    };

    const theme = themes[colorTheme] || themes.indigo;

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 relative animate-scale-up border-2 ${theme.border}`}>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className={`p-4 rounded-full ${theme.bg} ${theme.text} mb-2 shadow-sm`}>
                        <Icon size={48} />
                    </div>

                    <div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-wide">
                            {title}
                        </h3>
                        <p className="text-gray-600 font-medium mt-2 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="w-full mt-4 flex flex-col gap-3">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-sm transition-transform active:scale-95"
                            >
                                {cancelLabel}
                            </button>
                        )}

                        {secondaryAction && (
                            <button
                                onClick={() => {
                                    secondaryAction();
                                }}
                                className="w-full py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                {secondaryLabel}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white ${theme.btn}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
