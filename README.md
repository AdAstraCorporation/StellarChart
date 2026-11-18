# Carta Estelar de Semillas · Ad Astra

Herramienta web estática (un solo `index.html`, sin servidor ni cuenta) para explorar un mapa espacial 3D, infinito y
generativo, inspirado en la carta de navegación de *Proyecto fin del mundo* (*Project Hail Mary*) y en
[valhovey.github.io/gaia-mary](https://valhovey.github.io/gaia-mary/). Los datos de Gaia no se cargan: las estrellas se
generan de forma determinista; solo el vecindario del Sol (Sol, Alfa Centauri, Barnard, Sirius, Epsilon Eridani, Procyon,
Tau Ceti, 40 Eridani, Vega) usa RA/Dec/distancia reales, en eclíptica J2000 centrada en el Sol.

## Semillas: `CABECERA-DETALLE`
- **Cabecera**: letras A-Z como columnas de hoja de cálculo (A…Z, AA, AB, AC…, AAA…). Numera sectores cúbicos de 240 al en
  capas concéntricas alrededor del Sol (`A` = sector del Sol). El mapa no tiene borde; la cabecera crece con la distancia.
- **Detalle**: cada carácter (`0-9`, `A-Q`) elige 1 de 3×3×3 subceldas. 1 → 80 al · 3 → 8,9 al · 6 → 0,33 al · 9 → ~12 000 UA…
  hasta 18 caracteres. Con ~14 una celda aísla una estrella (su semilla canónica) y se puede entrar a su sistema.
- Sin guion, la cabecera es la racha inicial de letras (`AB7K` = sector AB, detalle 7K); con guion es explícito (`AB-7K`).

## Uso
Arrastrar = orbitar · rueda/pellizco = zoom · clic en una celda = añade su carácter · flechas/RePág = celdas vecinas ·
Retroceso = subir · Inicio = centrar en la nave · botones Sol / Trayectoria / Tau Ceti / Sector, ruta Sol→Tau Ceti y color espectral.

## Nave 3D
Pestaña «Nave»: 8 diseños prehechos en malla 3D (vista previa giratoria), nombre y dos colores. La nave tiene posición propia:
se queda donde la dejas («Mover mi nave aquí») y viaja contigo al entrar a un sistema. Si te alejas, una flecha en el borde
indica dónde está; **◎ Centrar** (o `Inicio`/`.`) hace un vuelo animado (subiendo y bajando de nivel, con salto warp si cambia
el sector) y muestra la zona cercana.

## Partida (archivo)
«Compartir → Descargar partida» genera un archivo binario sin formato legible (`ADA` + versión + deflate + CRC32) con toda la
sesión: bitácora, nave y posición, apodo, cámara y opciones. «Cargar partida…» o arrastrarlo a la ventana lo restaura
(fusionar o reemplazar; detecta archivos dañados).

## Historial y traslado
- Bitácora en `localStorage` (favoritos, notas, modo «no registrar»).
- «Compartir» genera un enlace (`#d=…`, deflate + base64url) y un QR que recrean historial, apodo y nave; también JSON.
- Al abrir un enlace se ofrece Fusionar / Reemplazar / Cancelar. Para que el QR funcione en otro dispositivo, publica el
  archivo (p. ej. GitHub Pages, gratis) y escribe esa URL en «Compartir».

QR: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluido dentro de `index.html`.
