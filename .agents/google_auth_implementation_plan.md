# 🔐 Google Authentication — Implementation Plan

> **Reference:** Based on the Google Auth implementation in `RemedyAI-App/src/screens/auth/login.tsx`
>
> **Payload Format:** `{ idToken: string, email: string, isSignup: boolean }`
>
> **Target:** React Native CLI app with same login flow

---

## Overview

This plan covers adding Google Sign-In (SSO) to a React Native CLI app. The flow is:

```
User taps "Sign in with Google"
    → Native Google Sign-In UI opens
    → User selects Google account
    → App receives idToken + email
    → App sends { idToken, email, isSignup } to backend API
    → Backend validates & returns auth token
    → App stores token & navigates to main screen
```

---

## Phase 1: Google Cloud Console Setup

### Step 1.1 — Create a Google Cloud Project (or use existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Note the **Project ID**

### Step 1.2 — Enable Google Sign-In API

1. Go to **APIs & Services → Library**
2. Search for **"Google Identity Services"** or **"Google Sign-In"**
3. Click **Enable**

### Step 1.3 — Create OAuth 2.0 Credentials

You need **3 OAuth Client IDs**:

| Type               | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| **Web Client**     | Required for `idToken` generation (used as `webClientId` in the app) |
| **iOS Client**     | For iOS native sign-in                                               |
| **Android Client** | For Android native sign-in                                           |

#### Web Client:

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
2. Application type: **Web application**
3. Name: `YourApp Web Client`
4. No redirect URIs needed for mobile
5. Save the **Client ID** — this is your `webClientId`

#### iOS Client:

1. Create another OAuth Client ID
2. Application type: **iOS**
3. **Bundle ID**: Must match your app's bundle ID in Xcode (e.g., `com.yourcompany.yourapp`)
4. Save the **Client ID** and download the **plist file**

#### Android Client:

1. Create another OAuth Client ID
2. Application type: **Android**
3. **Package name**: Must match `applicationId` in `android/app/build.gradle`
4. **SHA-1 Certificate fingerprint**: Get it by running:
   ```bash
   cd android && ./gradlew signingReport
   ```
   Copy the `SHA1` value from the `debug` variant
5. Save

---

## Phase 2: Firebase Setup (Recommended)

> Firebase is optional but simplifies config file management.

### Step 2.1 — Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or link your existing Google Cloud project)
3. **Add an iOS app** with your bundle ID
4. **Add an Android app** with your package name + SHA-1

### Step 2.2 — Download Config Files

| Platform    | File                       | Destination                                    |
| ----------- | -------------------------- | ---------------------------------------------- |
| **iOS**     | `GoogleService-Info.plist` | `ios/` (project root) AND add to Xcode project |
| **Android** | `google-services.json`     | `android/app/`                                 |

---

## Phase 3: Install the Package

### Step 3.1 — Install `@react-native-google-signin/google-signin`

```bash
npm install @react-native-google-signin/google-signin
# OR
yarn add @react-native-google-signin/google-signin
```

### Step 3.2 — iOS: Install Pods

```bash
cd ios && pod install && cd ..
```

### Step 3.3 — Android: Add Google Services Plugin

In `android/build.gradle` (project-level), ensure:

```gradle
buildscript {
    dependencies {
        // ... other deps
        classpath('com.google.gms:google-services:4.4.0')
    }
}
```

In `android/app/build.gradle` (app-level), add at the bottom:

