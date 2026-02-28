
import { useState, useEffect, useRef } from 'react';
import { Gift, Copy, Check, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ReferralModalProps {
    onClose: () => void;
}

export default function ReferralModal({ onClose }: ReferralModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [referralCode, setReferralCode] = useState<string | null>(profile?.referral_code || null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const prevEarnedRef = useRef(0);

    // Stats
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        earned: 0
    });

    useEffect(() => {
        if (!user) return;
        fetchStats();

        if (!profile?.referral_code && !referralCode) {
            generateCode();
        }

        // Subscribe to real-time updates for credit_transactions
        const subscription = supabase
            .channel('referral-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'credit_transactions',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                if ((payload.new as any).type === 'referral_reward' || (payload.new as any).type === 'referral_bonus') {
                    fetchStats(); // Update stats immediately
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const triggerConfetti = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const fetchStats = async () => {
        if (!user) return;

        try {
            const { data: referrals } = await supabase
                .from('referrals')
                .select('status')
                .eq('referrer_id', user.id);

            if (referrals) {
                const pending = (referrals as any[]).filter(r => r.status === 'pending').length;
                const completed = (referrals as any[]).filter(r => r.status === 'completed').length;

                const { data: txs } = await supabase
                    .from('credit_transactions')
                    .select('amount')
                    .eq('user_id', user.id)
                    .in('type', ['referral_reward', 'referral_bonus']); // Include both types

                const earned = (txs as any[])?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

                // Check if earned amount increased to trigger animation
                if (earned > prevEarnedRef.current && prevEarnedRef.current !== 0) {
                    setShowReward(true);
                    triggerConfetti();
                }
                prevEarnedRef.current = earned;

                setStats({ pending, completed, earned });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generateCode = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('generate_referral_code');
            if (error) throw error;
            setReferralCode(data);
            await refreshProfile();
        } catch (err) {
            console.error("Failed to generate code:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!referralCode) return;
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            {showReward && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowReward(false)}>
                    <div className="text-center animate-scale-in">
                        <div className="w-24 h-24 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce">
                            <Gift className="w-12 h-12 text-black" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2">Reward Unlocked!</h2>
                        <p className="text-xl text-[#10b981] font-medium">You just earned free Vision Points!</p>
                    </div>
                </div>
            )}

            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-md max-h-[85vh] mt-safe mt-12 md:mt-0 overflow-y-auto shadow-2xl animate-scale-in relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-white transition-colors border border-neutral-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="w-16 h-16 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#10b981]/20">
                        <Gift className="w-8 h-8 text-[#10b981]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Programme de Parrainage' : 'Referral Program'}</h2>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                        {profile?.language === 'fr' || navigator.language.startsWith('fr') 
                            ? <span>Gagnez <span className="text-white font-bold">200 VP</span> bonus uniques en invitant un ami ou en activant un code d'invitation !</span> 
                            : <span>Earn a one-time <span className="text-white font-bold">200 VP</span> bonus for inviting a friend or activating an invite code!</span>}
                    </p>
                </div>

                {/* Code & Actions */}
                <div className="p-6 pt-0 space-y-6">
                    {/* Share Section */}
                    <div className="space-y-3">
                        <div className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
                            {profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Partage ton code :' : 'Share your code:'}
                        </div>
                        <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 pl-4 flex items-center justify-between group hover:border-[#10b981]/50 transition-colors cursor-pointer" onClick={handleCopy}>
                            <div className="font-mono text-xl text-[#10b981] font-bold tracking-wider">
                                {loading && !referralCode ? '...' : (referralCode || '---')}
                            </div>
                            <button
                                className={`p-2.5 rounded-lg transition-all ${copied ? 'bg-[#10b981] text-black' : 'bg-[#27272a] text-white group-hover:bg-[#3f3f46]'}`}
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#27272a]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-[#18181b] px-3 text-neutral-500 font-medium uppercase tracking-widest">
                                {profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Ou' : 'Or'}
                            </span>
                        </div>
                    </div>

                    {/* Redeem Section */}
                    <div className="space-y-3">
                        <div className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
                            {profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Tu as un code d\'invitation ?' : 'Have an invite code?'}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Entrer le code' : 'Enter code'}
                                className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#10b981] font-mono uppercase transition-colors"
                                id="redeemInput"
                            />
                            <button
                                onClick={async () => {
                                    const input = document.getElementById('redeemInput') as HTMLInputElement;
                                    if (!input.value) return;
                                    setLoading(true);
                                    try {
                                        const { data, error } = await supabase.rpc('redeem_invite_code', { code: input.value.toUpperCase() });
                                        if (error) throw error;
                                        if (data.success) {
                                            triggerConfetti();
                                            setShowReward(true);
                                            fetchStats();
                                            await refreshProfile();
                                            input.value = '';
                                        } else {
                                            alert(profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Code invalide ou déjà utilisé.' : data.message);
                                        }
                                    } catch (e: any) {
                                        console.error(e);
                                        alert(profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Erreur: Vous avez probablement déjà reçu ce bonus.' : e.message || "Failed to redeem");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="px-6 py-3 bg-[#10b981] text-black font-bold rounded-xl hover:bg-[#059669] transition-colors"
                                disabled={loading}
                            >
                                {loading ? '...' : (profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Valider' : 'Redeem')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#10b981]/5 border border-[#10b981]/10 rounded-xl p-4 mt-6">
                        <h4 className="flex items-center gap-2 text-[#10b981] text-xs font-bold mb-1.5 uppercase tracking-wider">
                            <Shield className="w-3.5 h-3.5" /> {profile?.language === 'fr' || navigator.language.startsWith('fr') ? 'Condition Unique' : 'One-Time Policy'}
                        </h4>
                        <p className="text-[11px] text-[#10b981]/70 leading-relaxed">
                            {profile?.language === 'fr' || navigator.language.startsWith('fr') 
                                ? "Le bonus de 200 VP n'est déblocable qu'une seule et unique fois par utilisateur, soit en parrainant quelqu'un, soit en utilisant un code."
                                : "The 200 VP bonus can only be unlocked once per user, either by referring someone or using a code."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
