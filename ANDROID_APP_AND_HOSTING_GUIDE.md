# 🚀 AVARA — complete Android Studio App Build & Hosting Guide
> **आवारा म्यूज़िक ऐप (Android APK Building, Command Prompt Instructions & Web Hosting Guide)**

---

## 🛠️ भाग 1: टर्मिनल और कमान्ड प्रॉम्प्ट (Command Prompt) से APK बनाने की कमान्ड्स

यदि आप **Android Studio** के माध्यम से या सीधे **Terminal / Command Prompt** से APK बनाना चाहते हैं, तो निम्नलिखित कमान्ड्स का प्रयोग करें:

### 1. प्रोजेक्ट फोल्डर में जाएँ (Navigate to Android Folder):
**Windows (Command Prompt / PowerShell):**
```cmd
cd C:\path\to\Avara\android
```
**Mac / Linux (Terminal):**
```bash
cd /Users/vikashchoudhary/Desktop/Avara/android
```

---

### 2. APK बिल्ड करने की कमान्ड्स (Build APK Commands):

#### A. टेस्ट/टेस्टिंग APK बनाने के लिए (Build Debug APK):
**Windows Command Prompt:**
```cmd
gradlew assembleDebug
```
**Mac / Linux Terminal:**
```bash
./gradlew assembleDebug
```
> **APK फ़ाइल कहाँ मिलेगी:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

#### B. प्रोडक्शन/फाइनल ऐप APK बनाने के लिए (Build Release APK):
**Windows Command Prompt:**
```cmd
gradlew assembleRelease
```
**Mac / Linux Terminal:**
```bash
./gradlew assembleRelease
```
> **APK फ़ाइल कहाँ मिलेगी:** `android/app/build/outputs/apk/release/app-release.apk`

---

### 3. सीधे कनेक्टेड मोबाइल फ़ोन पर ऐप इंस्टॉल और रन करने की कमान्ड (Install & Run on Mobile):
अपने Android फ़ोन को USB से कनेक्ट करें (USB Debugging ऑन रखें) और यह कमान्ड चलाएँ:

**Windows:**
```cmd
gradlew installDebug
```
**Mac / Linux:**
```bash
./gradlew installDebug
```

---

### 4. Google Play Store के लिए साइन की हुई APK/AAB बनाने के लिए (Generate Keystore & Release Bundle):

1. **की-स्टोर फ़ाइल (Keystore File) बनाएँ:**
```bash
keytool -genkey -v -keystore avara-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias avara-key
```

2. **Play Store App Bundle (.aab) बनाएँ:**
```bash
./gradlew bundleRelease
```
> **AAB फ़ाइल कहाँ मिलेगी:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🌐 भाग 2: ऐप और वेबसाइट को होस्ट करने की पूरी गाइड (Hosting Guide)

### विकल्प 1: Vercel (मुफ़्त और सबसे तेज़ वेब होस्टिंग - Recommended)

1. [Vercel.com](https://vercel.com/) पर जाएँ और लॉगिन करें।
2. **"Add New Project"** पर क्लिक करें।
3. अपने **GitHub repository (`vikasjaat05/Avara`)** को चुनें।
4. **Deploy** बटन दबाएँ।
5. **परिणाम:** आपकी वेबसाइट और एंड्रॉइड ऐप बैकएंड तुरंत `https://avara-ashiq.vercel.app/` पर लाइव हो जाएगी!

---

### विकल्प 2: APK फ़ाइल को डाउनलोड करने के लिए होस्ट करना (Host APK for Direct User Download)

यदि आप चाहते हैं कि यूज़र्स आपकी Android APK फ़ाइल सीधे डाउनलोड कर सकें:

1. **Vercel / GitHub पर होस्टिंग:**
   - अपनी बनी हुई `app-release.apk` फ़ाइल को `public/` फोल्डर में रखें।
   - नाम बदलकर `avara-music.apk` रख दें।
   - अब यूजर `https://avara-ashiq.vercel.app/avara-music.apk` से सीधे APK डाउनलोड कर सकेंगे!

2. **Google Drive / MediaFire:**
   - `app-release.apk` को Google Drive पर अपलोड करें।
   - लिंक को "Anyone with link can view/download" सेट करें।
   - डाउनलोड लिंक को अपनी वेबसाइट में **"Android APK डाउनलोड करें"** बटन में जोड़ दें।

---

### विकल्प 3: Google Play Store पर ऐप पब्लिश करना (Publish to Play Store)

1. [Google Play Console](https://play.google.com/console/) पर डेवलपर अकाउंट बनाएँ (\$25 वन-टाइम)।
2. **"Create App"** पर क्लिक करें और ऐप का नाम **AVARA — दर्द-ए-दिल संगीत** रखें।
3. **App Bundle (`app-release.aab`)** अपलोड करें।
4. स्क्रीनशॉट, विवरण और गोपनीयता नीति (Privacy Policy) अपलोड करके रिव्यू के लिए सबमिट करें!

---

## 📂 एंड्रॉइड स्टूडियो प्रोजेक्ट फ़ाइलों की सूची:

आपके प्रोजेक्ट में एंड्रॉइड स्टूडियो की सभी फ़ाइलें पूरी तरह तैयार हैं:
- [build.gradle](file:///Users/vikashchoudhary/Desktop/Avara/android/build.gradle) — मेन ग्रैडल बिल्ड फ़ाइल
- [app/build.gradle](file:///Users/vikashchoudhary/Desktop/Avara/android/app/build.gradle) — एंड्रॉइड ऐप मॉडयूल ग्रैडल
- [AndroidManifest.xml](file:///Users/vikashchoudhary/Desktop/Avara/android/app/src/main/AndroidManifest.xml) — ऐप की परमिशन और कॉन्फ़िगरेशन
- [MainActivity.kt](file:///Users/vikashchoudhary/Desktop/Avara/android/app/src/main/java/com/avara/music/MainActivity.kt) — 60 FPS हाई-परफॉर्मेंस एंड्रॉइड जावा/कॉटलिन कोड
- [styles.xml](file:///Users/vikashchoudhary/Desktop/Avara/android/app/src/main/res/values/styles.xml) — डार्क थीम स्टाइलिंग
