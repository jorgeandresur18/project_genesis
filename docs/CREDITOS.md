# Créditos de terceros

Lo que el juego usa y no hizo el autor. Para que quede constancia de dónde salió cada cosa y bajo qué condiciones.

## Música

| Archivo en el juego | Tema | Autor | Fuente | Licencia (según la fuente) | Dónde suena |
|---|---|---|---|---|---|
| `public/audio/musica/combate_arcade.mp3` | Battle Arcade (16-Bit Arcade) | Panda Beats - No Copyright Music | https://www.youtube.com/watch?v=v9cb0DOVBHA (canal: https://www.youtube.com/@PandaBeatsMusic) | «No Copyright Music» en el título del video | Pelea con Nikki en el bar y el jefe del Bastión (el monstruo de sombras) |

Notas:
- El original lo descargó el autor (`docs/combate nikki.mp3`, no se publica). El del juego es una versión comprimida
  para que suene más «16 bits»: mono, 22 kHz, un poco de bitcrush y filtro de agudos, 64 kbps (ffmpeg: `aresample=22050,acrusher=bits=10:mode=lin:aa=0.5:samples=1:mix=0.6,lowpass=f=7500`).
- `TODO(canon)`: antes de publicar, revisar en la descripción del video las condiciones exactas del autor (si pide
  mencionarlo en los créditos del juego y cómo). Si hay que mostrarlo dentro del juego, iría en «Conoce más del
  proyecto» (el único lugar con nombres reales).
