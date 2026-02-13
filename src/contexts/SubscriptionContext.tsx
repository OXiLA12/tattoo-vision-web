import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePayments } from '../hooks/usePayments';

type EntitlementType = 'plus' | 'pro' | 'studio' | null;

interface SubscriptionContextType {
    // État de l'abonnement
    activeEntitlement: EntitlementType;
    isLoading: boolean;

    // Informations du plan
    plan: string;
    hasActiveSubscription: boolean;

    // Vision Points (pour utiliser les fonctionnalités)
    visionPoints: number;

    // Actions
    showPaywall: () => void;
    hidePaywall: () => void;
    restorePurchases: () => Promise<void>;

    // Vérification d'accès basée sur les Vision Points
    hasEnoughPoints: (cost: number) => boolean;

    // Vérification d'accès basée sur le plan (pour import de tatouages personnalisés)
    // Free = false (bibliothèque uniquement), Plus/Pro/Studio = true (import autorisé)
    hasPlanAccess: () => boolean;

    // UI
    isPaywallVisible: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { profile, credits } = useAuth();
    const { customerInfo, isNative, initialized, restorePurchases: rcRestore } = usePayments();

    const [activeEntitlement, setActiveEntitlement] = useState<EntitlementType>(null);
    const [isPaywallVisible, setIsPaywallVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Déterminer l'entitlement actif
    useEffect(() => {
        if (!initialized && isNative) {
            setIsLoading(true);
            return;
        }

        if (isNative && customerInfo) {
            // Sur mobile : utiliser RevenueCat
            const entitlements = customerInfo.entitlements.active;

            // Vérifier dans l'ordre de priorité (studio > pro > plus)
            if (entitlements['studio']) {
                setActiveEntitlement('studio');
            } else if (entitlements['pro']) {
                setActiveEntitlement('pro');
            } else if (entitlements['plus']) {
                setActiveEntitlement('plus');
            } else {
                setActiveEntitlement(null);
            }

            setIsLoading(false);
        } else if (!isNative && profile) {
            // Sur web : utiliser le profil Supabase
            const plan = profile.plan || 'free';

            if (plan === 'studio') {
                setActiveEntitlement('studio');
            } else if (plan === 'pro') {
                setActiveEntitlement('pro');
            } else if (plan === 'plus') {
                setActiveEntitlement('plus');
            } else {
                setActiveEntitlement(null);
            }

            setIsLoading(false);
        } else if (!isNative) {
            setIsLoading(false);
        }
    }, [customerInfo, profile, isNative, initialized]);

    // Vérifier si l'utilisateur a assez de Vision Points
    const hasEnoughPoints = (cost: number): boolean => {
        return credits >= cost;
    };

    // Vérifier si l'utilisateur a un plan payant (pour import de tatouages)
    // Free = false, Plus/Pro/Studio = true
    const hasPlanAccess = (): boolean => {
        const currentPlan = profile?.plan || 'free';
        return currentPlan !== 'free';
    };

    const showPaywall = () => {
        setIsPaywallVisible(true);
    };

    const hidePaywall = () => {
        setIsPaywallVisible(false);
    };

    const restorePurchases = async () => {
        if (isNative) {
            await rcRestore();
        } else {
            throw new Error('Restore purchases is only available on mobile');
        }
    };

    const value: SubscriptionContextType = {
        activeEntitlement,
        isLoading,
        plan: profile?.plan || 'free',
        hasActiveSubscription: activeEntitlement !== null,
        visionPoints: credits,
        showPaywall,
        hidePaywall,
        restorePurchases,
        hasEnoughPoints,
        hasPlanAccess,
        isPaywallVisible,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
