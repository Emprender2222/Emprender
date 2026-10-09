ICONO DE EMPRENDER - reemplazo del icono de la app

El archivo icon-512.png es la imagen original enviada para el icono.

Si el proyecto Android ya existe, reemplazar los archivos ic_launcher.png e ic_launcher_round.png dentro de las carpetas mipmap-* por los archivos de este paquete.

IMPORTANTE: si el proyecto tiene iconos adaptativos en mipmap-anydpi-v26 (ic_launcher.xml / ic_launcher_round.xml), hay que actualizar también esos recursos desde Android Studio > Image Asset usando icon-512.png como imagen de origen. Luego hacer Clean Project y volver a generar el APK.
