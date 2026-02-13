import { useState } from 'react';
import { X, Sparkles, Loader2, Check, Zap, Shield, Crown, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { useAuth } from '../contexts/AuthContext';

interface PlanPricingModalProps {
    onClose: () => void;
}

const PLANS = [
    {
        id: 'plus',
        name: 'Plus',
        price: '9.99€',
        period: '/month',
        points: '6,000',
        icon: Zap,
        color: 'text-blue-400',
        borderColor: 'border-blue-900/30',
        bgColor: 'bg-blue-600/5',
        features: [
            '6,000 Vision Points / month',
            'Import own tattoos',
            'AI Tattoo Creation',
            '5 Realistic Renders / month',
            'No watermark downloads',
            'Savel history',
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '19.99€',
        period: '/month',
        points: '15,000',
        icon: Crown,
        popular: true,
        color: 'text-amber-400',
        borderColor: 'border-amber-900/40',
        bgColor: 'bg-amber-600/5',
        features: [
            '15,000 Vision Points / month',
            'Unlimited Realistic Renders*',
            'Higher point allowance',
            'Priority generation',
            'Unlimited history',
            'Before/After comparison',
        ]
    },
    {
        id: 'studio',
        name: 'Studio',
        price: '39.99€',
        period: '/month',
        points: '40,000',
        icon: Building2,
        color: 'text-purple-400',
        borderColor: 'border-purple-900/30',
        bgColor: 'bg-purple-600/5',
        features: [
            '40,000 Vision Points / month',
            'HD Exports & Studio tools',
            'Client project management',
            'Commercial usage rights',
            'Priority support',
        ]
    }
];

export default function PlanPricingModal({ onClose }: PlanPricingModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        try {
            setLoading(planId);
            setError(null);

            const { data: sess } = await supabase.auth.getSession();
            console.log("session exists?", !!sess.session, "user?", sess.session?.user?.id);

            const { data, error: invokeError } = await invokeWithAuth('create-checkout-session', {
                body: { plan: planId, returnUrl: window.location.origin },
            });

            if (invokeError) {
                console.log("invoke error", invokeError);
                throw new Error(invokeError.message || 'Failed to connect to checkout service');
            }

            if (data?.error) throw new Error(data.error);

            if (data?.url) {
                window.location.href = data.url;
            } else {
                // If no checkout yet, just close or show message
                console.log(`Subscribing to ${planId}... (Stripe integration pending)`);
                setError("Payment gateway integration in progress. Contact support to upgrade manually.");
            }

        } catch (err) {
            console.error('Subscription error:', err);
            setError(err instanceof Error ? err.message : 'Failed to initiate subscription');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-8 flex items-center justify-between border-b border-neutral-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center border border-amber-600/20">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-100">Elevate Your Vision</h2>
                            <p className="text-neutral-500 text-sm">Choose the plan that fits your creative journey</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-neutral-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10">
                    {error && (
                        <div className="mb-8 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-300 text-sm flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.id}
                                className={`group relative flex flex-col p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] ${plan.popular
                                    ? `bg-neutral-900/50 ${plan.borderColor} ring-1 ring-amber-500/10`
                                    : `bg-neutral-950/50 border-neutral-800 hover:border-neutral-700`
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xl shadow-amber-900/20">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className={`w-12 h-12 ${plan.bgColor} rounded-2xl flex items-center justify-center border ${plan.borderColor} mb-6 transition-transform group-hover:rotate-3`}>
                                        <plan.icon className={`w-6 h-6 ${plan.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-100 tracking-tight">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-4">
                                        <span className="text-4xl font-bold text-white tracking-tighter">{plan.price}</span>
                                        <span className="text-neutral-500 text-sm font-medium">{plan.period}</span>
                                    </div>
                                    <p className={`text-xs font-bold uppercase tracking-widest mt-4 ${plan.color}`}>
                                        {plan.points} Vision Points
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-neutral-400">
                                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.popular ? 'bg-amber-500/20' : 'bg-neutral-800'}`}>
                                                <Check className={`w-2.5 h-2.5 ${plan.popular ? 'text-amber-500' : 'text-neutral-500'}`} />
                                            </div>
                                            <span className="group-hover:text-neutral-300 transition-colors">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loading !== null || profile?.plan === plan.id}
                                    className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-all ${profile?.plan === plan.id
                                        ? 'bg-neutral-800 text-neutral-500 cursor-default'
                                        : plan.popular
                                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-950/20 hover:shadow-amber-500/20'
                                            : 'bg-white text-neutral-900 hover:bg-neutral-100 shadow-xl'
                                        } disabled:opacity-50`}
                                >
                                    {loading === plan.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : profile?.plan === plan.id ? (
                                        'Current Plan'
                                    ) : (
                                        `Select ${plan.name}`
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 text-neutral-500">
                        <div className="flex items-center gap-2 text-xs">
                            <Shield className="w-4 h-4 text-emerald-500/50" />
                            <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <Shield className="w-4 h-4 text-emerald-500/50" />
                            <span>Secure Checkout</span>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-6 bg-neutral-900/30 border-t border-neutral-800/50 text-center">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium">
                        *Realistic renders are subject to fair use policy. Standard point system applies for cost control.
                    </p>
                </div>
            </div>
        </div>
    );
}
