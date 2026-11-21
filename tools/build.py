#!/usr/bin/env python3
"""Construye carta/index.html (archivo único) a partir de src/ y vendor/."""
from pathlib import Path
R = Path(__file__).resolve().parent.parent
fix = lambda s: s.replace('</script', '<\\/script')
head = (R / 'src/head.html').read_text(encoding='utf-8')
for marca, lib in [('/*__QRLIB__*/', 'qrcode.js'), ('/*__JSQR__*/', 'jsqr.min.js'), ('/*__PEER__*/', 'peerjs.min.js')]:
    head = head.replace(marca, fix((R / 'vendor' / lib).read_text(encoding='utf-8')))
orden = ['partA.js', 'b1_core.js', 'b1b_draw.js', 'b2_rpg.js', 'b13_curva.js', 'b8_civ.js', 'b10_fac.js', 'b11_base.js', 'b3_game.js', 'b14_3d.js', 'b6_plan.js', 'b7_net.js', 'b9_dm.js', 'b4_ui.js', 'b12_inicio.js', 'b5_share.js']
js = ''.join((R / 'src' / f).read_text(encoding='utf-8') for f in orden)
(R / 'carta').mkdir(exist_ok=True)
(R / 'carta/index.html').write_text(head + '<script>\n' + js + '</script>\n</body>\n</html>\n', encoding='utf-8')
print('carta/index.html:', (R / 'carta/index.html').stat().st_size, 'bytes')
