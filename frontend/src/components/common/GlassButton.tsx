"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GlassButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'primary' | 'secondary';
}

const GlassButton = ({ children, onClick, className = "", variant = 'primary' }: GlassButtonProps) => {
    const baseStyles = "relative px-8 py-3 rounded-sm font-gothic tracking-[0.2em] uppercase transition-all duration-300 overflow-hidden group";
    const variants = {
        primary: "border border-amber-gold/50 text-amber-gold hover:text-white",
        secondary: "border border-white/20 text-white/70 hover:text-white",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-gold/0 via-amber-gold/10 to-amber-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">{children}</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-gold/5 backdrop-blur-sm" />
        </motion.button>
    );
};

export default GlassButton;
