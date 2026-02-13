import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';

// API Key provided by user
const REVENUECAT_API_KEY_IOS = 'test_YayyfBpYgTiYMQCEpDGOjXgqdVS';
const REVENUECAT_API_KEY_ANDROID = 'goog_placeholder_key'; // Update this when you have the Android key

// Entitlement IDs matching RevenueCat configuration
const ENTITLEMENT_IDS = {
    PLUS: 'plus',
    PRO: 'pro',
    STUDIO: 'studio',
} as const;

export function usePayments() {
    const isNative = Capacitor.isNativePlatform();
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Check for active entitlements
    const hasPlus = customerInfo?.entitlements.active[ENTITLEMENT_IDS.PLUS] !== undefined;
    const hasPro = customerInfo?.entitlements.active[ENTITLEMENT_IDS.PRO] !== undefined;
    const hasStudio = customerInfo?.entitlements.active[ENTITLEMENT_IDS.STUDIO] !== undefined;

    // Get the highest active entitlement
    const activeEntitlement = hasStudio ? 'studio' : hasPro ? 'pro' : hasPlus ? 'plus' : null;

    useEffect(() => {
        if (!isNative) return;

        const init = async () => {
            try {
                const apiKey = Capacitor.getPlatform() === 'ios'
                    ? REVENUECAT_API_KEY_IOS
                    : REVENUECAT_API_KEY_ANDROID;

                await Purchases.configure({ apiKey });
                setInitialized(true);

                // Load info & offerings
                await fetchCustomerInfo();
                await fetchOfferings();
            } catch (e) {
                console.error("RevenueCat Init Error:", e);
            }
        };

        init();
    }, []);

    const fetchCustomerInfo = async () => {
        try {
            const { customerInfo } = await Purchases.getCustomerInfo();
            setCustomerInfo(customerInfo);
        } catch (e) {
            console.error("Error fetching customer info", e);
        }
    };

    const fetchOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length !== 0) {
                setPackages(offerings.current.availablePackages);
            }
        } catch (e) {
            console.error("Error fetching offerings", e);
        }
    };

    const purchasePackage = async (rcPackage: PurchasesPackage) => {
        try {
            setLoading(true);
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
            return { success: true, customerInfo };
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error("Purchase Error:", e);
                throw e;
            }
            return { success: false, userCancelled: true };
        } finally {
            setLoading(false);
        }
    };

    const restorePurchases = async () => {
        try {
            setLoading(true);
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (e) {
            console.error("Restore Error:", e);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const presentPaywall = async () => {
        if (!isNative) return;
        try {
            await (Purchases as any).presentPaywall();
        } catch (e) {
            console.error("Paywall Error:", e);
        }
    };

    const presentCustomerCenter = async () => {
        if (!isNative) return;
        try {
            await (Purchases as any).presentCustomerCenter();
        } catch (e) {
            console.log("Customer Center error or not implemented:", e);
        }
    };

    return {
        isNative,
        packages,
        customerInfo,
        // New entitlement checks
        hasPlus,
        hasPro,
        hasStudio,
        activeEntitlement,
        // Actions
        purchasePackage,
        restorePurchases,
        presentPaywall,
        presentCustomerCenter,
        // State
        loading,
        initialized
    };
}
