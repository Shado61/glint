# Manasenger

Мессенджер в стиле liquid glass: личные и групповые чаты, фото, реакции, ответы, редактирование,
аудио- и видеозвонки, демонстрация экрана. Работает в браузере и устанавливается как приложение
на телефон и компьютер (PWA).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shado61/glint)

## Запуск
```
npm install
npm start
```
Переменные окружения — в `.env.example`. Для звонков между разными сетями (мобильный интернет)
нужен TURN-сервер: `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`.
