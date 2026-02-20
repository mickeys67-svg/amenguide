"use client";

import React from 'react';
import { motion } from 'framer-motion';

const RoseWindow = () => {
    return (
        <div className="relative w-64 h-64 md:w-[400px] md:h-[400px] mx-auto flex items-center justify-center">
            {/* 은은한 빈티지 후광 */}
            <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1], scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute w-[130%] h-[130%] bg-vintage-gold/5 rounded-full blur-[80px]"
            />

            {/* 빈티지 스타일 장미창 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 3 }}
                className="relative w-full h-full rounded-full border-[8px] border-vintage-lead shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden bg-vintage-bg"
            >
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
                    <defs>
                        <radialGradient id="v-ruby" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#8a3324" /><stop offset="100%" stopColor="#2d2a28" /></radialGradient>
                        <radialGradient id="v-amber" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#d4af37" /><stop offset="100%" stopColor="#4a3b2a" /></radialGradient>
                        <radialGradient id="v-dark" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#3d3a37" /><stop offset="100%" stopColor="#1a1a1a" /></radialGradient>
                    </defs>

                    <circle cx="50" cy="50" r="50" fill="#1a1a1a" />
                    {[...Array(12)].map((_, i) => (
                        <g key={i} transform={`rotate(${i * 30} 50 50)`}>
                            <path d="M50 50 L50 4 A46 46 0 0 1 73 10 Z" fill={i % 2 === 0 ? "url(#v-ruby)" : "url(#v-amber)"} stroke="#1a1a1a" strokeWidth="0.5" />
                            <circle cx="50" cy="20" r="4" fill="#1a1a1a" stroke="#d4af37" strokeWidth="0.1" />
                        </g>
                    ))}
                    <circle cx="50" cy="50" r="15" fill="url(#v-amber)" stroke="#1a1a1a" strokeWidth="1" />
                </svg>

                {/* 앤티크한 유리 질감 */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-black/20 pointer-events-none" />
            </motion.div>
        </div>
    );
};

export default RoseWindow;
