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

## Director de partida
- **Crear partida** (pestaña Sesión): el anfitrión es el director. Puede **fijar la tripulación** con una credencial; sólo entran
  quienes suban una credencial de esa tripulación (el resto es rechazado). El logo de la tripulación se toma de la credencial
  y se muestra en la cabecera y junto a la nave; las fotos de los personajes se usan en sus fichas.
- **Decisiones por rol**: cada evento lo decide el jugador cuyo personaje tiene el rol de la habilidad en juego (p. ej. el de
  Ingeniería en una avería); el director puede imponer otra opción. También puede hacer que vote toda la tripulación o decidir él.
- **Rumbos**: cada viaje o plan pregunta al director si lo decide él o lo somete a votación de todos.
- **📜 Registro**: ventana flotante, movible y ocultable con todo lo que pasa (eventos, tiradas, votos, chat, llegadas).
- **🖥 Doble pantalla**: el panel con métricas e información se abre en otra ventana (para otro monitor) y esta queda con el
  mapa y los mensajes de la partida.

## Cambio de tripulación
- **Credenciales traspasadas (Members → Carta).** Cuando un personaje cambia de crew en Members, su credencial nueva trae en
  `x` la clave `tr=<nº de traspasos>.<ID de miembro anterior>.<crew anterior>`. Si en la partida ya hay un tripulante con ese ID
  anterior, la Carta lo trata como la **misma persona**: no lo duplica, actualiza su ID de miembro y su crew, y su ficha muestra
  «🔀 traspasado desde <crew>». El QR de fin de misión usa el ID nuevo y conserva `tr`.
- **Tripulación fijada (crewLock).** Sólo cuenta la crew de la credencial que se sube: un personaje recién traspasado a la crew
  fijada entra sin problema; su credencial antigua (de la otra crew) se rechaza.
- **Una ficha, un jugador.** Si un tripulante ya está a bordo y lo maneja alguien conectado, nadie más puede subir la misma
  ficha. Si es el mismo dispositivo que vuelve (recargó la página), toma el relevo y la conexión vieja se cierra.
- **Dentro de la partida (bases y colonias).** Con la nave en el sistema de una base, el director usa «⇄ Cambio de tripulación»
  (pestaña Bases): deja a un tripulante en la base (queda fuera de la ronda, como en animación suspendida, pero sin ocupar litera
  ni comer de la nave), lo recoge después o lo intercambia con alguien de a bordo o de la tripulación general. Quien está en una
  base aparece en Tripulación → «🏠 En bases y colonias».

## Sala en tiempo real y votaciones
- El anfitrión envía la partida con cada cambio y, además, cada 3 s: los invitados ven el mapa, la nave y las pestañas al
  momento, sin recargar (un panel no se repinta mientras se escribe en él).
- Las conexiones colgadas se quitan solas de la sala y de las votaciones (antes, un invitado que recargaba dejaba un
  «jugador sin ficha» y las votaciones esperaban su voto).
- **Votaciones en pantalla grande** para todos en cuanto se abren, aunque haya otra ventana abierta; se pueden ocultar y siguen
  en Sesión. Cuando han votado todos, se cierran a los **3 s**. **El capitán tiene la última palabra:** puede imponer cualquier opción.
- **👁 Seguir al capitán** (Sesión, invitados): la cámara, el mapa y el sistema siguen a los del anfitrión.
- Los avisos de la bitácora y de misión cumplida salen en ventana a todos; al cerrar la misión cada jugador recibe el aviso con
  **«Abrir mi ficha»**, y el enlace a su ficha actualizada queda guardado en el dispositivo (pantalla de inicio → «Tu última partida»).

## Otros cambios
- **Historia sin bloqueos:** los logros (salir del Sol, recolectar, llegar a Tau Ceti, explorar Adrian, entrar en 40 Eridani) se
  recuerdan aunque su misión todavía no toque; llegar antes a Tau Ceti ya no deja la historia atascada.
