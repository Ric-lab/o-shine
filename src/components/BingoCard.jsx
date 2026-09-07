import React from 'react';

const COLS = ['L', 'U', 'C', 'K', 'Y'];
const THEMES = [
    // L - Rose
    { header: '#f43f5e', text: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
    // U - Sky
    { header: '#0ea5e9', text: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    // C - Emerald
    { header: '#10b981', text: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    // K - Amber
    { header: '#f59e0b', text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    // Y - Violet
    { header: '#8b5cf6', text: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
];

export default function BingoCard({ card, getImage }) {
    if (!card || card.length === 0) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="w-full relative select-none flex flex-col items-center font-sans">
            {/* Container for the Grid */}
            <div
                className="w-full max-w-[500px] p-1 shadow-2xl flex flex-col items-center rounded-xl"
                style={{
                    backgroundImage: `url(${getImage('card.png')})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat'
                }}
            >

                {/* HEADERS */}
                <div className="grid grid-cols-5 gap-0 mb-0 text-center w-full">
                    {COLS.map((letter, i) => (
                        <div key={i} className="flex items-center justify-center h-7 sm:h-9 relative">
                            <img
                                src={getImage(`${letter}.png`)}
                                alt={letter}
                                className="w-full h-full object-fill drop-shadow-sm"
                            />
                        </div>
                    ))}
                </div>

                {/* CELLS GRID */}
                <div className="grid grid-cols-5 gap-0 w-full">
                    {card.map((cell, i) => {
                        const colIndex = i % 5;
                        const theme = THEMES[colIndex];
                        const isFree = cell.num === 'FREE';

                        return (
                            <div
                                key={cell.id}
                                className={`
                                relative w-full aspect-[15/8] flex items-center justify-center
                                transition-transform duration-200
                                ${cell.marked ? 'scale-[1.02] z-10' : ''}
                            `}
                            >
                                {/* Background: Image OR Styled Div if Marked */}
                                {/* If Marked (and not FREE), we override the background as requested */}
                                {cell.marked && !isFree ? (
                                    <div
                                        className="absolute inset-0 w-full h-full rounded-sm border-[3px] shadow-lg flex items-center justify-center"
                                        style={{
                                            backgroundColor: '#fde68a', // Amber 200
                                            borderColor: '#f59e0b',     // Amber 500
                                        }}
                                    >
                                        {/* Check Icon (Emerald 600) */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="80%" height="80%" style={{ color: '#059669' }} className="opacity-20 absolute">
                                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : (
                                    <img
                                        src={isFree ? getImage("freecell.png") : getImage("cell.png")}
                                        alt="Cell"
                                        className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-sm"
                                    />
                                )}

                                {/* Number Content */}
                                {!isFree && (
                                    <span
                                        className={`
                                        z-20 font-black drop-shadow-sm pointer-events-none
                                        text-[clamp(18px,6vw,28px)] tracking-widest
                                    `}
                                        style={{
                                            color: cell.marked ? '#78350f' : theme.text // Amber 900 if marked, else Theme Text
                                        }}
                                    >
                                        {cell.num}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
