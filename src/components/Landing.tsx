import React from 'react';
import { ArrowRight, Sparkles, ImagePlus, User } from 'lucide-react';
import BrandMark from './BrandMark';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
    onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
    const { language, setLanguage } = useLanguage();
    const isFrench = language === 'fr' || navigator.language.startsWith('fr');

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white overflow-y-auto">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <BrandMark />
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            {language === 'fr' ? 'EN' : 'FR'}
                        </button>
                        <button 
                            onClick={onStart}
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                        >
                            {isFrench ? 'Se connecter' : 'Log in'}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
                {/* Hero */}
                <section className="py-20 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0091FF]/10 text-[#0091FF] border border-[#0091FF]/20 text-xs font-bold uppercase tracking-widest mb-8">
                        <Sparkles className="w-4 h-4" />
                        <span>{isFrench ? 'L\'IA au service des futurs tatoués' : 'AI for future tattooed people'}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 max-w-4xl">
                        {isFrench ? 'Essayez avant de' : 'Try before you'} <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0091FF] to-[#00DC82]">
                            {isFrench ? 'passer à l\'acte.' : 'get inked.'}
                        </span>
                    </h1>
                    <p className="text-xl text-neutral-400 mb-10 max-w-2xl">
                        {isFrench 
                            ? "Visualisez n'importe quel tatouage sur votre peau avec un réalisme parfait grâce à notre IA. Prenez la bonne décision." 
                            : "Visualize any tattoo on your skin with perfect realism thanks to our AI. Make the right decision."}
                    </p>
                    <button 
                        onClick={onStart}
                        className="px-8 py-4 bg-white text-black rounded-xl font-black flex items-center gap-3 hover:bg-neutral-200 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                        <span>{isFrench ? 'Tester gratuitement' : 'Try for free'}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </section>

                {/* Steps */}
                <section className="py-20 border-t border-white/5">
                    <h2 className="text-3xl font-bold text-center mb-16">{isFrench ? 'Comment ça marche ?' : 'How it works?'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[#0091FF]/10 text-[#0091FF] rounded-2xl flex items-center justify-center mb-6">
                                <ImagePlus className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">1. {isFrench ? 'Importez' : 'Upload'}</h3>
                            <p className="text-neutral-400">{isFrench ? 'Prenez en photo la zone de votre corps que vous souhaitez tatouer.' : 'Take a photo of the body part you want to tattoo.'}</p>
                        </div>
                        <div className="bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[#00DC82]/10 text-[#00DC82] rounded-2xl flex items-center justify-center mb-6">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">2. {isFrench ? 'Placez' : 'Place'}</h3>
                            <p className="text-neutral-400">{isFrench ? 'Ajustez votre motif à la perfection (taille, rotation).' : 'Adjust your design perfectly (size, rotation).'}</p>
                        </div>
                        <div className="bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">3. {isFrench ? 'Générez' : 'Generate'}</h3>
                            <p className="text-neutral-400">{isFrench ? "L'IA fusionne le dessin avec votre peau de manière photoréaliste." : 'The AI blends the design with your skin photorealistically.'}</p>
                        </div>
                    </div>
                </section>
                
                {/* CTA */}
                <section className="py-24 flex flex-col items-center text-center relative">
                    <div className="w-48 h-48 mb-8 bg-gradient-to-br from-[#0091FF] to-[#00DC82] rounded-full flex items-center justify-center blur-[100px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"></div>
                    <h2 className="text-4xl font-black mb-6 relative z-10">{isFrench ? 'Prêt à visualiser votre prochain tatouage ?' : 'Ready to visualize your next tattoo?'}</h2>
                    <button 
                        onClick={onStart}
                        className="px-8 py-4 bg-white text-black rounded-xl font-black transition-transform hover:scale-[1.02] relative z-10"
                    >
                        {isFrench ? 'Créer un compte maintenant' : 'Create an account now'}
                    </button>
                    <p className="text-neutral-500 mt-4 text-sm relative z-10">{isFrench ? 'Essayez nos fonctionnalités gratuitement.' : 'Try our features for free.'}</p>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 text-center text-neutral-500 text-sm">
                <p>© 2026 Tattoo Vision. {isFrench ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
                <div className="flex justify-center gap-4 mt-4">
                    <span onClick={onStart} className="hover:text-white cursor-pointer transition-colors">CGU</span>
                    <span onClick={onStart} className="hover:text-white cursor-pointer transition-colors">Confidentialité</span>
                </div>
            </footer>
        </div>
    );
}
