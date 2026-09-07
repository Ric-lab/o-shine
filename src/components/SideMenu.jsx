import React from 'react';
import { X, HelpCircle, Music, Volume2, Smartphone, Home } from 'lucide-react';

export default function SideMenu({ isOpen, onClose, onGoHome, settings, onUpdateSettings, children }) {

    const toggleSetting = (key) => {
        onUpdateSettings(prev => {
            const current = prev[key];
            // Cycle: 1 (High) -> 0 (Off) -> 0.5 (Low) -> 1 (High)
            // Or typically: Off -> Low -> High -> Off
            // Let's do: 1 -> 0 -> 0.5 -> 1 (User requested "Off -> 50% -> 100%" implicitly by asking for middle term)
            // Let's do logical cycle: 0 -> 0.5 -> 1 -> 0

            let next;
            if (current === 0) next = 0.5;
            else if (current === 0.5) next = 1;
            else next = 0; // if 1 or anything else

            return { ...prev, [key]: next };
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm z-[65] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Menu Drawer */}
            <div
                inert={!isOpen}
                aria-hidden={!isOpen}
                className={`absolute top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="font-bold text-lg text-gray-800">Menu</span>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-2">

                    {/* Settings Section */}
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Settings</h3>
                        <div className="space-y-1">
                            <ToggleItem
                                icon={<Music size={18} />}
                                label="Music"
                                value={settings?.music}
                                onToggle={() => toggleSetting('music')}
                            />
                            <ToggleItem
                                icon={<Volume2 size={18} />}
                                label="Sound Effects"
                                value={settings?.sfx}
                                onToggle={() => toggleSetting('sfx')}
                            />
                            <ToggleItem
                                icon={<Smartphone size={18} />}
                                label="Vibration"
                                value={settings?.vibration}
                                onToggle={() => toggleSetting('vibration')}
                            />
                        </div>
                    </div>

                    <div className="my-2 border-t border-gray-100" />

                    {children}
                    {/* Navigation */}
                    <nav className="flex flex-col gap-1 px-2">
                        <MenuItem icon={<Home size={20} />} label="Voltar ao Início" onClick={() => { onClose(); onGoHome?.(); }} />
                        <MenuItem icon={<HelpCircle size={20} />} label="Help" onClick={onClose} />
                    </nav>
                </div>


            </div>
        </>
    );
}

function MenuItem({ icon, label, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-xl w-full text-left transition-all ${active
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
        >
            <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
            <span className="font-semibold">{label}</span>
        </button>
    );
}

function ToggleItem({ icon, label, value, onToggle }) {
    // value: 0 (Off), 0.5 (Low), 1 (High)

    // Determine visuals
    let bgClass = 'bg-gray-300';
    let translateClass = 'translate-x-0';

    if (value === 1) {
        bgClass = 'bg-green-500';
        translateClass = 'translate-x-5';
    } else if (value === 0.5) {
        bgClass = 'bg-yellow-400';
        translateClass = 'translate-x-2.5'; // Middle
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 text-gray-600">
                {icon}
                <span className="font-medium text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-6 text-right">
                    {value === 0 ? 'OFF' : (value === 0.5 ? '50%' : 'MAX')}
                </span>
                <button
                    onClick={onToggle}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${bgClass}`}
                >
                    <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${translateClass}`}
                    />
                </button>
            </div>
        </div>
    );
}
