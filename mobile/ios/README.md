# FitPro iOS (скелет)

SwiftUI-приложение, один бинарь на обе роли (клиент/тренер), API — существующий
REST-бэкенд FitPro с bearer-авторизацией (`POST /api/auth/login` + `mobile: true`).

## Стек
- Swift 5.10+, SwiftUI, iOS 17+, MVVM + `@Observable`
- URLSession async/await + Codable, без сторонних зависимостей
- JWT в Keychain (`Auth/Keychain.swift`)
- Тема из дизайн-токенов веба: `Theme/Theme.swift` ← `mobile/design-tokens/tokens.json`

## Сборка (только на Mac)
Скелет написан на Windows, поэтому `.xcodeproj` не хранится — он генерируется:

```bash
brew install xcodegen
cd mobile/ios
xcodegen            # создаст FitPro.xcodeproj из project.yml
open FitPro.xcodeproj
```

⚠️ Код ещё ни разу не компилировался (на Windows нет тулчейна) — первый запуск
на Mac почти наверняка потребует мелких правок.

## Шрифт Geist
1. Скачать TTF из https://github.com/vercel/geist-font (SIL OFL 1.1).
2. Положить в `FitPro/Resources/Fonts/`.
3. В `project.yml` раскомментировать `INFOPLIST_KEY_UIAppFonts` и перечислить файлы.
До этого `FPTheme.Typography` использует системный шрифт (SF Pro) — допустимый фолбэк.

## Локальная разработка против dev-сервера
В `Networking/APIClient.swift` заменить `APIConfig.baseURL` на `http://<IP ноутбука>:4000`
(бэкенд: `npm run dev` в `server/`). Для http потребуется ATS-исключение в project.yml.

## Push (когда появится Apple Developer)
Сервер уже умеет FCM (`POST /api/push/device`, platform "ios"). Активация iOS-доставки:
1. Apple Developer Program → ключ APNs (.p8) → добавить в Firebase-проект
   (Project settings → Cloud Messaging → Apple app).
2. Подключить `firebase-ios-sdk` (SPM в project.yml → FirebaseMessaging),
   `UNUserNotificationCenter.requestAuthorization` + `Messaging.messaging().token`
   → `POST /api/push/device`. Зеркалить `mobile/android/.../data/push/PushManager.kt`.

## Дальше (дорожная карта — knowledge-vault/atlas)
Ф2 — кабинет клиента: дневник тренировок, таймер отдыха, замеры + фото, привычки, материалы.
Ф3 — кабинет тренера. Ф4 — push (APNs; на сервере сейчас только web-push/VAPID).
