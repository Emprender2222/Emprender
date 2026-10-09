EMPRENDER - PREPARAR APK

Esta versión está preparada para convertirse en APK mediante Capacitor.

IMPORTANTE: ejecutar los comandos desde la carpeta que contiene package.json:
Emprender-app

1) Abrir CMD/PowerShell en esa carpeta.
2) Instalar dependencias:
   npm install
3) Crear Android (solo la primera vez):
   npx cap add android
4) Generar la aplicación web:
   npm run build
5) Pasar la aplicación a Android:
   npx cap sync android
6) Abrir Android Studio:
   npx cap open android

En Android Studio:
Build > Generate App Bundles or APKs > Generate APKs

El ID de la aplicación es: com.emprender.app
El nombre es: Emprender
