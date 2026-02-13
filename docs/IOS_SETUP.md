# RevenueCat iOS Setup Guide (Capacitor)

Since you are building a Capacitor app, the primary integration is handled via the `@revenuecat/purchases-capacitor` plugin (already installed). However, for the native iOS project (when you open it on a Mac), here are the details you requested.

## 1. Installation (Swift Package Manager)
*Note: Capacitor typically manages dependencies via CocoaPods. If you strictly require SPM, follow this, otherwise Capacitor's default Podfile is easier.*

1.  Open `ios/App` in Xcode.
2.  Go to **File > Add Packages...**
3.  Enter URL: `https://github.com/RevenueCat/purchases-ios-spm.git`
4.  Select the version (compatible with v5+).
5.  Add to Target: `App`.

## 2. Configuration (API Key)
We have configured the API Key in `src/hooks/usePayments.ts` for the JS bridged side.
Key used: `test_YayyfBpYgTiYMQCEpDGOjXgqdVS`

If you need to initialize it natively in `App.tsx` (rare for Capacitor, but possible):
```swift
import RevenueCat

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    Purchases.configure(withAPIKey: "test_YayyfBpYgTiYMQCEpDGOjXgqdVS")
    return true
}
```

## 3. SwiftUI Subscription Views
The Capacitor plugin now supports native Paywalls directly from JavaScript!
We have implemented this in `Profile.tsx`:
```typescript
await Purchases.presentPaywall();
```
This launches the native SwiftUI Paywall view defined in your RevenueCat Dashboard, so you don't need to write SwiftUI code manually.

## 4. Entitlement Checking (Tattoo Vision Pro)
We check this in `usePayments.ts`:
```typescript
const hasPro = customerInfo?.entitlements.active['Tattoo Vision Pro'] !== undefined;
```
Ensure you have an Entitlement in RevenueCat dashboard named exactly **"Tattoo Vision Pro"**.

## 5. Product Configuration
In RevenueCat Dashboard > Products, create:
- `monthly` (Identifier should match Apple/Google ID)
- `yearly`
- `lifetime`

Create an **Offering** (default) and add these packages.

## 6. Testing
On iOS Simulator:
- Use *Features > StoreKit > Manage Transactions* to simulate purchases.
- Or create a Sandbox Tester account in App Store Connect.
