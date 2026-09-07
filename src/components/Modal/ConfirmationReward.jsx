import React from 'react';
import { Check, X } from 'lucide-react';

export default function ConfirmationReward({
    isOpen,
    onClose,
    title = "Reward Granted!",
    message = "Your power-up is ready.",
    Icon = Check
}) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative animate-scale-up border-2 border-green-200">

                <div className="p-8 flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-green-50 text-green-500 shadow-sm animate-bounce">
                        <Icon size={48} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-wide">
                            {title}
                        </h2>
                        <p className="text-gray-600 font-medium mt-2">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 mt-4 rounded-xl font-black text-white bg-green-500 hover:bg-green-600 shadow-green-200 shadow-lg transition-transform active:scale-95"
                    >
                        OK!
                    </button>
                </div>
            </div>
        </div>
    );
}