- **PNJ:** cuando alguien pide unirse (rescates, expediciones, 40 Eridani) se decide (o se vota) si sube.
- **Combustible:** las naves gastan un 40 % menos por año luz.
- **Estadísticas altas:** si una barra pasa de 12 se vuelve a llenar encima con otro color y marca ×2, ×3…
- **◈ Holograma:** el mapa en 4 vistas giradas hacia el centro, para una pirámide holográfica casera.

## Motor de curvatura
- Cada salto gasta **materia** (t) y **energía negativa** (EN). La materia se extrae en cualquier sistema (⛏, 15 días; más con
  planetas y cinturones). La energía negativa sale de **estrellas muertas** (enanas blancas, estrellas de neutrones) y
  **agujeros negros** (20 días), de los **contratos** (cada uno paga EN además de minerales), de algunos eventos y de las
  **estaciones de comercio**. Saltar desde o hacia un **agujero negro no gasta nada**.
- **Aditamentos** (se compran e instalan en las estaciones; de 1 a 4 huecos según la nave): tanque de energía ampliado, bodega
  de materia, bobinas de curvatura afinadas (−20 % de consumo), colector de materia, invernadero estelar, blindaje reforzado,
  reciclador de provisiones, sensores de largo alcance y módulo de hábitat adaptable.
- **Estaciones de comercio** en uno de cada cuatro sistemas (y en la Tierra): compran y venden con minerales energía negativa,
  materia y provisiones, e instalan aditamentos. Los precios cambian por estación.
- **Cultivar con luz estelar** (🌱, 15 días): comida según la luminosidad de la estrella y los planetas con atmósfera.
- **Encuentros con otras naves:** mercantes que proponen trueques, piratas, naves en apuros, exploradores científicos y naves a la deriva con aditamentos.

## Plaga, estrellas muertas y supernovas
- La **plaga** se configura al crear la partida: se puede desactivar y cambiarle el nombre (por defecto, Astrófago).
- Se **propaga en tiempo real** (cada 10 s reales avanzan 2 días de su ciclo, además de los días a bordo). Su población y la de
  su **depredador** se controlan entre sí (Lotka-Volterra) y oscilan; donde vive el depredador no prospera y algunos sistemas son
  **inmunes** (como Tau Ceti). La pestaña Carta muestra las dos poblaciones; «Petrova» pinta las estrellas infectadas.
- **Supernovas:** de vez en cuando (por tiempo real y por días a bordo) una estrella masiva cercana colapsa y explota. Si estáis
  cerca la onda de choque daña la nave; deja una estrella de neutrones o un agujero negro.
- **Agujeros negros** (⚫ con disco) y estrellas muertas se ven en la carta y en el sistema.

## Tripulación y rol
- **Bonos de rol:** cada tripulante tiene +1 en la estadística de su rol, y cada rol activo aporta a la nave (Pilotaje: menos
  consumo; Ingeniería: reparaciones y casco; Ciencia: extracción; Medicina: curación; Seguridad: encuentros hostiles;
  Diplomacia: precios). Se ven en la pestaña Nave.
- **Tolerancias:** cada nave acomoda mejor a unas especies (p. ej. el caza no va bien para osos, dragones, ciervos y tigres).
  Quien viaja incómodo tiene −1 en todo y pierde moral; el módulo de hábitat lo arregla.
- **Pestaña «Mi ficha»:** tu personaje en tiempo real (salud, moral, XP, estadísticas, equipo, días de vuelo).
- **Recién llegados:** quien se une con la ronda en marcha espera en el sistema más cercano de la facción dominante de la nave;
  sube a bordo al llegar allí.
- **Hambruna:** sin comida, sólo el capitán puede proponer una medida de emergencia (sacrificar a un tripulante para alimentar
  al resto). Se vota y sólo se aplica si se aprueba.

## Mundo continuo: del sistema a la superficie sin cortes
- **Un solo zoom** recorre todo, como en No Man's Sky: vista del sistema → el planeta llena la pantalla → se atraviesan las
  nubes → la superficie vista desde arriba, hasta unos cientos de metros. Rueda, pellizco o los botones + / − del mapa.
  Elige un planeta (clic o lista del panel) y acerca; arrastrar gira el sistema o el planeta y, en la superficie, la recorre.
