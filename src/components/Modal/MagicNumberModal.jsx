import React, { useState } from 'react';
import { X, Check, Wand2 } from 'lucide-react';
import ConfirmationReward from './ConfirmationReward';

export default function MagicNumberModal({
    isOpen,
    onClose,
    coins,        // To check affordance
    onMagicSpin,  // Callback when a number is successfully chosen (paid or free)
    watchReward,
    adsAvailable,
    showMessage,  // For feedback
    bingoCard,
    playClick
}) {
    const [selectedId, setSelectedId] = useState(null);
    const [showReward, setShowReward] = useState(false); // New state

    // Reset selection whenever modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedId(null);
            setShowReward(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Helper to get selection details
    const selectedCell = bingoCard.find(c => c.id === selectedId);
    const selectedNumber = selectedCell ? selectedCell.num : null;
    const COST = 500;

    const handleConfirm = () => {
        playClick?.();
        if (selectedNumber) {
            if (coins >= COST) {
                // Trigger parent action with cost
                onMagicSpin(selectedNumber, COST);
                onClose();
            } else {
                showMessage('error', 'Oops!', 'Not enough coins!');
            }
        }
    };

    const handleWatchVideo = async () => {
        playClick?.();
        if (!selectedNumber) return;
        if (await watchReward('magic', selectedNumber)) setShowReward(true);
    };

    const handleCloseReward = () => {
        playClick?.();
        setShowReward(false);
        onClose();
    };

    if (showReward) {
        return (
            <ConfirmationReward
                isOpen={true}
                onClose={handleCloseReward}
                Icon={Wand2}
            />
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative animate-scale-up border-2 border-indigo-200">

                <button
                    onClick={() => { playClick?.(); onClose(); }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
                >
                    <X size={20} />
                </button>

                <div className="p-6 pb-0 flex flex-col items-center space-y-2">
                    <div className="p-4 rounded-full bg-indigo-50 text-indigo-500 shadow-sm mb-1">
                        <Wand2 size={40} />
                    </div>
                </div>

                {/* Grid - Adjusted to fit within the container flow */}
                <div className="px-6 py-4 grid grid-cols-5 gap-2 bg-white flex-1 overflow-y-auto max-h-[40vh]">
                    {bingoCard.map((cell) => {
                        const isMarked = cell.marked || cell.isFree;
                        const isSelected = cell.id === selectedId;

                        return (
                            <button
                                key={cell.id}
                                disabled={isMarked}
                                onClick={() => { playClick?.(); setSelectedId(cell.id); }}
                                className={`
                                    relative aspect-square rounded-xl flex items-center justify-center font-black text-lg transition-all shadow-sm
                                    ${isMarked
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-yellow-400 text-yellow-900 scale-110 shadow-lg border-2 border-yellow-600/50 z-10'
                                            : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-100 hover:scale-105 active:scale-95'
                                    }
                                `}
                            >
                                {cell.isFree ? '★' : cell.num}
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-md">
                                        <Check size={10} className="text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer / Confirm */}
                <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
                    <button
                        onClick={handleWatchVideo}
                        disabled={!selectedNumber || !adsAvailable}
                        className={`
                            w-full py-3 rounded-xl font-bold text-white bg-blue-500 shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2
                            ${!selectedNumber ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
                        `}
                    >
                        Watch Video 📺
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedNumber}
                        className={`
                            w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all
                            ${selectedNumber
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        {selectedNumber ? (
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-4xl font-black">{COST}</span>
                                <img src="/Images/Immutable/Coin.png" alt="Coin" className="w-10 h-10 object-contain drop-shadow-md" />
                            </div>
                        ) : (
                            'Select a Number'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
