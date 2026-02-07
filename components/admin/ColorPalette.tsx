'use client';

import { useState } from 'react';

export interface ColorOption {
    name: string;
    hex: string;
}

interface ColorPaletteProps {
    colors: ColorOption[];
    selected: ColorOption | null;
    onSelectColor: (color: ColorOption | null) => void;
    onCustomColorChange?: (name: string, hex: string) => void;
    allowCustom?: boolean;
}

export default function ColorPalette({
    colors,
    selected,
    onSelectColor,
    onCustomColorChange,
    allowCustom = true
}: ColorPaletteProps) {
    const [customName, setCustomName] = useState('');
    const [customHex, setCustomHex] = useState('#000000');

    const handleCustomSubmit = () => {
        if (!customName.trim()) {
            alert('Please enter a color name');
            return;
        }
        
        if (!/^#[0-9A-F]{6}$/i.test(customHex)) {
            alert('Please enter a valid hex color (e.g., #FF0000)');
            return;
        }

        const customColor: ColorOption = {
            name: customName.trim(),
            hex: customHex.toUpperCase()
        };

        onSelectColor(customColor);
        onCustomColorChange?.(customName, customHex);
        setCustomName('');
        setCustomHex('#000000');
    };

    return (
        <div className="space-y-6">
            {/* Preset Colors */}
            <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-4">
                    📌 Standard Colors
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-3">
                    {colors.map(color => (
                        <button
                            key={color.hex}
                            type="button"
                            onClick={() => onSelectColor(color)}
                            className={`relative group transition-all ${
                                selected?.hex === color.hex
                                    ? 'ring-4 ring-novraux-charcoal ring-offset-2 scale-110'
                                    : 'hover:scale-105'
                            }`}
                            title={color.name}
                        >
                            <div
                                className="w-14 h-14 rounded-xl border-2 shadow-md transition-all cursor-pointer flex items-center justify-center text-xs font-bold"
                                style={{
                                    backgroundColor: color.hex,
                                    borderColor: selected?.hex === color.hex ? '#000' : '#ddd',
                                    color: parseInt(color.hex.slice(1), 16) > 0xffffff / 2 ? '#000' : '#fff'
                                }}
                            >
                                {selected?.hex === color.hex && '✓'}
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {color.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Color */}
            {allowCustom && (
                <div className="border-t pt-6">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-4">
                        ✨ Custom Color
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-neutral-600 font-medium mb-2">Color Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Forest Green"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Must be unique and descriptive</p>
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-600 font-medium mb-2">Hex Code</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={customHex}
                                    onChange={(e) => setCustomHex(e.target.value)}
                                    className="w-12 h-10 border border-neutral-300 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={customHex}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                                            setCustomHex(val);
                                        }
                                    }}
                                    className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-novraux-charcoal focus:outline-none"
                                    placeholder="#000000"
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Format: #RRGGBB</p>
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-600 font-medium mb-2">Preview</label>
                            <div className="flex items-end gap-2 h-full">
                                <div
                                    className="flex-1 h-10 rounded-lg border-2 border-neutral-300 shadow-sm transition-all"
                                    style={{ backgroundColor: customHex }}
                                />
                                <button
                                    type="button"
                                    onClick={handleCustomSubmit}
                                    disabled={!customName.trim()}
                                    className="px-3 py-2.5 bg-novraux-charcoal text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Color Display */}
            {selected && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg border border-blue-300 shadow-sm"
                            style={{ backgroundColor: selected.hex }}
                        />
                        <div>
                            <p className="text-sm font-semibold text-blue-900">
                                Selected: <span className="font-mono">{selected.name}</span>
                            </p>
                            <p className="text-xs text-blue-700 font-mono">{selected.hex}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
