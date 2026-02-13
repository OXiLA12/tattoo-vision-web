# RevenueCat Implementation Details

Here is the complete reference of the code we implemented for your RevenueCat integration.

## 1. Configuration (`usePayments.ts`)
We initialize RevenueCat with your API keys and fetch the user's status (`CustomerInfo`) and available packages (`Offerings`).

```typescript
// src/hooks/usePayments.ts
const REVENUECAT_API_KEY_IOS = 'test_YayyfBpYgTiYMQCEpDGOjXgqdVS';

export function usePayments() {
    // ...
    useEffect(() => {
        if (!isNative) return;
        const init = async () => {
            await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
            await fetchCustomerInfo();
            await fetchOfferings();
        };
        init();
    }, []);
    // ...
}
```

## 2. Entitlement Checking
We check if the user has the active entitlement "Tattoo Vision Pro" to determine their status.

```typescript
// src/hooks/usePayments.ts
const ENTITLEMENT_ID = 'Tattoo Vision Pro';
const hasPro = customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;
```

## 3. Subscription Functionality (`PlanPricingModal.tsx`)
We handle the purchase flow. If native, we use RevenueCat. If web, we use Stripe.

```typescript
// src/components/PlanPricingModal.tsx
const handleNativeSubscribe = async (rcPackage: PurchasesPackage) => {
    try {
        const { success } = await purchasePackage(rcPackage);
        if (success) {
            alert("Subscription successful!");
            onClose();
        }
    } catch (err) {
        console.error("Purchase failed", err);
    }
};
```

## 4. Product Configuration (Monthly/Yearly)
We support toggling between billing intervals. Your RevenueCat product identifiers should follow this naming convention:
- `plus_monthly`, `plus_yearly`, `plus_lifetime`
- `pro_monthly`, `pro_yearly`, `pro_lifetime`
- `studio_monthly`, `studio_yearly`, `studio_lifetime`

## 5. Paywalls & Customer Center (`Profile.tsx`)
We use the modern RevenueCat UI features to save development time.

```typescript
// src/components/Profile.tsx
<button
    onClick={() => {
        if (isNative) {
            if (profile?.plan === 'free') {
                // Show Paywall to upgrade
                presentPaywall();
            } else {
                // Show Customer Center to manage subscription
                presentCustomerCenter();
            }
        }
    }}
>
    Manage Subscription
</button>
```

## 6. Verification
To verify this on your device:
1.  Run `npx cap open ios` (or android).
2.  In Xcode/Android Studio, run the app.
3.  Ensure you have configured the products in RevenueCat Dashboard with the exact identifiers mentioned above.
