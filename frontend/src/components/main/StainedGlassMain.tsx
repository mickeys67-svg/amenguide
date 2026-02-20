"use client";

import React from 'react';
import { motion } from 'framer-motion';
import CustomMap from '../map/CustomMap';

const StainedGlassMain = () => {
    const navItems = [
        { label: "피정", href: "#" },
        { label: "내비", href: "#" },
        { label: "성전", href: "#" },
        { label: "장소", href: "#" },
        { label: "지도", href: "#" },
        { label: "내 주변", href: "#" },
    ];

    const eventCards = [
        {
            date: "2026.08.15",
            title: "하나님 알기 훈련",
            desc: "영혼의 쉼과 회복을 위한 특별한 여정에 당신을 초대합니다.",
            tag: "SPIRITUAL"
        },
        {
            date: "2026.08.15",
            title: "성지순례 길잡이",
            desc: "역사와 믿음이 살아 숨쉬는 성지들을 함께 걷습니다.",
            tag: "MAP"
        },
        {
            date: "2026.08.35",
            title: "사랑의 기쁨 특강",
            desc: "가족과 공동체 안에서 누리는 신앙의 참된 즐거움.",
            tag: "LECTURE"
        },
        {
            date: "2026.08.30",
            title: "젊은이 피정 지원",
            desc: "청년들의 고민과 열정을 신앙 안에서 나누는 시간.",
            tag: "YOUTH"
        },
        {
            date: "2026.12.30",
            title: "성탄의 기쁨 축제",
            desc: "예수 성탄 대축일을 기리며 함께하는 찬미와 기도.",
            tag: "FESTIVAL"
        },
    ];

    return (
        <div className="min-h-screen bg-modern-bg text-modern-text font-sans scroll-smooth">

            {/* 1. Header: Veritas Lux Mea */}
            <header className="fixed top-0 left-0 w-full z-50 bg-modern-bg/80 backdrop-blur-md border-b border-modern-gold/10">
                <div className="modern-container flex justify-between items-center py-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col cursor-pointer"
                    >
                        <h1 className="text-2xl md:text-3xl font-cinzel font-bold tracking-widest text-white">
                            Veritas <span className="text-modern-gold">Lux Mea</span>
                        </h1>
                    </motion.div>

                    <nav className="hidden md:flex gap-10 items-center">
                        {navItems.map((item) => (
                            <button key={item.label} className="text-sm font-medium hover:text-modern-gold transition-colors">
                                {item.label}
                            </button>
                        ))}
                        <button className="pill-button bg-modern-gold text-modern-bg ml-4 text-sm">
                            로그인
                        </button>
                    </nav>
                </div>
            </header>

            <main className="pt-32">

                {/* 2. Hero Section: 웅장한 아치 이미지와 슬로건 */}
                <section className="modern-container mb-32">
                    <div className="relative group overflow-hidden rounded-sm border border-modern-gold/20">
                        {/* 이미지 배경 (Placeholder for Church Arch) */}
                        <div className="relative h-[500px] md:h-[700px] w-full bg-[#1a1c22] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
                            {/* 실제 이미지는 없으므로 고급스러운 그라데이션과 고딕 스타일 오버레이로 대체 */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                <svg width="600" height="800" viewBox="0 0 100 100" className="text-modern-gold">
                                    <path d="M10 100 Q 50 0 90 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                    <path d="M20 100 Q 50 20 80 100" fill="none" stroke="currentColor" strokeWidth="0.3" />
                                    <path d="M30 100 Q 50 40 70 100" fill="none" stroke="currentColor" strokeWidth="0.1" />
                                </svg>
                            </div>

                            {/* Hero Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="font-serif italic text-xl md:text-2xl text-modern-gold mb-6"
                                >
                                    "The truth will set you free."
                                </motion.p>
                                <motion.h2
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-5xl md:text-8xl font-bold mb-10 tracking-tight"
                                >
                                    영혼의 안식처
                                </motion.h2>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    className="pill-button bg-modern-gold text-modern-bg text-lg px-12"
                                >
                                    더보기
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Featured Events 섹션 */}
                <section className="modern-container mb-40">
                    <div className="flex justify-between items-end mb-12 border-b border-modern-gold/20 pb-6">
                        <div>
                            <p className="text-modern-gold font-bold tracking-widest text-sm mb-2 uppercase">Featured Events</p>
                            <h3 className="text-4xl font-bold">내 주변 행사</h3>
                        </div>
                        <div className="hidden md:block">
                            <span className="text-modern-muted text-sm">PY 20</span>
                        </div>
                    </div>

                    {/* 카드 그리드 / 슬라이더 (반응형) */}
                    <div className="relative">
                        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide no-scrollbar">
                            {eventCards.map((card, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    className="min-w-[280px] md:min-w-[320px] bg-modern-card text-modern-bg rounded-sm p-8 shadow-2xl flex flex-col justify-between h-[380px]"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <p className="text-sm font-bold opacity-40">{card.date}</p>
                                            <span className="text-[10px] border border-black/10 px-2 py-0.5 font-bold uppercase">{card.tag}</span>
                                        </div>
                                        <h4 className="text-2xl font-black mb-4 leading-tight">{card.title}</h4>
                                        <p className="text-sm opacity-60 leading-relaxed font-medium">
                                            {card.desc}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-modern-gold-dim">
                                        VIEW DETAILS <span className="text-lg">→</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {/* 도트 네비게이션 효과 */}
                        <div className="flex justify-center gap-3 mt-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-modern-gold' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="mt-20 flex justify-center">
                        <button className="pill-button border border-modern-gold text-modern-gold hover:bg-modern-gold hover:text-modern-bg px-16">
                            더보기
                        </button>
                    </div>
                </section>

                {/* 4. Map Section: 반응형 및 깔끔한 지도 프레임 */}
                <section className="bg-modern-dark-card py-32 border-y border-white/5">
                    <div className="modern-container grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-4">
                            <h3 className="text-5xl font-bold mb-8 leading-tight">신앙의 지형도</h3>
                            <p className="text-modern-muted text-lg leading-relaxed mb-10">
                                당신 근처의 성지와 행사를 지도에서 직접 찾아보세요. <br />
                                스테인드글라스 마커가 당신의 영적 여행을 안내합니다.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button className="pill-button bg-modern-gold text-modern-bg text-center">전체 지역 보기</button>
                            </div>
                        </div>
                        <div className="lg:col-span-8 overflow-hidden rounded-sm border border-modern-gold/10 h-[500px]">
                            <CustomMap />
                        </div>
                    </div>
                </section>

                {/* 5. Footer Decor: 십자가 아이콘 강조 */}
                <section className="py-40 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative mb-20"
                    >
                        <div className="absolute inset-0 bg-modern-gold blur-[60px] opacity-20" />
                        <svg width="80" height="120" viewBox="0 0 80 120" className="text-modern-gold relative">
                            {/* Modern Minimalist Cross */}
                            <rect x="35" y="0" width="10" height="120" fill="currentColor" />
                            <rect x="10" y="35" width="60" height="10" fill="currentColor" />
                        </svg>
                    </motion.div>

                    <p className="font-cinzel text-xs tracking-[1em] text-white/5 uppercase select-none">
                        Ad Maiorem Dei Gloriam
                    </p>
                </section>
            </main>

            <footer className="modern-container py-12 border-t border-white/5 text-center">
                <p className="text-modern-muted text-[10px] tracking-widest font-medium">
                    © 2026 LUCE DI FEDE • VERITAS LUX MEA
                </p>
            </footer>
        </div>
    );
};

export default StainedGlassMain;
