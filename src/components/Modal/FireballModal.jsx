import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ConfirmationReward from './ConfirmationReward';

export default function FireballModal({
    isOpen,
    onClose,
    coins,
    buyItem,
    watchReward,
    adsAvailable,
    showMessage,
    playClick
}) {
    const [showReward, setShowReward] = useState(false);
    const COST = 250;

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) setShowReward(false);
    }, [isOpen]);

    const handleConfirm = () => {
        playClick?.();
        if (coins >= COST) {
            if (buyItem('fireball', COST)) onClose();
        } else {
            showMessage('error', 'Oops!', 'Not enough coins!');
        }
    };

    const handleWatchVideo = async () => {
        playClick?.();
        if (await watchReward('fireball')) setShowReward(true);
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
                Icon={Flame}
            />
        );
    }

    return (
        <ConfirmationModal
            isOpen={isOpen}
            onClose={() => { playClick?.(); onClose(); }}
            onConfirm={handleConfirm}
            confirmLabel={
                <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-black">{COST}</span>
                    <img src="/Images/Immutable/Coin.png" alt="Coin" className="w-10 h-10 object-contain drop-shadow-md" />
                </div>
            }
            colorTheme="fireball"
            Icon={Flame}
            showCancel={false}
            secondaryLabel="Watch Video 📺"
            secondaryAction={adsAvailable ? handleWatchVideo : null}
        />
    );
}
