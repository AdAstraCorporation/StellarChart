# Ad Astra · Carta de Navegación Estelar

Simulador de rol espacial en un único `index.html` estático, sin servidor ni cuenta. La estética sigue la carta
«Hail Mary – Stellar Navigation Chart» (valhovey.github.io/gaia-mary): fondo de cielo completo con la Vía Láctea,
rejillas en perspectiva, nombres en mayúsculas con línea guía, trayectorias en arco y modo Petrova en rojo.
Las estrellas se generan de forma determinista; el vecindario del Sol usa RA/Dec/distancia reales (eclíptica J2000).

## Carta
- Cámara libre y suave: arrastrar = orbitar · Shift/botón derecho/dos dedos = desplazar · rueda/pellizco = zoom
  (1 al – 3 000 al) · WASD/flechas = volar · Q/E = bajar/subir · Inicio = tu nave · M = panel · Intro = viajar.
- Interruptores Navegación (líneas de visión), Color (espectral) y Petrova (estrellas con astrófago y su esfera de 8 al).
- Vistas: Sistema Solar, Trayectoria (ruta hacia Tau Ceti), Tau Ceti y Galáctica.
- Semillas `CABECERA-DETALLE`: la cabecera (A…Z, AA, AB…) numera sectores de 240 al en capas alrededor del Sol, sin borde;
  cada carácter de detalle (0-9, A-Q) afina la posición; 14 caracteres identifican una estrella.

## Viaje
- Cálculo relativista con aceleración constante y volteo a mitad de camino: tiempo a bordo, tiempo en la Tierra,
  velocidad máxima y factor γ. El astrófago consumido depende de la distancia; las provisiones, de la tripulación y del
  tiempo a bordo (×0,15 con hibernación en cápsulas de coma, con riesgo al despertar).
- Rutas automáticas con A* cuando el destino supera el alcance por salto (hasta 400 al por plan).
- 8 naves con tamaño real (de 7 m a 2,4 km), comparadas con objetos conocidos; astillero en el Sistema Solar.

## Rol
- Tripulación con especie, rol, seis estadísticas, rasgo, salud, moral, experiencia, nivel y biografía.
- Eventos aleatorios con decisiones y tiradas (1d10 + habilidad contra dificultad) en tránsito y al llegar.
- Sistemas: recolectar astrófago (sólo en estrellas infectadas), descansar, reparar, escanear planetas y reabastecer en la Tierra.
- Aterrizaje (o lanzadera en naves grandes): atmósfera, gravedad, temperatura, condiciones anómalas y puntos de interés;
  expediciones con equipo elegido, botín, heridas y experiencia.
- Misiones con historia: Primer salto → La línea Petrova → Destino: Tau Ceti → Superficie de Adrian → El eco de 40 Eridani…
- Modo creativo y rescate si te quedas varado.

## Partida
- Se guarda en `localStorage`. «Partida» descarga un archivo binario comprimido (`ADA` + deflate + CRC32) con toda la sesión;
  también hay enlace y QR. Al cargar se elige partida completa o sólo fusionar la bitácora.
- Para que el enlace y el QR funcionen en otros dispositivos, publica el archivo (p. ej. GitHub Pages) y escribe la URL.

QR: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluido en `index.html`.
