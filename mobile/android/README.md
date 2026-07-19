# FitPro Android (скелет)

Jetpack Compose-приложение, один APK на обе роли (клиент/тренер), API — существующий
REST-бэкенд FitPro с bearer-авторизацией (`POST /api/auth/login` + `mobile: true`).

## Стек
- Kotlin 2.1, Jetpack Compose (Material 3, BOM), minSdk 26 / target 35
- MVVM: ViewModel + StateFlow; DI — Hilt (KSP)
- Retrofit + kotlinx.serialization; JWT в DataStore (`data/auth/TokenStore.kt`;
  перед релизом обернуть шифрованием Keystore)
- Тема из дизайн-токенов веба: `ui/theme/Color.kt` ← `mobile/design-tokens/tokens.json`

## Сборка
Android Studio: открыть `mobile/android` — соберётся сразу (JBR внутри студии).

CLI на этом ноутбуке (системная Java 25 не подходит Gradle 8.11):

```bash
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
./gradlew :app:assembleDebug
```

SDK ищется через `local.properties` (`sdk.dir=C:\\Android\\Sdk`) — файл не в git.

## Локальная разработка против dev-сервера
В `data/api/NetworkModule.kt` заменить `BASE_URL` на `http://<IP ноутбука>:4000/`
(бэкенд: `npm run dev` в `server/`); для http добавить `android:usesCleartextTraffic`
в манифест (только debug!).

## Шрифт Geist
TTF из https://github.com/vercel/geist-font (SIL OFL 1.1) → `app/src/main/res/font/`,
затем в `ui/theme/Type.kt` заменить `FontFamily.Default` на `FontFamily(Font(R.font.geist_regular), …)`.
До этого — системный Roboto (штатный фолбэк веба).

## Дальше (дорожная карта — knowledge-vault/atlas)
Ф2 — кабинет клиента: дневник тренировок, таймер отдыха, замеры + фото, привычки, материалы.
Ф3 — кабинет тренера. Ф4 — push (FCM; на сервере сейчас только web-push/VAPID). Ф5 — публикация.