- **Aterrizaje y despegue automáticos:** al bajar de la capa de nubes la nave se posa (en suelo firme, el más cercano) y al
  subir despega. «Volver» y «Despegar» hacen el camino inverso con el mismo zoom. Desde otro sistema la vista es de sondeo:
  se llega hasta la órbita, pero para descender hay que viajar allí. Los gigantes gaseosos no tienen superficie.
- **Planetas como esferas con textura procedural** (relieve, mares, casquetes, nubes que se mueven, atmósfera con su color)
  y luz desde su estrella. La superficie usa **la misma función de relieve** que la esfera, así que lo que se ve desde la
  órbita es lo que se encuentra al bajar.
- **Escáner de terreno cenital** que siempre cubre la pantalla (nunca se ven bordes): se genera por partes mientras se baja,
  con relieve sombreado (luz del noroeste, exageración ×3), escala, altitud, coordenadas y el bioma bajo la retícula.
- **Terrenos según las condiciones del planeta:** océanos con plataforma y fondo, playas, praderas, bosques, desiertos,
  tundra, nieve por latitud y altitud (con efecto invernadero de la atmósfera), montañas; mundos de lava con ríos
  incandescentes y costra enfriada; desiertos con dunas; mundos helados con mar congelado; mundos congelados con hielo de
  nitrógeno, tolinas y lagos de metano; mundos estériles con cráteres a varias escalas (perfil de cuenco y borde).
- **Flora y fauna según la biosfera:** el color de la vegetación depende del tipo de estrella (rojo oscuro en enanas M,
  ocre en K, verde en G, azulado en F/A). Bosques y matorrales vistos desde arriba, algas en los bajíos, rocas y cantos en
  todos los mundos sólidos, respiraderos de lava que laten, manadas que se desplazan, bancos de peces y bandadas. Los
  paneles del planeta y de la superficie describen la flora y la fauna detectadas.

## Sistemas estelares realistas (no planos)
- **Órbitas keplerianas en 3D** con excentricidad, inclinación, nodo y perihelio; cada cuerpo se mueve según la tercera ley
  de Kepler. Las excentricidades siguen la distribución medida en exoplanetas por velocidad radial (Kipping 2013,
  Beta(0,867; 3,03)) y las inclinaciones mutuas la de los sistemas múltiples de Kepler (Fabrycky et al. 2014, Rayleigh σ≈1,5°).
- **El Sistema Solar usa sus elementos orbitales reales (J2000)** y sus lunas principales (Luna, Fobos, Deimos, los
  galileanos, Titán, Rea, Jápeto, Titania, Oberón, Tritón) y el cometa Halley.
- **Cinturones en 3D** con dispersión de inclinación (cinturón interior σ≈7°, exterior tipo Kuiper σ≈12°) y composición de
  los asteroides C/S/M (≈75/17/8 %, como el cinturón principal), **cometas** de periodo corto y largo con cola opuesta a la
  estrella, y **lunas** con sus propias órbitas alrededor de cada planeta.
- Panel de cada planeta: excentricidad, inclinación y lunas mayores.

## Fin de misión → Credenciales
Al cerrar una misión, la Carta muestra **un QR general** (enlace `credenciales/#X…`, versión 2). Cada jugador lo escanea
desde Credenciales («Actualizar → Escanear QR de la misión») y después su credencial: se renueva con estadísticas, nivel,
tiempo de vuelo (`fv`) y misiones (`ms`); cada misión (`mi`) sólo se aplica una vez.

---

## Carta de Navegación Estelar

Simulador de rol espacial en un único `index.html` estático, sin servidor ni cuenta. La estética sigue la carta
«Hail Mary – Stellar Navigation Chart» (valhovey.github.io/gaia-mary): fondo de cielo completo con la Vía Láctea,
rejillas en perspectiva, nombres en mayúsculas con línea guía, trayectorias en arco y modo Petrova (estrellas con la plaga en rojo).
Las estrellas se generan de forma determinista; el vecindario del Sol usa RA/Dec/distancia reales (eclíptica J2000).

