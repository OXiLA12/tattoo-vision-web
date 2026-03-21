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
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Mentions légales</h2>
                    <div className="space-y-4 text-base leading-relaxed">
                        <div>
                            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Éditeur</p>
                            <p><strong className="text-white">Tattoo Vision</strong></p>
                            <p>Contact : <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a></p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Hébergement</p>
                            <p>Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Paiements</p>
                            <p>Les abonnements iOS sont gérés par Apple via In-App Purchase. Les informations de paiement sont traitées par Apple et ne sont pas stockées par Tattoo Vision.</p>
                        </div>
                    </div>
                </section>

                {/* CGU */}
                <section id="cgu">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Conditions Générales d'Utilisation</h2>
                    <div className="space-y-5 text-base leading-relaxed">
                        {[
                            { n: '1', t: 'Objet', c: "Tattoo Vision est une application mobile de simulation de tatouage par IA. Les présentes CGU régissent l'accès et l'utilisation du service." },
                            { n: '2', t: 'Accès', c: "L'accès de base est gratuit après inscription. Les fonctionnalités avancées nécessitent un abonnement Apple In-App Purchase ou des Vision Points (VP) lorsque l'offre le prévoit." },
                            { n: '3', t: 'Abonnements', c: 'Les abonnements sont hebdomadaires avec renouvellement automatique. Résiliation possible à tout moment depuis le profil ou depuis Réglages > identifiant Apple > Abonnements. La résiliation prend effet à la fin de la période en cours.' },
                            { n: '4', t: 'Vision Points', c: "Les VP sont des crédits virtuels consommés lors de l'utilisation des fonctionnalités IA. Lorsqu'ils sont achetés sur iOS, leur facturation et toute demande de remboursement relèvent des systèmes et politiques d'Apple." },
                            { n: '5', t: 'Contenu utilisateur', c: "L'utilisateur est seul responsable des images téléversées. Les images et prompts peuvent être transmis à des sous-traitants techniques pour générer les rendus IA après consentement explicite dans l'app. Elles ne sont pas utilisées à des fins publicitaires sans consentement." },
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
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Informations sur la rétractation et les achats iOS</h2>
                    <div className="space-y-4 text-base leading-relaxed">
                        <p>Les achats intégrés réalisés sur iPhone ou iPad sont conclus et facturés par <strong className="text-white">Apple</strong> via l'In-App Purchase.</p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">Important</p>
                            <p className="text-amber-300/80 text-sm">Pour les abonnements et achats iOS, les demandes d'annulation, de remboursement ou d'examen d'éligibilité relèvent des mécanismes et politiques d'Apple. Tattoo Vision ne débite pas directement votre moyen de paiement Apple et ne peut pas promettre un remboursement en dehors des outils Apple prévus à cet effet.</p>
                        </div>
                        <p>Si vous souhaitez demander un remboursement ou signaler un achat contesté sur iOS, utilisez d'abord les canaux Apple prévus à cet effet, notamment votre historique d'achats Apple ou l'assistance Apple.</p>
                        <p>Pour toute question sur l'accès au service, les données de compte, ou un dysfonctionnement de l'application, vous pouvez toujours écrire à <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a>.</p>
                    </div>
                </section>

                {/* Politique de remboursement */}
                <section id="remboursement">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Politique de remboursement</h2>
                    <div className="overflow-x-auto rounded-xl border border-white/5 mb-4">
                        <table className="w-full text-left text-base">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="py-3 px-4 text-xs uppercase tracking-widest text-neutral-500">Situation</th>
                                    <th className="py-3 px-4 text-xs uppercase tracking-widest text-neutral-500">Traitement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    ['Abonnement iOS actif puis annulé', "L'accès reste disponible jusqu'à l'échéance. Le remboursement éventuel relève d'Apple.", 'text-neutral-300'],
                                    ['Demande de remboursement d\'un achat iOS', 'À demander via Apple selon ses politiques et outils de support.', 'text-amber-400'],
                                    ['Achat iOS contesté ou facturé par erreur', 'Vérification et demande à initier côté Apple en priorité.', 'text-amber-400'],
                                    ['Bug ou service dysfonctionnel', 'Contact support Tattoo Vision pour assistance technique ; tout remboursement iOS reste soumis à Apple.', 'text-emerald-400'],
                                    ['Question sur le compte ou suppression des données', 'Traitée par Tattoo Vision via le support.', 'text-neutral-300'],
                                ].map(([sit, rem, color]) => (
                                    <tr key={sit} className="hover:bg-white/[0.02]">
                                        <td className="py-3 px-4 text-neutral-300">{sit}</td>
                                        <td className={`py-3 px-4 font-bold ${color}`}>{rem}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-base text-neutral-400">Support applicatif : <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a></p>
                </section>

                {/* Résiliation */}
                <section id="resiliation">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Résiliation en ligne (loi 2022-1158)</h2>
                    <div className="space-y-4 text-base leading-relaxed">
                        <ol className="space-y-3">
                            {["Accédez à votre Profil", "Touchez \"Gérer mon abonnement\"", "Confirmez la gestion ou l'annulation via Apple"].map((step, i) => (
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

                <section id="eula">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 pb-3 border-b border-white/10">Terms of Use &amp; End-User License Agreement (EULA)</h2>
                    <div className="space-y-5 text-base leading-relaxed">
                        <div>
                            <h3 className="text-white font-bold mb-1">1. Application</h3>
                            <p className="text-neutral-400">Tattoo Vision (&quot;App&quot;) is an AI-powered tattoo visualization application. By downloading or using the App, you agree to these Terms of Use. If you disagree, do not use the App.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">2. Auto-Renewable Subscriptions</h3>
                            <p className="text-neutral-400">Tattoo Vision offers auto-renewable subscriptions that unlock premium features. Subscription details:</p>
                            <ul className="list-disc list-inside text-neutral-400 mt-2 space-y-1">
                                <li>Subscriptions are charged to your Apple ID account at confirmation of purchase.</li>
                                <li>Your subscription automatically renews unless cancelled at least 24 hours before the end of the current period.</li>
                                <li>Your account will be charged for renewal within 24 hours prior to the end of the current period.</li>
                                <li>You can manage and cancel subscriptions in your Account Settings on the App Store, or via Settings &gt; [your Apple ID] &gt; Subscriptions on your device.</li>
                                <li>Any unused portion of a free trial period will be forfeited when you purchase a subscription.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">3. In-App Purchases</h3>
                            <p className="text-neutral-400">Vision Points (VP) are virtual credits consumed when using AI features. All in-app purchases are processed by Apple. Tattoo Vision does not have access to your payment information. Refund requests must be submitted through Apple.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">4. License</h3>
                            <p className="text-neutral-400">Tattoo Vision grants you a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes on Apple-branded devices you own or control, subject to the Usage Rules of the Apple Media Services Terms and Conditions.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">5. User Content</h3>
                            <p className="text-neutral-400">You retain ownership of photos you upload. By using AI features, you consent to sending selected images and prompts to our technical processors (including Google Gemini) to generate results. Images are never used for advertising without your explicit consent.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">6. Privacy</h3>
                            <p className="text-neutral-400">We collect only your name and email address for authentication (supporting Apple Private Relay email). We do not sell your personal data. See our Privacy Policy for details.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">7. Disclaimer</h3>
                            <p className="text-neutral-400">AI renders are simulations only. Tattoo Vision is not responsible for any decisions made based on these results. The App is provided &quot;as is&quot; without warranties of any kind.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">8. Apple Standard EULA</h3>
                            <p className="text-neutral-400">This EULA incorporates the Apple Licensed Application End User License Agreement available at: <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="text-[#0091FF] underline">apple.com/legal/internet-services/itunes/dev/stdeula</a>. In the event of a conflict, these Terms prevail.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">9. Contact</h3>
                            <p className="text-neutral-400">For support: <a href="mailto:kali.nzeutem@gmail.com" className="text-[#0091FF] underline">kali.nzeutem@gmail.com</a></p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
                            <strong>Apple Standard EULA applies.</strong> If no custom EULA is specified in App Store Connect, Apple&apos;s Standard End User License Agreement (EULA) governs. You may also view it at the link above.
                        </div>
                    </div>
                </section>

                <p className="text-[10px] text-neutral-700 text-center">
                    Last updated: March 2026 &middot; Tattoo Vision
                </p>
            </div>
        </div>
    );
}
