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
[text](data:image/png%3Bbase64%2C/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABALDA4MChAODQ4SERATGCcZGBYWGDAiJBwnOTI8OzgyNzY/R1pMP0NVRDY3TmtPVV1gZWZlPUtvd25idlpjZWH/2wBDARESEhgVGC4ZGS5hQTdBYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWH/wAARCADxAUADASIAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAIDBAEFBv/EAEQQAAEEAAQCBwcCBAMHAwUAAAEAAgMRBBIhMRNBIlFSYXGRoQUUgZLR4fAysSMzQsEGU2IVJDRyc7LxNUOzg6LCw9L/xAAXAQEBAQEAAAAAAAAAAAAAAAAAAQID/8QAIREBAQEBAAICAgMBAAAAAAAAAAERIQISMVFhgSIyQTP/2gAMAwEAAhEDEQA/APnkUiBkBvUkgittldHhTJE6QPa1rc15r5Vp4m/RV1Z0VkMXFeG5st8zsoDUgIOIr2YbPl/jxNLgDTiRWta6Lr8IWQcXjwHS8ofbuXL4%2BhQZ0VkcWdpcZGNAcG6763rXUK9QrPdeiDxodeWbX838vCy4zopSM4cjmZmuo1mabBWluBLoy/3jDim5qdIAfCutEZEVssHDZm4sbtRo0m%2Bf09Qu4fD8fPUsUZaL/iOq/BBSi1nA1mPvWGIbeok3ruq%2BSyuaWuLSQSDWhsIOIrxhgRZxEI0uiT111fH9rVkWAMrA4YnDAHk6SiEGRFfPhuCzNxoX61THWfz8612DCGaPOJoWCyKe%2Bjy5fH0KDOi1e5/xAxuIgc4kAZSTZPLbw8/Gs4ZcoYHN1dWa6Hj4IIotE2FMO8sTj/pJ/eq6vPxrhw4sATxEm637%2B7Tb1QUIpSM4chbma6ubTYK0e5Gr94w%2Bu3T3%2Bnx%2BiDKivdhi2J8gljcGOymidT3aePl4KgamkBFpiwnELAZ4WZtemSK9Py/GjsIQ8ME8BJvUP007%2B9BmRSczLKWZmmnVmGx71ZwKAuWOyNrPf3Vy9R30FKLS/CZIy/3iBwAumusn4V%2BeaoYMzqJodaCKK2OJruJmla3IDX%2BrwUmQB8jmiVgAbmtxAs1sNesqbGvW8UK2NsRdJxCdBbADWY2NL8LSKJr35XStYKBsqut9dhaamXNWZYs7hZDaFa3R58vEeSmyLDODc2IMZrpWwnWz/alpxuAgw%2BEbKycvecp5UbGtLLPA2JjC1%2BYka7d/0/Nhvy8b43Kx4ec85sSdDhumW4nZ3RBYdR%2BUoYlkLJP4EvEYSa0IIHLdQe1rWxkOzFzbIr9JsivS/iuyRtYxha8OLhZA/p2/PvYGWmXNiOy75FtjgMmEknzOLmyOaWtA6IABs6Hr7tt1TiWuwr2slFOLQ6hrS7FEyYyF0jWVZFtGuqluTSS%2BVyO4OMzxue%2BSmg0SAOhtRIrbfXSq8AY4UGaHEOc17jGzMMlAXYGunffwPwvw0GDdXvGIc22EnLEOi66A216%2BS67BQWMuLYQ40C6Ei9u7v9PBTUysDJHvka3M0ZiBZAAC0YiCTDlgdisM4PBILHZgK5Ghz2U4oYQY3TZiwvIcGgAgUNbynrWzDez8AWslxOMe2MgmhBWo0rNRG9daaZWCDHTksjLsO1u2Z2HjPqQpT4%2BeJ4DX4Z4IuxhotO7ZWOwkDcwOIIIaTXA1JBdQ27h83cVBkEBMjXTABrqa/JoRR5ZedDmKvyur/J18zpoCXyRhwIprIGNv4gD8pTdhWZGujxbCSaIcA2tNVz3NhizMlJdWYNMO7a3uusV4rrMJhzFmlxYifdBroDWw5gdd%2BSadZte16D6Jr2vQfRTEURd/Oa0FxAtl0LGp07z5bKT4IRkDcS1xcad/DoN2127%2BXUe5NFWva9B9E17XoPotE2GwrMMHx4xsk1i4xDQ%2BBI/sq5YYQ9rY5w4ZSXPLKF67Cr108%2BSaK9e16D6Jr2vQfRWCKERhxmBcf6MlVvrddYHn41pdhPZ7WPcPaGZwacrBBWY1prXX3BNMYte16D6Jr2vQfRXRwYd9ZsTw9ruK%2Bz1Dvd8veuiDDFkY95Ae55Dv4ejW0KO3XYPh5tFGva9B9E17XoPorsHDhpJP95nELBuclk%2BFBUFooURda6D6Jo7r2vQfRNe16D6KOXvHyj6Jl7x8o%2BiaJa9r0H0TXteg%2Bijl7x8o%2BiZe8fKPomiWva9B9E17XoPoo5e8fKPomXvHyj6Jolr2vQfRNe16D6KOXvHyj6Jl8PlH0TR3DgzTOjdOyLTRzwA2%2B8/%2BVo90IkAOOwuW6Lg5p5dXVazZR3fKPomUd3yj6KamVZFC6XLWLwzMwvpmq8dFHENdDLI0YmGQNFtLdc2vcN1HKO75R9Eyju%2BUfRNMqWHHGje5%2BIbGWuaAC0agmifgokSB1cWHxsVz%2BiZR3fKPomUd3yj6JpldbpxBJiGNLBplaHBxpcjcHiQunDC0dEFg6X0VjYYy0F0zASCaybd23NTZDheK5r5iWgOpwjAs61/bq35bo1nwzcVzphHxehmoOLRoL3VzYi4WMVCNSNaG1/bzV%2BGiwJlczEyPa0E1IwCiOWmW/j6KE0GGbM4Q4jOwEZSYwLHVtv6afBXU9azzZ4tpon610KKliQYY43NkzZh1N6z9OVjvvQWcGAROJmDn5ei0MrXo93e7yVDm00nTQdkfRNTK0%2B3v%2BNZ/0x%2B5VA5%2BJ/dd9qYk4qeN7gA8MyuAFUbP2XBz8T%2B6z/hBbif4mFMhnoOGuXX9LdG6b/ZYVsgymTC5Wz3nqrBs039N8/sjS2AyOhdHK7FBulNazMHbH7/FQdJNLhg6Z85j1tzrcCe7Tw5rRhcS2aIsf7wXDVjY8hGg10y2NzXjuKJQymHDBmLhxIAsjotyOJ1Aot0/p6%2BaNMry0PHDM2bK7Oeo63y6q%2B3KOa5XhkkhjcSXvy2efnpfV/dXGR2d7OC/i9KxTOV3/T4eR69JxSMgcRjWzsNVUbGUdXA76c/3RHGCIRMc2bFA8P8ASIRWW9db2tUziMMyGaUkEOGdmUWQNa/OvuW1s%2BDMYMXvd1kDS1gDgTq0HKa3vXRUT1O5znNn4elF2UEbanTUdIee6KxvEAacjpC7KNwKzaX8P1eQ61SrZ4shaQ1zWlo/VzOUE/v6qpGRERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAXH/od4Lq4/wDQ7wQcxuasPd6RUMwogBzhR8lIc/E/ut/%2BKwB7UYB/lD9yscEBmMp4zI8oLuk4C9dgpueOsz5QW3K0jDge8ZbJd11lbeXXx%2BFKrDw4Z1CbESAuZoGt/S/NQB01Fa%2Bik%2BOMtA98kLQSA8tOU6NFAVp391Ke0X2bIcFiIpo3QCRkMw6Lg5jnHSzzHU7yU8RI18fDdHjzJof4jAdDtY6t62XmNc8QaYuVr9QIxeo0r9z5LXwYTDmd7XmAJOUGJ1Eiufx709pFnmjJI8MbIxj2vYQxwc0ak5tL32obfeeJngIymGWNxJcQWjXU0Ne7S/3VGJjjiMvD9oSSOB2LC3OdQd9tOvrVbmlz%2BIMRKCQ5zc1l1dLnXd6%2BKvse7VFFiOHI4wziLQgNjB16z1igdRzpdM7Q2OSUSbtv%2BGOlo3/V1X1fTmSCRwa32pONgbY5wJ51%2B2yi/CQR4cSP9pPcHXbGxuGY6GrI7xrSe0PYxDC%2BGxA7RoIcHcyG61Z6j591LHw35i3I7MBZFa9aAyCMETyCjsOW2v51LXhosAWtfLjJojlotGpv5ao/3PVqvlE9oyCJ5qhdgnfar8tirDhJ2lwLBbbvpDlf/wDJ8lpEOE4rmn2tIYgRVRu6Q58tNz5qmRsbXub77K5/StxaQNjpW9k%2BV%2BU9obFEkbo3Fr2kEEj1pQWh0cEjGOGIl4zmkvBGa32aG3PTr3SHDYeSJrn47I9zw3IYzoOZJ2pPaGs6LVi8JDCYxFi3yBx1cYi0AaEb76G/JGYfCOjYTjHBwd0wW10ejtpvq7yT2hrKi0Nw%2BHMczjjSMmXIOHrJYN%2BFUuy4fCNfUePMgGtmItvTYJ7Q1mRWmOFshHHc9lO6QGXWjXLrr7KTcNFJI2sRw2OIvMQS0f3V01Qi0yYSNslMxjXt7Wg/Ov4KPu0ZA/3oBxreqHifsiqEV4wrCy/em5urTu%2Bvp4K6bA4VsJdF7Ra%2BQD9OWr%2BPLRBiRaX4aCNr3e98SrDQwAXvR/YqIhwzpZAcW5jA%2BmOLLzN11/bzS3E1Qi1R4bCOxGR/tEsiyWJOCTrexCgIcOZ3M98cIwLa8x7nqrkp7Q1QinLHG39E5foP6a1oX6k%2BSsfDhhhg9uLcZqFx5NCb6/BPaHsoRRo9o%2BiUe0fRXYeySLTJg4mNJbjWvPU0fWu/0%2BHDhYujWKA01ut9foPNFZ0WpmDhcx7nY9rXC8ravNv5cvNVswzTJldiWtbydYI3Hx6/JBSuP/Q7wWh8ETYSRMS/LYAcN%2Bj3f83kFleDkPSOyalr1P8AGAA9rMA/yR%2B5WCHDzTmThNzBgLndwtel/jNrW%2B2I8oocFv7uXltZI8vyMLstk1yF7rM/pEvy3Qy4l0bWnGYdjS0OpzQdQQ0A6b6A%2BHxUXSTBnB97gyhx2YKGjRYIHd6HrUojiXRsy4LDkODXtcdCQCG731jXxKgTiBEIDhsO0NcTq7UEhoOpPh4WerTLKEU88cD3MmgAdQLHRgk5arQjv37ivRkxHtCWIGT2rgyATppdgdw7t%2B7TkvOifIyF8nusD2HKLc42C2ttb1v8rTfLJjpIgD7NwTGtcToAKNC7102BPhrzSqw4iB%2BH096wsmVuWo%2BlYJPdr/4VkeMxUWUR4uGmEuYXR6j9Wuo319R8KsRh8ThzeIhjDq1uSybJ1Ot39FfDiJ2ZB7rhJDHdZnA2Old66jfu0HXqRF2HkMwf/tDCl%2BYyXZ0NWTt4fsrZoMS2JssuOwrmB2ldLXo3WnUB5Kp2FxrZg8QwglxkAa9tdqt9gBdch4qeIhxoYDPhIWNabFuA3DR19TR6qy/lWRk07akE7A5uzS3qobbdXl4LbD7zKyJx9oYZrW9McSrDqo2Nzt%2ByxslkAD%2BFAWAatJGtVy36j5961ww4ydsRZgsK8A581gZtOeo6tutXfysv5ROFlc50D8fg8sZHSzXd9R5/nwg8TCQvOLwxkOZ1taNaBN3WhOwG91tounA463QHCRtkjIzkuAIva9fzRclZiWymV%2BFgDnFzqLt6BJIF6jv7h8Zv5RxrpmQOe3Fwt4rXFzMuupojuuh6fC3DMxD4w6PF4NvEeG5MoDrNcq29N%2B9VRjEshMzcPBle1zmuJFtGoseBGnf46zhgxJi4jMHh3RvcAHF9gGhpZOnhvr4K7%2BVV4iKSACJ2Kw0gc9wOXpZT0bN1fIbdRXG4Euja8YmA6gOAvoDo6n5vQruIjxcbGxYiKMEvLWl0mrTTe%2BhQAGumvlX7nisrXcJtOOUdManTTx6QUZTbgXuZM/3nDhkRaCSTqXAnTrqiuTYLgvDTjMK8nsEuFVe%2B3cuNwOKdxKibUeXOS8ANvUapLgcVC4Nliaxx2DpACdLT9ivggPymZhFONtB3ANDWt/7/AAV7PZuIkLMjhlfs4xuqusmlnMModlIZdE6PB2u9vBSbhZ3Oa1rYy5xoDits60rFjRJ7JxjHhoaH3zaDW9c/znsuf7LxmVpyi3VTcpvXr5Dl59xqh%2BGxDHBpi1OwBvnXLv0T3bE5A7haGq13vb87x1hVefS5vs3FOjzgCu5pP7K2b2Li4Ys%2BaN57LASVk92ny5jGAOtzgP3UpsFi4GZ5YcrevMEOfS2X2bPDG98r2NazS8rtTrVfnNVDCl0sjBiYBkdlDnGg7fUd31XDhcQGucWNpn6jnGm%2Bnp%2B3WF0YPFOkfG2IF7HFjgHDfq79v26wpUqcWBMswjGMwrQWZw97iG71Xj3KHuh4z4/esP0G5s1nKe4HmV2PAYyWXhxwh7i0vFPBtoNXfiue5YrjOh4TeI1uZwLxoPwqftEHwlg/nRONA02zyGnr6FTfhcmHEoxUDr/oF5t%2Br8/a4PgmjBztYKANZxdGjt8R69RUn4TERwCZzGcM7OEgP7fmh6kFHS6x5J0useSW7qHmlu6h5qjdJ7IxsbC5zWmuTekfT4%2BXhfD7MxQyjSyOw7Q66enqqX4TFRtLnwOa0czp%2Bf8AnqXPdsRYHDFkXWYXz%2BhVa/TSz2RinxufmYA29HNcC7S9BSrj9m4t8gZlyE9pjq5c/j6KDcHiXMc9sbXNb%2BpweCAq2QzPdla1t9RcB1fVD9LZMFiIoy97XNAF6xnu5/H0WV%2BbKdRt1KbmSN3a3a/1fnWoPLsp0G3WjNet/jEOHtaPMAP4Ldh3uXmxzSRF4jLm5rBo7i16n%2BNf/WI/%2Bg3/ALnLz8K7EN43ADSHAtdY5E7KeP8AzjplvlxIYnDhoBwNuFdLiHWqvzo%2BfcuDEQ8JrfdLcCSXF2%2Bg%2Bh81pjf7SgwzZGiJsYp7XHLpVbenie9Zmy4oOEraugLHPLX2TKxlcZNCGvz4ZxccuUh9Za38bWmXG4F7GtZ7KyUbsTE3tp4aKr3vGvcC1zWObs5oDCLob%2Bnh3K6fFe0JYsr8MwAiyRBRI67rqP5Zt60ysJkBNmHkbo0L6/zqWmPFYUNYX4Euc12oD6Dm9LTu3HkuHEYwB7SxozusnJRvXnV8ygmxgaCGNcJBlBLM16nr52T3plMqoTR8cO4FR582W76N7bq6TEYVzGsZFK1gdZHwaOvuPmpmb2gxvDOHa3M2q4AFix3ddKqSbFBxa9rLDRYy6AUKsbdX4Arl%2BlyuslwbXgvikc2tRVE6Dnm6x6lT4/s%2Bmf7rLYJLqO/cOlouQ4jGhlRtYaOlizyFAHf%2BnRcdLj3zS9A8WQjOQwh23ppfinfo79K8%2BF4YGSXNzdlH7ZlIy4R0znGKUMJsNFd/f4eShnxMbTFWWtCCDY3%2BpVrJMdiHPezpEXnrneYmx8XJ36OjJsG0OuF7na5SRo3q0za0uRy4SPXhTPddgkgEeRVsT/aT5JIGtbK6MG2kBxaBuG9Q7gqj78%2BV2YXJFTzm0LaoDv5jRO/R1VJO2RpBhdnskPBAvbfr2PxKqD3AEAOAOh13WiOTFHEtLGjiHKwCuqgB6BcGMxAc8gs6XKrrw6th5DqCmVMqgSPDCwZspIJF6Ejb9z5rlnslaz7RxZkL8zAbBFNoDwA2/uqI5ponEsyi7B0vcEfsSmUyqw4jZrlY3EztADZJRW1O29Va7HYlzXtPDIfv0defPl%2BorjcXiGwCFvDDQbvLr578kymVD3rEf5kvz/dPesR/mS/P9104iYx5OgG1loXtof7BSbjcS1gY0sAG2VtHcHceCvTqsYmcCg%2BUDud9133rEf5kvz/dXR%2B0MVG97miG5KzXGCNBQ0rvVc2LxE9GQsuqsNANeKdMqt2Ime3K90jh1F1/3UMx7JWh2MxLiSS2zd9WoIOm3MqQx2IDs2WAmq1iaed9SmUysuY9kpmPZK1n2hii7MRCTlDf0C6Bsa1fJVNxM7XhwLARWoHVX0TKYps9kpmPZK0OxeIdEYiWZCQSPCufwXH4rESSB7nNNAgDk296Gw%2BCZTKozHslMx7JWkY3FBr25mZXmyK50R/%2BR81EYvFCiJKI0zXqRd1e9a7JlMqPvWI/zJfn%2B657zOf/AHJfm%2B6tdjMVL0QWNzUKY0NvuoKp0cznOcWDtGhQ1PLzVymV33rEf5kvz/dc95nu%2BJL833SMSB4AY1xcaANjVanYnFtYA7DxNadBmYQDl8d1cWSsrsRM5pa58hB5F33VT3HKeidlskdiXYd0hhaI3gNzWeVdZ/0hY35sp22TEsr1v8ZX/taOyL4DbrxcsGHZm4p4/C0Px12VXtN7pMa%2BR4pz%2BkR3kro5%2BJ/dTxmeEjpL/LWx4a7DsD/aMzhlH8MsJDdtNdOvbqHWqmPcwsa3Eva29SG7ba%2BnotbJs8DWvlDAxlAujdp%2BjmO/9h10ucaM1HHM1o0cOi/c5b1GuhHV/TotCljmGZzJMZIGZdHhgOuXav8A7VKVw4TyMfM%2BZ1AsdHVjUUT4LWz2jwsIXMxTTOGio%2BEd9OfgT5HuumHFNMLY%2BI1jQ39HDc6t83Puv49yKyyOa1zS3EvkzNJeQ0Ah2oA130rzKrD5nNyCR5aP6QBX7d581acXZaRDHmAIJIuzrr6%2BKkMdKWuYGMIcCCKO255oikT4m7bNJbRuOQ/KXONNQHGfQNjbu%2Bg8le/Hyva1rmsLWfpFHT1UfeXuIHBYSQGjQ8tq17uSClsszXZ2yvDgKzCr811uInYKbO9o2oUFdFi5GOuNjbAO17Vrz7lcfbGKLQ08PKNm5dEP2yGbEHeaQ6V8PwnzUM0lucJX27cjnf8A5K0yY2Rz3F8UeY6OOWjz%2Bv7dQUDi3FpGRlHffv7%2B8oKo5J2y545pRI7%2Bpp1NrmeXPm40mbrvXe/3XoQ%2B1Ma1wihaMw0DQyzouPxeNc63wWbBoxnXQDbyQyMDXS5xllkzGhoddNh6BRDHHYuPgFrbPM1zC2HVpBbo466d/wDy%2BikMZiWZJhHlDTTXUQPDdDGPhSdT/JOFJ/r07vzqK2v9pYku4jmtBkG%2BUgOH99q%2BCqdi5DeZg79Xc77%2B8%2BaGRmyOq7dQ0ukLHDcuF67LWMfKDYawHro6nezrqdFc7HY3ExZTFnYbFtadfiEMjz%2BG%2Br6db3X51jzXMpIJzO08Fr94m4eUxDI3lRposd/WAu8bEQnNwMnRuyHDo2Nd/BDGThv/ANfXt3X%2ByjR7R9FrkxMjoYmyRNMbbyWD8db1U58diHHJMxoI1ogjl9EMjFkdRNuoaXS5lI/qdr4La3ETxR5GwBjQ4XTSNRda9ervwI72hM5gGSNrWuzDK3Lr8EMjFR7R9FsgwcL4s0uMDCRYaMpO6sf7Sxb2AO1DRV6jz1VLMW9knEaxodtYv6ocWswOHcx2bFFjxfNrgdevTdQGDY7XjgC9em3QafdROLeYy0xxlpI1IN6dRvRaH%2B1sYGmNzWAN0rJVd3orxeM8eCzk5sQ0NHMFp/Ofkrm%2BzWF0l4umsFggNJd16Xpz58lS/GPfWZrSQKG%2B23Wu%2B9yP6IY05jsL137%2B8%2BaHEvcWsY0uxID/ABbXdXXy8irOG4HI3HWGjouDm14Vy2b1rh9p4nhi2My7A5fjV%2BXoqo8ZJFmLGNGYguJs2bvr6whxobh26P8A9ocM2Gj9J9b2GijJFIK4eP4gY7Q20UOsa%2BAVUeInIaGQhwuhQJvYVv3NV7MTj44S1kD2x5dei7Qb7/EIcUyRPjwjo3YwODSSIwQeY%2Bp07lhe05D0jstGJdLLM%2BSZha%2B6dpVHq9FQ/wDQ7wUZqrEte2QZ96VmdoJBPM/uoYuTiSA1VNA1NrTBI2PiZo2vuwL5ap/ieMlvyuGLhcyNr5pKaAKoEAaHTTr/AG5qDcSwuaHzODc1EgUa0/sPMeevC4l%2BE4UkMsBeGEBpaOZB6R69/JZpgZZM0kzCKFEG6FDT4X6FGupzYyN2GfGcXI82MrS3Q9d9WtqQxzH4UNkxcpeQczTqOfOuenl4KtuEDq/3nDi%2Btx%2Bn551wYUGESe8Q6/0ZukP7eqp1188RFDECiLIyVR17vDX6BWDFwhgLMW5rmHOxvCFA%2BPw/sszoS1zgHxuAJGYOFHfX0/LCkMOMry6aMFosDMCT3fv%2BFDrXH7RZwwH46QbW0Rij8fis4xDBTvehnbRb0dAbB6u7fn%2B8XYXLl/jwuLhs146J6jfx/CoOiytvOw1uA6yNvPfl1IbV3vUYjze8lz2gBrQOWl6kabfnO3D46GPBhoxkzJADbAwFp1vfyWduHBIHGj1Fg3psDXqfiFYMA0sze%2B4Udxeb5d3eh1E4mKWK5Z38SteiO%2BtfL82gzExOkJlkLW6gZQCQCDyqtz3fQ7DgOyiaM6b2K2P0/ZckhazP/GY7Ka6J33%2BnqFDrX79C8DPi5bDs15AdRt4c/TbYQfj2u4kgxUnEaTwy5oJc2xVnl1qEGDZLlLsVBGDqcztQFW7D5XVx4TrQIdofzvQ67HiYwRctaAWAP9O%2Bm2n5zlDi2xRhzMS4SEg1lsAg%2BGmnV/ZQbh2l7QZ4wDRJva6/a/QqUeGjMjWy4hjGn%2BodKvFDqx2PHB0xTy/TTKANyd9zr5knxOeTERvi/mEvJBcCBXPZafcsPTj79Hptp%2BrQ998uaodAwXUoO/Md/f3evhY6mZ8K5rW8WRjP6hQNb9QF6V1WR5S96w7XN/3mRwAyVkGrQdtfuqxhmlhPvEQIcABe4PNSkwsbS3Lioi0gEuN6HqoWfih097h5zP0AIAAoGx3dQPxpSGMhcIxLiJsraBAaCMoA01rv7tlz3SLKCMXFZIFeWvhqfLyqMIEWcysuv0g2eX19Ch1fBjwGND8ZIzJWQNYCBpr1LkmMhkibeJmdINLIA0ANba/DvVJhGVpbKx2YbXRb42uyYcMbfHid3NJ09PzyQ6nJjmhrWtmc4UdNAG/qqtO/9/hP3jCSxjjYqZrsoBAjFeAPVqfT4UxQNkYXOnjjI2Djvoerw9QpOwoa1pGIidmNGnbfZDqc%2BJw/EYIp5HsaQBxGjotGw5qmWeN7qMpe0NbqdDdCxt40pS4ZscbXjEwvsgZWk2O/ZViL%2BIGmRgvneiHWyDGYeOMj3yZt/wBIjBB6I%2B4/Naxjmy2JsTIwAdANaDqd7281TwW8Jz%2BKzokU3mf/AArTgmhhccXh7rQB19X58EOovxUUzWcSaTMGknas1mqA5beq7hMRAzM92Ikie7QhjAQRd/2H5tWIW07%2BK3TqO%2BhPPwU/d4QCTiNOVNFnflemw80OrBicM0BrcRIRmzfywKN2T37fsuDGxidrveH0KOfKLu/DqXJMJG0Ny4qIk7gkCvIm%2Bv76KUOR0YL3YdtEAAtsnVup7qv1VOqzi2x1wp3HYmxRvo3y6x6JiMUxwYWTF5BJOdg30179v/O6NAdE1twjU7nUfp7/AM1%2BGxuKlbgSTPhwANI9S8mx9b35Uh15b8RnLi5wJcQSaHJVve3IdeS3TzNjhdhY8kjWnSUCrG6xv/Q7wUSqHnM4XlPR5ClMylrnCrolU27XNuLCm8kSvokakKz4Yaf9oThmTQADLoADuDvXcPJRjx0sTszKvTcA7eKzE2bK4mG1q9%2BkEbow1oa4AEUDoDehOo1UpPaM8ofnIOf9Wg16Rd1dZKxomG1pfjHvYGFraG1NF%2Be/NWD2lM17nNawZnZqyg/vaxImG1rnx8uIycUNJYMoIAGl3y7yfNVcc9lUomG1dxz2U457KpRMNq7jnspxz2VSiYbV3HPZTjnsqlEw2ruOeynHPZVKJhtXcc9lOOeyqUTDau457Kcc9lUomG1dxz2U457KpRMNq7jnspxz2VSiYbV3HPZTjnsqlEw2ruOeynHPZVKJhtXcc9lOOeyqUTDau457Kcc9lUomG1dxz2U457KpRMNq7jnspxz2VSiYbV3HPZXHTEgit1UiuG1ZOA2Qgcr/AHUZP5jvEqJOZxN3ZUpP5jvEpPgRRERBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREHXM4bi3MHc9Da7J/Md4lQy5XOqwCbAPJTk/mO8SgiiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgHMDTzbhvfJSk/mO8SuSFzpXucbc42SuyfzHeJSfCooiIgiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiCyduWZ2lWb3UZP5jvEqLmOY9we3KbUpP5jvEqT4WooiKoIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIglM9z5XFziTfNJP5jvEqqNxeC48yrZP5jvEoIoiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiIKoP0fFXyfzHeJVcMTg0gC61PcFoeG25xY6rOuYC/RBSi3SezMVG5zXYOe270b/YKv3SXW8NMKrc9ZocutBlRaHQOYzO6GQNNm8w2Bq9usrowz3Fwbh5iWgE0dgRY5dSDMiuEYcSGxPcWizTgaHXspyYd0Tyx8LwRv0wf7IMyK%2BWLg1xIZG3tZ39FXcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QQRTuPsu%2Bb7JcfZd832QavZ/wDLxH/I7/seqTtP%2BcwiIPZd/KxP/Vm/7El/4T/6MH7hEQU%2B0/8A3/8ApH/5QrI/%2BIl/5Y//AIHoiDNh/wD0nGf8rP8Auetkm/xb/wDoREHn%2B2f5sX/K7/vcvOREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q%3D%3D)