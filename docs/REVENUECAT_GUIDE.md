# RevenueCat Integration Guide for Tattoo Vision

We have integrated RevenueCat into your Capacitor/React application. This setup uses the **hybrid** approach:
- **Web**: Defaults to Stripe (existing logic).
- **Mobile (iOS/Android)**: Uses RevenueCat for native In-App Purchases.

## 1. Implementation Details

### API Key Configuration
**File**: `src/hooks/usePayments.ts`
We have configured your provided test key:
```typescript
const REVENUECAT_API_KEY_IOS = 'test_YayyfBpYgTiYMQCEpDGOjXgqdVS';
```

### Entitlements
**File**: `src/hooks/usePayments.ts`
We check for the entitlement **'Tattoo Vision Pro'**.
```typescript
const ENTITLEMENT_ID = 'Tattoo Vision Pro';
const hasPro = customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;
```

### Paywalls & Customer Center
**File**: `src/components/Profile.tsx`
We utilize the native RevenueCat UI overlays so you don't have to build them manually.
- **Paywall**: Launches when a free user clicks "Upgrade".
- **Customer Center**: Launches when a pro user clicks "Manage Subscription".

```typescript
// Uses native SwiftUI (iOS) or Android views under the hood
await Purchases.presentPaywall();
await Purchases.presentCustomerCenter();
```

### Product Configuration (Monthly / Yearly / Lifetime)
**File**: `src/components/PlanPricingModal.tsx`
We updated the UI to support interval toggling.
**Required Action**: You must match these identifiers in RevenueCat Dashboard.

Suggested Product Identifiers in RevenueCat:
- `plus_monthly`, `plus_yearly`, `plus_lifetime`
- `pro_monthly`, `pro_yearly`, `pro_lifetime`
- `studio_monthly`, `studio_yearly`, `studio_lifetime`

## 2. Next Steps for You

1.  **RevenueCat Dashboard**:
    - Go to your Project > Products.
    - Create the products listed above.
    - Create an **Offering** (e.g., "Default") and add all these products to it.
    - Create an **Entitlement** named `Tattoo Vision Pro` and attach the products to it.
    - **Paywalls**: Go to the Paywalls tab and create a default paywall. This is what `presentPaywall()` will show!

2.  **Native Testing**:
    - Open the project: `npx cap open ios`
    - Run on a physical device or Simulator.
    - *Note: In Simulator, use "StoreKit Manage Transactions" to test buying products without a real credit card.*

## 3. Swift Package Manager (Reference)
Since this is a Capacitor project, dependnecies are handled via `npm` and `CocoaPods`.
- You generally **do not** need to manually add the Swift Package in Xcode unless you are writing custom native Swift code in `ios/App`.
- The npm package `@revenuecat/purchases-capacitor` automatically installs the necessary iOS native libraries (via Pods) when you run `npx cap sync`.
