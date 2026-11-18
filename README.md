# Explorador de Semillas · Ad Astra

Herramienta web estática (un solo `index.html`, sin servidor ni cuenta) para explorar un mapa espacial generativo
inspirado en el mapa estelar de *Proyecto fin del mundo* (*Project Hail Mary*): Sol, Tau Ceti, 40 Eridani,
Epsilon Eridani, Sirius y Alfa Centauri son las anclas; el resto del espacio se genera de forma determinista.

## Semillas
- Alfabeto de 36 símbolos (`0-9A-Z`). Cada carácter elige una celda de una rejilla 6×6 dentro de la celda anterior.
- 1 letra ≈ 683 al · 3 ≈ 19 al · 6 ≈ 0,09 al · 9 ≈ 25 UA · hasta 14 caracteres.
- Sin límites: el plano se repite en teselas de 4096 al. `3,-2/7K3Q9` = tesela (3,-2) + semilla `7K3Q9`.
- A partir de ~10 caracteres una celda aísla una sola estrella; desde ahí se puede entrar al sistema planetario.

## Historial y traslado
- Bitácora local en `localStorage` (favoritos, notas, modo «no registrar»).
- «Compartir» genera un enlace (`#d=…`, deflate + base64url) y un QR que recrean todo el historial; también hay JSON.
- Al abrir un enlace se ofrece Fusionar / Reemplazar / Cancelar; nunca se sobrescribe sin preguntar.
- Para que el QR funcione en otro dispositivo, publica el archivo (p. ej. GitHub Pages, gratis) y escribe esa URL en «Compartir».

## Créditos
QR: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluido dentro de `index.html`.
Las posiciones de las anclas son aproximadas y esquemáticas; los planetas de Tau Ceti y 40 Eridani marcados como «ficción» vienen de la historia.