```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## Phase 4: iOS Native Configuration

### Step 4.1 — Add `GoogleService-Info.plist` to Xcode

1. Open `ios/YourApp.xcworkspace` in Xcode
2. Right-click the project name → **Add Files to "YourApp"**
3. Select `GoogleService-Info.plist`
4. Ensure **"Copy items if needed"** is checked
5. Ensure it's added to your app target

### Step 4.2 — Add URL Scheme to `Info.plist`

In `ios/YourApp/Info.plist`, add within the `<dict>` tag:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

> Replace `YOUR_REVERSED_CLIENT_ID` with the `REVERSED_CLIENT_ID` value from `GoogleService-Info.plist`
> (e.g., `com.googleusercontent.apps.XXXX-XXXXXXXX`)

---

## Phase 5: Backend API Endpoint

### Step 5.1 — Ensure Backend Endpoint Exists

Your backend needs an endpoint that:

- **Method:** `POST`
- **Path:** e.g., `/oauth/google/mobile` (or your custom path)
- **Accepts payload:**
  ```json
  {
    "idToken": "<Google JWT token>",
    "email": "<user's Google email>",
    "isSignup": false
  }
  ```
- **Returns on success:**
  ```json
  {
    "data": {
      "token": "<your_app_jwt_token>"
    }
  }
  ```

### Step 5.2 — Create the API Service Function

Create in your API services file (e.g., `src/services/authService.ts`):

```typescript
import api from './api'; // Your Axios instance

