# Corporación Ad Astra · App

Una sola app web (instalable, responsive, sin servidor) con un menú inicial para elegir:

- **Credenciales** (`/credenciales/`): fichas de tripulante de la Corporación. El código vive en
  [AdAstraCorporation/Membership](https://github.com/AdAstraCorporation/Membership) y se incorpora al publicar.
- **Carta Estelar** (`/carta/`): simulador de rol espacial. El código vive en este repo.

Publicada en **https://adastracorporation.github.io/StellarChart/** con GitHub Actions (`.github/workflows/pages.yml`):
en cada push a `main`, a mano o cada 6 horas, construye la Carta (`tools/build.py`), trae Membership (la rama
`feat/estadisticas-rol` mientras exista; si no, `main`) y publica `/`, `/carta/` y `/credenciales/`.
En *Settings → Pages* la fuente debe ser **GitHub Actions**.

## Estructura
- `index.html`, `manifest.webmanifest`, `sw.js`, `icons/`: menú inicial y app instalable.
- `src/`: código fuente de la Carta (`head.html` + módulos JS) · `vendor/`: qrcode-generator, jsQR, PeerJS.
- `tools/build.py`: genera `carta/index.html` (archivo único). Ejecuta `python3 tools/build.py` tras editar `src/`.

## Fin de misión → Credenciales
Al cerrar una misión, la Carta muestra **un QR general** (enlace `credenciales/#X…`, versión 2). Cada jugador lo escanea
desde Credenciales («Actualizar → Escanear QR de la misión») y después su credencial: se renueva con estadísticas, nivel,
tiempo de vuelo (`fv`) y misiones (`ms`); cada misión (`mi`) sólo se aplica una vez.

---

## Carta de Navegación Estelar

Simulador de rol espacial en un único `index.html` estático, sin servidor ni cuenta. La estética sigue la carta
«Hail Mary – Stellar Navigation Chart» (valhovey.github.io/gaia-mary): fondo de cielo completo con la Vía Láctea,
rejillas en perspectiva, nombres en mayúsculas con línea guía, trayectorias en arco y modo Petrova (estrellas con astrófago en rojo).
Las estrellas se generan de forma determinista; el vecindario del Sol usa RA/Dec/distancia reales (eclíptica J2000).

## Carta
- Cámara libre y suave: arrastrar = orbitar · Shift/botón derecho/dos dedos = desplazar · rueda/pellizco = zoom
  (1 al – 3 000 al) · WASD/flechas = volar · Q/E = bajar/subir · Inicio = tu nave · M = panel · Intro = viajar.
- Interruptores Navegación (líneas de visión), Color (espectral) y Petrova (marca las estrellas con astrófago).
- Movimiento libre: «⌖ Destino» fija como destino cualquier punto del espacio (la retícula central) y «✈ Pilotar» (F) mueve la nave a mano con WASD, Q/E y Shift. La nave puede detenerse en el espacio profundo. En modo creativo no hay límite de distancia por salto.
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

## Plan de viaje
Pestaña «Plan»: paradas en orden (estrellas o puntos libres) con tareas en cada una: recolectar astrófago, descansar,
reparar, escanear, aterrizar y explorar un planeta, contactar una civilización o reabastecer en la Tierra. Calcula las rutas
entre paradas, estima combustible y provisiones con las tareas incluidas y lo ejecuta solo (pausando en los eventos).

## Civilizaciones y lore
Cada planeta puede albergar una civilización según sus condiciones (zona habitable, atmósfera, gravedad, tipo de estrella) y
la semilla: especie, nivel tecnológico (de ruinas extintas a interestelar), gobierno, disposición, población, valores e
historia generada con datos del entorno (planetas vecinos, estrellas cercanas). Se puede contactar (tirada de Diplomacia),
comerciar, aprender y reclutar según la reputación. Cada sistema tiene además su propio lore.

## Sesión compartida
Pestaña «Sesión»: el anfitrión crea una sala con código (o enlace `#sala=CÓDIGO`) y su navegador guarda la partida. Cada jugador
se une **subiendo su ficha de Members** (PNG del reverso con el QR, o el enlace `#C…`) y maneja su propio personaje. Viajes,
acciones, expediciones, planes y eventos se deciden por votación (mayoría; 90 s, 60 s en eventos). Hay chat y votaciones libres.
Usa WebRTC con el servidor de enlace gratuito de PeerJS; `?peer=host:puerto` permite usar uno propio.

## Conexión con Members
- Lee credenciales v4 de Members (`#C…`, también desde la imagen del QR con jsQR) y su campo de rol
  `R1;rol=…;ras=…;s=pil,ing,cie,med,seg,soc;lv=…;xp=…;hp=…;mo=…;t=semilla.n.total`.
- Al terminar («🏁 Terminar partida y actualizar fichas») genera para cada personaje un enlace
  `https://adastracorporation.github.io/Membership/#X…` (deflate-raw + base43 de `{"v":1,"id","n","e","x","res"}`) con sus
  estadísticas actualizadas; Members pide la credencial actual y la contraseña de la crew y emite la tarjeta renovada.

## Partida
- Se guarda en `localStorage`. «Partida» descarga un archivo binario comprimido (`ADA` + deflate + CRC32) con toda la sesión;
  también hay enlace y QR. Al cargar se elige partida completa o sólo fusionar la bitácora.
- Para que el enlace y el QR funcionen en otros dispositivos, publica el archivo (p. ej. GitHub Pages) y escribe la URL.

Librerías incluidas: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), [jsQR](https://github.com/cozmo/jsQR) (Apache-2.0), [PeerJS](https://github.com/peers/peerjs) (MIT).

QR: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluido en `index.html`.
