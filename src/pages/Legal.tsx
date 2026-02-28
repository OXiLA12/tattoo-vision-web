import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalProps {
    onBack: () => void;
    section?: string;
}

export default function Legal({ onBack, section }: LegalProps) {
    useEffect(() => {
        if (section) {
            const el = document.getElementById(section);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
    }, [section]);

    return (
        <div className="min-h-screen bg-[#09090b] text-neutral-300 pb-32">
            <div className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
                <button onClick={onBack} className="p-2 text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-bold uppercase tracking-widest text-white">Informations légales</h1>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-10 space-y-16">

                {/* Mentions légales */}
                <section id="mentions">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Mentions légales</h2>
                    <div className="space-y-4 text-sm leading-relaxed">
                        <div>
                            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Éditeur</p>
                            <p><strong className="text-white">Tattoo Vision</strong></p>
                            <p>Contact : <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a></p>
                            <p className="text-amber-400 text-xs mt-1">⚠️ SIRET et adresse à compléter avant mise en ligne commerciale</p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Hébergement</p>
                            <p>Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Paiements</p>
                            <p>Stripe, Inc. — certifié PCI-DSS Level 1. Aucune donnée bancaire stockée sur nos serveurs.</p>
                        </div>
                    </div>
                </section>

                {/* CGU */}
                <section id="cgu">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Conditions Générales d'Utilisation</h2>
                    <div className="space-y-5 text-sm leading-relaxed">
                        {[
                            { n: '1', t: 'Objet', c: "Tattoo Vision est une application web de simulation de tatouage par IA. Les présentes CGU régissent l'accès et l'utilisation du service." },
                            { n: '2', t: 'Accès', c: "L'accès de base est gratuit après inscription. Les fonctionnalités avancées nécessitent un abonnement payant ou des Vision Points (VP)." },
                            { n: '3', t: 'Abonnements', c: 'Les abonnements sont hebdomadaires avec renouvellement automatique. Résiliation possible à tout moment depuis Profil → "Gérer / Résilier mon abonnement". Effet à la fin de la période en cours, sans frais.' },
                            { n: '4', t: 'Vision Points', c: "Les VP sont des crédits virtuels consommés lors de l'utilisation des fonctionnalités IA. Non remboursables sauf erreur technique avérée." },
                            { n: '5', t: 'Contenu utilisateur', c: "L'utilisateur est seul responsable des images téléversées. Tattoo Vision n'utilise pas vos images à des fins commerciales. Les images sont supprimées après traitement." },
                            { n: '6', t: 'Données personnelles (RGPD)', c: "Vous disposez d'un droit d'accès, rectification et suppression de vos données. Contact : kali.nzeutem@gmail.com." },
                            { n: '7', t: 'Limitation de responsabilité', c: "Les rendus IA sont des simulations indicatives. Tattoo Vision ne saurait être tenu responsable de décisions prises sur cette base." },
                            { n: '8', t: 'Droit applicable', c: "CGU soumises au droit français. Tout litige relève de la compétence des tribunaux de Paris." },
                        ].map(({ n, t, c }) => (
                            <div key={n}>
                                <h3 className="text-white font-bold mb-1">{n}. {t}</h3>
                                <p className="text-neutral-400">{c}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Droit de rétractation */}
                <section id="retractation">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Droit de rétractation (14 jours)</h2>
                    <div className="space-y-4 text-sm leading-relaxed">
                        <p>Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un <strong className="text-white">délai de 14 jours</strong> à compter de la souscription pour vous rétracter, sans justification ni pénalité.</p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">Exécution immédiate</p>
                            <p className="text-amber-300/80 text-sm">Si vous accédez immédiatement au service pendant le délai de rétractation, ce droit sera perdu proportionnellement à l'utilisation effectuée.</p>
                        </div>
                        <p>Pour exercer ce droit : <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a> — mentionner nom, email, date et "Exercice du droit de rétractation". Remboursement sous 14 jours via le même moyen de paiement.</p>
                    </div>
                </section>

                {/* Politique de remboursement */}
                <section id="remboursement">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Politique de remboursement</h2>
                    <div className="overflow-x-auto rounded-xl border border-white/5 mb-4">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="py-3 px-4 text-xs uppercase tracking-widest text-neutral-500">Situation</th>
                                    <th className="py-3 px-4 text-xs uppercase tracking-widest text-neutral-500">Remboursement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    ['Rétractation 14j, service non utilisé', '100% remboursé', 'text-emerald-400'],
                                    ['Rétractation 14j, service partiellement utilisé', 'Remboursement proportionnel', 'text-amber-400'],
                                    ['Résiliation en cours de période', 'Accès jusqu\'à échéance, pas de remboursement', 'text-neutral-400'],
                                    ['Erreur technique (service non rendu)', 'VP remboursés + remboursement sur demande', 'text-emerald-400'],
                                    ['VP one-time achetés', 'Non remboursables sauf erreur technique', 'text-neutral-400'],
                                ].map(([sit, rem, color]) => (
                                    <tr key={sit} className="hover:bg-white/[0.02]">
                                        <td className="py-3 px-4 text-neutral-300">{sit}</td>
                                        <td className={`py-3 px-4 font-bold ${color}`}>{rem}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-neutral-400">Contact : <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a></p>
                </section>

                {/* Résiliation */}
                <section id="resiliation">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Résiliation en ligne (loi 2022-1158)</h2>
                    <div className="space-y-4 text-sm leading-relaxed">
                        <ol className="space-y-3">
                            {['Accédez à votre Profil', 'Cliquez sur "Gérer / Résilier mon abonnement"', 'Confirmez sur le portail Stripe'].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#0091FF]/20 text-[#0091FF] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                    <span className="text-neutral-300">{step}</span>
                                </li>
                            ))}
                        </ol>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
                            La résiliation est effective à la fin de la période en cours. Aucun frais supplémentaire ne sera prélevé.
                        </div>
                    </div>
                </section>

                <p className="text-[10px] text-neutral-700 text-center">
                    Mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })} · Tattoo Vision
                </p>
            </div>
        </div>
    );
}