export const googleMobileLogin = (payload: {
  idToken: string;
  email: string;
  isSignup: boolean;
}) => {
  return api.post('/oauth/google/mobile', payload);
};
```

---

## Phase 6: Implement in Login Screen

### Step 6.1 — Add the Google Sign-In Handler Function

```typescript
const handleGoogleLogin = async () => {
  setLoading(true);
  try {
    let googleEmail = '';
    let idToken = '';

    // --- STEP A: Google Native Sign-In ---
    try {
      const {
        GoogleSignin,
        statusCodes,
      } = require('@react-native-google-signin/google-signin');

      // Check Play Services (Android)
      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      } catch (_) {}

      // Configure with your Web Client ID
      try {
        await GoogleSignin.configure({
          webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
        });
      } catch (err) {
        console.warn('GoogleSignin configure error:', err);
      }

      // Trigger Sign-In
      try {
        const account = await GoogleSignin.signIn();

        if (account?.idToken) {
          idToken = account.idToken;
          googleEmail =
            account?.user?.email || account?.data?.user?.email || '';
        } else if (account?.data?.idToken) {
          idToken = account.data.idToken;
          googleEmail =
            account?.user?.email || account?.data?.user?.email || '';
        }
      } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          setLoading(false);
          return; // User cancelled — do nothing
        } else if (error.code === statusCodes.IN_PROGRESS) {
          return; // Already in progress
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          // Show error to user
          Alert.alert('Error', 'Play services not available or outdated');
          setLoading(false);
          return;
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.warn('Google Sign In setup error:', err);
    }

    // --- STEP B: Validate we got a token ---
    if (!idToken) {
      setLoading(false);
      Alert.alert('Error', 'Error Signing In with Google');
      return;
    }

    // --- STEP C: Send to Backend ---
    const loginPayload = {
      idToken,
      email: googleEmail,
      isSignup: false,
    };

    const resp = await googleMobileLogin(loginPayload);
    const payload = resp?.data?.data || resp?.data;
    const token = payload?.token || payload?.accessToken;

    // --- STEP D: Handle Success ---
    if (token) {
      // Store token in your auth state (Zustand/Redux/Context)
      // Store token in AsyncStorage for persistence
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem(
        'auth_session_expires_at',
        String(Date.now() + 24 * 60 * 60 * 1000),
      );

      // Navigate to main app
      navigation.replace('MainTabs'); // Your main screen name
      return;
    }

    Alert.alert('Error', 'Unexpected response from server');
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to initiate Google login';
    Alert.alert('Error', message);
  } finally {
    setLoading(false);
  }
};
```

### Step 6.2 — Add the Google Sign-In Button (UI)

```tsx
{
  /* Divider */
}
<View style={styles.orDivider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>OR</Text>
  <View style={styles.dividerLine} />
</View>;

{
  /* Google Sign-In Button */
}
<TouchableOpacity
  style={styles.googleButton}
  onPress={handleGoogleLogin}
  disabled={loading}
  activeOpacity={0.7}>
  <Image
    source={require('../assets/images/google-icon.png')}
    style={styles.googleIcon}
  />
  <Text style={styles.googleButtonText}>Sign in with Google</Text>
</TouchableOpacity>;
```

### Step 6.3 — Add Styles

```typescript
googleButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#F0F0F0',
  paddingVertical: 14,
  paddingHorizontal: 20,
  marginTop: 16,
},
googleIcon: {
  width: 20,
  height: 20,
  marginRight: 10,
},
googleButtonText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#86868b',
},
orDivider: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 20,
},
dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: '#E5E5E5',
},
dividerText: {
  marginHorizontal: 16,
  fontSize: 13,
  color: '#86868b',
},
```

### Step 6.4 — Add the Google Icon Asset

Download a Google "G" logo PNG and place it at:

```
src/assets/images/google-icon.png
```

---

## Phase 7: Testing Checklist

### iOS Testing

- [ ] Clean build: `cd ios && pod install && cd .. && npx react-native run-ios`
- [ ] Tap "Sign in with Google" — native Google UI appears
- [ ] Select a Google account — returns to app
- [ ] `idToken` and `email` are logged correctly
- [ ] Backend receives payload and returns token
- [ ] App navigates to main screen on success
- [ ] Cancelling Google Sign-In does NOT crash the app

### Android Testing

- [ ] Ensure `google-services.json` is in `android/app/`
- [ ] Clean build: `cd android && ./gradlew clean && cd .. && npx react-native run-android`
- [ ] Same functional tests as iOS above
- [ ] Play Services dialog shows if services are outdated

### Error Scenarios

- [ ] No internet → graceful error message
- [ ] Backend returns error → error toast/alert shown
- [ ] User not whitelisted → appropriate "Access Denied" message
- [ ] Double-tap prevention → button disabled while `loading` is true

---

## Phase 8: Checklist Summary

| #   | Task                                                    | Status |
| --- | ------------------------------------------------------- | ------ |
| 1   | Google Cloud Console: Create project & enable APIs      | ⬜     |
| 2   | Create Web, iOS, and Android OAuth Client IDs           | ⬜     |
| 3   | Firebase: Add iOS & Android apps, download config files | ⬜     |
| 4   | Place `GoogleService-Info.plist` in `ios/` + Xcode      | ⬜     |
| 5   | Place `google-services.json` in `android/app/`          | ⬜     |
| 6   | Install `@react-native-google-signin/google-signin`     | ⬜     |
| 7   | Run `pod install` for iOS                               | ⬜     |
| 8   | Add Google Services Gradle plugin (Android)             | ⬜     |
| 9   | Add URL Scheme (REVERSED_CLIENT_ID) in `Info.plist`     | ⬜     |
| 10  | Create `googleMobileLogin` API service function         | ⬜     |
| 11  | Implement `handleGoogleLogin` in login screen           | ⬜     |
| 12  | Add Google Sign-In button UI + styles                   | ⬜     |
| 13  | Add Google icon asset                                   | ⬜     |
| 14  | Test on iOS                                             | ⬜     |
| 15  | Test on Android                                         | ⬜     |

---

## Key Values to Replace

| Placeholder               | Where to Get It                                                   |
| ------------------------- | ----------------------------------------------------------------- |
| `YOUR_WEB_CLIENT_ID_HERE` | Google Cloud Console → OAuth 2.0 Client IDs → Web Client          |
| `YOUR_REVERSED_CLIENT_ID` | From downloaded `GoogleService-Info.plist` → `REVERSED_CLIENT_ID` |
| `YOUR_BUNDLE_ID`          | Xcode → Project → General → Bundle Identifier                     |
| `YOUR_ANDROID_PACKAGE`    | `android/app/build.gradle` → `applicationId`                      |
| `/oauth/google/mobile`    | Your backend's actual Google SSO endpoint                         |