## Carta
- Cámara libre y suave: arrastrar = orbitar · Shift/botón derecho/dos dedos = desplazar · rueda/pellizco = zoom
  (1 al – 3 000 al) · WASD/flechas = volar · Q/E = bajar/subir · Inicio = tu nave · M = panel · Intro = viajar.
- Interruptores Navegación (líneas de visión), Color (espectral) y Petrova (marca las estrellas con la plaga).
- Movimiento libre: «⌖ Destino» fija como destino cualquier punto del espacio (la retícula central) y «✈ Pilotar» (F) mueve la nave a mano con WASD, Q/E y Shift. La nave puede detenerse en el espacio profundo. En modo creativo no hay límite de distancia por salto.
- Vistas: Sistema Solar, Trayectoria (ruta hacia Tau Ceti), Tau Ceti y Galáctica.
- Semillas `CABECERA-DETALLE`: la cabecera (A…Z, AA, AB…) numera sectores de 240 al en capas alrededor del Sol, sin borde;
  cada carácter de detalle (0-9, A-Q) afina la posición; 14 caracteres identifican una estrella.

## Viaje
- Cálculo relativista con aceleración constante y volteo a mitad de camino: tiempo a bordo, tiempo en la Tierra,
  velocidad máxima y factor γ. La materia y la energía negativa consumidas dependen de la distancia; las provisiones, de la tripulación y del
  tiempo a bordo (×0,15 con hibernación en cápsulas de coma, con riesgo al despertar).
- Rutas automáticas con A* cuando el destino supera el alcance por salto (hasta 400 al por plan).
- 8 naves con tamaño real (de 7 m a 2,4 km), comparadas con objetos conocidos; astillero en el Sistema Solar.

## Rol
- Tripulación con especie, rol, seis estadísticas, rasgo, salud, moral, experiencia, nivel y biografía.
- Eventos aleatorios con decisiones y tiradas (1d10 + habilidad contra dificultad) en tránsito y al llegar.
- Sistemas: extraer materia, recolectar energía negativa (estrellas muertas y agujeros negros), cultivar con luz estelar, comerciar en estaciones, descansar, reparar, escanear planetas y reabastecer en la Tierra.
- Aterrizaje (o lanzadera en naves grandes): atmósfera, gravedad, temperatura, condiciones anómalas y puntos de interés;
  expediciones con equipo elegido, botín, heridas y experiencia.
- Misiones con historia: Primer salto → La línea Petrova → Destino: Tau Ceti → Superficie de Adrian → El eco de 40 Eridani…
- Modo creativo y rescate si te quedas varado.

## Plan de viaje
Pestaña «Plan»: paradas en orden (estrellas o puntos libres) con tareas en cada una: extraer materia, recolectar energía negativa, cultivar con luz estelar, descansar,
reparar, escanear, aterrizar y explorar un planeta, contactar una civilización o reabastecer en la Tierra. Calcula las rutas
entre paradas, estima combustible y provisiones con las tareas incluidas y lo ejecuta solo (pausando en los eventos).

## Civilizaciones y lore
Cada planeta puede albergar una civilización según sus condiciones (zona habitable, atmósfera, gravedad, tipo de estrella) y
la semilla: especie, nivel tecnológico (de ruinas extintas a interestelar), gobierno, disposición, población, valores e
historia generada con datos del entorno (planetas vecinos, estrellas cercanas). Se puede contactar (tirada de Diplomacia),
comerciar, aprender y reclutar según la reputación. Cada sistema tiene además su propio lore.

## Inicio y espera de tripulación
- Al abrir la Carta aparece una **pantalla de inicio** antes del mapa:
  - **Continuar** la partida guardada en el dispositivo (con su resumen), empezar una **nueva** (con o sin PNJ generados) o **cargar un archivo** `.partida`.
  - Elegir si se juega **en este dispositivo** o se **crea una sala como director**, o **unirse a una sala** con código.
  - Los enlaces `#d=` (partida) y `#s=` (semilla) saltan esta pantalla, y `#sala=` la abre con el código ya puesto.
