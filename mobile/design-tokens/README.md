# Дизайн-токены FitPro для мобильных приложений

`tokens.json` — снимок дизайн-системы веба для нативных iOS/Android.

**Источник истины — веб**: `client/src/index.css` (CSS-переменные обеих тем) и
`client/tailwind.config.js` (радиусы, шрифт, анимации). При изменении токенов в вебе:

1. Обновить `tokens.json` (hsl и предвычисленный hex).
2. Перенести в нативные темы: `mobile/ios/FitPro/Theme/Theme.swift` и
   `mobile/android/app/src/main/java/com/oasixlab/fitpro/ui/theme/Color.kt`.

Кодогенерация из JSON (Style Dictionary или свой скрипт) — осознанно отложена до Ф2:
пока токенов мало, ручная синхронизация дешевле инфраструктуры.

Шрифт **Geist** (SIL OFL 1.1): TTF берутся из https://github.com/vercel/geist-font
и кладутся в ресурсы обоих приложений (см. README каждого скелета).
