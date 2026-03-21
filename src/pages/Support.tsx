import { ArrowLeft, Mail, Clock, ShieldCheck } from 'lucide-react';

interface SupportProps {
    onBack: () => void;
}

export default function Support({ onBack }: SupportProps) {
    return (
        <div className="min-h-screen bg-[#09090b] text-neutral-300 pb-32">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
                <button onClick={onBack} className="p-2 text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-bold uppercase tracking-widest text-white">Support & Contact</h1>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-6 py-10 space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest">Besoin d'aide ?</h2>
                    <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
                        Notre équipe est là pour répondre à toutes vos questions et résoudre vos éventuels problèmes.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0091FF] to-transparent opacity-50"></div>

                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="w-16 h-16 rounded-full bg-[#0091FF]/10 flex items-center justify-center shrink-0">
                            <Mail className="w-8 h-8 text-[#0091FF]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left flex-1">
                            <h3 className="text-white font-bold text-lg">Contactez-nous par email</h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                Vous pouvez nous contacter directement à l'adresse suivante :
                            </p>
                            <a
                                href="mailto:kali.nzeutem@gmail.com"
                                className="inline-block mt-2 text-[#0091FF] font-bold text-lg hover:underline transition-all"
                            >
                                kali.nzeutem@gmail.com
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 flex flex-col items-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h4 className="text-white font-bold text-sm">Réponse rapide</h4>
                        <p className="text-neutral-500 text-xs leading-relaxed">
                            Nous vous répondons généralement en moins de 24 heures (jours ouvrés).
                        </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 flex flex-col items-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-amber-400" />
                        </div>
                        <h4 className="text-white font-bold text-sm">Assistance garantie</h4>
                        <p className="text-neutral-500 text-xs leading-relaxed">
                            Abonnements, soucis techniques, suggestions... nous traitons chaque demande avec attention.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