- **Espera de tripulación:** la ronda no empieza hasta que hay al menos **1 tripulante con credencial activo**.
  - Hasta entonces se puede mirar la carta, pero no viajar, pilotar, aterrizar ni hacer acciones en sistemas, bases o contratos.
  - Un aviso permite subir credenciales y, cuando hay alguien, pulsar **▶ Empezar la ronda**. Lo hace el director, o el propio jugador si juega solo; los jugadores de la sala ven «Esperando al director».
  - La ronda se vuelve a pedir cada vez que se abre la Carta.

## Facciones y contratos
- **Seis facciones** con territorio propio: Corporación Ad Astra, Liga de Comerciantes Libres, Manada de Hierro, Círculo de la Estrella Oscura, Corsarios del Vacío y Custodios del Archivo. El mapa político sale de la semilla, y el botón **⬡ Facciones** colorea las estrellas y marca sus núcleos.
- **Afiliación y reputación:** la tripulación puede ser miembro de varias facciones. Para unirse hace falta reputación 40, y sus enemigas lo notan.
- **¿Saben quiénes sois?** Cada encuentro tira para comprobar si os reconocen. La afiliación, la fama y **cada objeto de una facción a bordo** suben la probabilidad, aunque no seáis de ella. Según lo que sepan, el encuentro es amistoso, neutral u hostil: huir, plantar cara, sobornar, arrojar lo que os delata, mostrar un salvoconducto, hacerse pasar por otra facción…
- **Contratos aleatorios:** cada sistema tiene un tablón que se renueva cada 120 días a bordo. Hay entregas, contrabando, rescates, reconocimiento, diplomacia, caza, sabotaje y recuperación de reliquias, con plazo, pago, reputación y a veces objetos. Las misiones de historia siguen en la Bitácora.

## Inventarios
- **Bodega de la nave** (pestaña Nave) y **inventario de cada tripulante** (pestaña Tripulación, con un máximo de 6 objetos). Los objetos se pasan de uno a otro con «Dar a…».
- El equipo que lleva encima un tripulante le da +1 a su estadística (máximo +2). Cada tripulante empieza con el equipo de su rol.
- Todo lo que hay a bordo, en la bodega o encima de alguien, puede delataros. La Manada registra bodega y bolsillos.

## Bases, colonias y logística
- Se construyen desde el panel de un planeta en órbita: mina, extractor de materia, granja hidropónica o puesto avanzado. Cuestan 40 t y 20 días, y llegan hasta nivel 3.
- Producen con el tiempo de a bordo según la riqueza del planeta (minerales, materia, alimento), que sale de la semilla y **puede ser nula**.
- Los **envíos** viajan en tiempo real a **1 año luz cada 5 segundos** (mínimo 5 s): de una base a la nave o de una base a otra.
- Las **rutas automáticas** envían recursos de X a Y cada N días a bordo o cada N minutos reales, por ejemplo para que una colonia te mande recursos con regularidad. Se ven en el mapa y en la pestaña **Bases**.

## Votos y dados
- El capitán elige en la pestaña Sesión si los votos son **públicos** (se ve quién votó qué) o **anónimos** (solo el recuento). Cada jugador vota desde su dispositivo.
- **Dado de fortuna:** en los eventos con prueba de habilidad, cada jugador puede tirar 1d6 una vez: 1 → −2, 2 → −1, 3-4 → 0, 5 → +1, 6 → +2. La suma, de −3 a +3, se aplica a la tirada.

## Animación suspendida
- Si un jugador no puede estar en la ronda, su personaje pasa a **animación suspendida**. Se hace desde su ficha en Tripulación o, como director, desde la lista de jugadores en Sesión. Si un jugador se desconecta, el director recibe un aviso con el botón **❄ Suspender**.
- Mientras duerme sigue a bordo y su equipo cuenta para que os reconozcan. No tira, no decide por su rol (la decisión pasa a otro), no recibe daño ni XP y gasta un 15 % de provisiones. Sigue ocupando su litera.
- No se puede suspender a nadie si la nave se queda sin la tripulación mínima.
- Despierta con **☀ Despertar** o solo, cuando su jugador vuelve a subir su credencial a la sala. Al cerrar la misión su ficha se actualiza igual, con el tiempo de vuelo incluido.

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
