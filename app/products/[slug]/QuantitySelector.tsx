'use client';

import { useState } from 'react';

interface QuantitySelectorProps {
    initialQuantity?: number;
    onChange: (quantity: number) => void;
    min?: number;
    max?: number;
}

export default function QuantitySelector({
    initialQuantity = 1,
    onChange,
    min = 1,
    max = 99
}: QuantitySelectorProps) {
    const [quantity, setQuantity] = useState(initialQuantity);

    const handleDecrease = () => {
        if (quantity > min) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);
            onChange(newQuantity);
        }
    };

    const handleIncrease = () => {
        if (quantity < max) {
            const newQuantity = quantity + 1;
            setQuantity(newQuantity);
            onChange(newQuantity);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || min;
        const clampedValue = Math.min(Math.max(value, min), max);
        setQuantity(clampedValue);
        onChange(clampedValue);
    };

    return (
        <div className="flex items-center gap-4">
            <span className="text-[11px] tracking-[0.25em] text-[#5D5D5D] uppercase font-medium">Quantity</span>
            <div className="flex items-center border border-[#D4A574]">
                <button
                    onClick={handleDecrease}
                    disabled={quantity <= min}
                    className="px-4 py-2.5 text-[#2C2C2C] font-medium text-lg transition-all hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                >
                    −
                </button>
                <input
                    type="number"
                    value={quantity}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    className="w-16 bg-transparent border-x border-[#D4A574] px-3 py-2.5 text-center text-base font-semibold text-[#2C2C2C] focus:outline-none focus:ring-0"
                    aria-label="Quantity"
                />
                <button
                    onClick={handleIncrease}
                    disabled={quantity >= max}
                    className="px-4 py-2.5 text-[#2C2C2C] font-medium text-lg transition-all hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                >
                    +
                </button>
            </div>
        </div>
    );
}
