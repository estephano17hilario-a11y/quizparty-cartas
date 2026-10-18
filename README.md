# QuizParty + Cartas QR

Quiz en vivo estilo Kahoot y creador de cartas con QR decorado, con base de datos SQLite propia en tu servidor.

## Cómo funciona

- **Una sola sala.** Entras con un nombre de usuario:
  - `gianelletecprata18` → **anfitrión** (pide el PIN si configuraste `ADMIN_PIN`).
  - Cualquier otro nombre → **jugador** de la sala.
- **Anfitrión**
  - 🎮 **Juego**: elige un quiz, marca qué preguntas entran, el tiempo de cada una y si empieza manualmente o a una fecha y hora programadas. Controla la partida en vivo (empezar, saltar, terminar, sacar jugadores).
  - ❓ **Preguntas**: crea y edita quizzes (2 a 4 opciones, tiempo y puntos por pregunta).
  - 🃏 **Cartas**: cada carta es un lienzo libre, como una carta de papel de verdad. Se abre `/c/<id>` al escanear su QR.
    - **33 diseños listos por categoría** (amor, boda, fiesta, vintage, elegante, naturaleza, mágico, divertido, ocasiones…) para empezar, y todo se puede cambiar.
    - **Papel**: fondos, degradados, foto de fondo, texturas reales (papel, lino, kraft, cartulina), patrones, viñeta envejecida, brillo satinado, esquinas.
    - **Elementos que arrastras, escalas y giras**: textos (14 tipografías, relleno dorado/plata/holográfico, texto curvo, relieve, contorno), fotos (formas de corazón/círculo/arco…, polaroid, cinta, filtros vintage), stickers y emojis, formas, sello de lacre y cinta washi. También **marcos** (dorado, doble, ornamental…), capas, deshacer/rehacer, atajos de teclado y pegar/arrastrar fotos.
    - **Reverso**: la carta se puede voltear (dedicatoria, QR por detrás…).
    - **Extras al abrir el enlace**: llega dentro de un **sobre con sello** que se abre, inclinación 3D con brillo, y lluvia de emojis. Quien abre la carta puede **descargarla como imagen PNG (frente y reverso)**.
    - **El QR es un elemento más de la carta**: lo colocas donde quieras y lo decoras: forma de puntos (cuadrados, círculos, corazones, rombos), esquinas, colores, degradado, marco, **imagen o logo en el centro**, **foto detrás**, y el **nombre** debajo con la tipografía que quieras.
    - Selecciona varias cartas → **Imprimir**: elige entre **las cartas completas** (frente, reverso o doble cara) o **solo el QR de cada carta** (con el estilo que le diste), con tamaño, papel, orientación, margen, separación, copias y guías de corte. Todo proporcionado (o guarda como PDF).
  - 📊 **Historial**: resultados de cada partida terminada.
- Todo se guarda en `data/app.db` (SQLite).

## Instalar en el VPS

Desde tu computadora, dentro de esta carpeta:

1. Edita `ecosystem.config.js`: pon tu `ADMIN_PIN` y, si quieres, la `PUBLIC_URL` (la dirección que irá dentro de los QR).
2. Ejecuta `./deploy.sh root@89.117.73.97`

Instalación manual en el servidor (equivale al script):

```bash
cd /opt/quizparty
npm install --omit=dev
npm i -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup
ufw allow 3000/tcp   # si usas ufw
```

Para probar en local: `npm install && ADMIN_PIN=1234 node server.js` y abre http://localhost:3000

## Variables de entorno

| Variable | Para qué sirve | Por defecto |
|---|---|---|
| `PORT` | Puerto | 3000 |
| `ADMIN_USER` | Nombre que entra como anfitrión | gianelletecprata18 |
| `ADMIN_PIN` | PIN extra para el anfitrión (recomendado) | vacío = sin PIN |
| `PUBLIC_URL` | URL pública que llevan los QR | la que use el navegador |
| `DB_FILE` | Ruta de la base de datos | `data/app.db` |

## Importante

- **Los QR impresos apuntan a `PUBLIC_URL`.** Si más adelante cambias de dirección, los QR ya impresos seguirían apuntando a la anterior. Si puedes, usa un dominio fijo (con HTTPS vía Caddy o nginx) antes de imprimir en serio.
- **Sin PIN, cualquiera que escriba el nombre del anfitrión controla todo.** Define `ADMIN_PIN`.
- Respaldo: copia el archivo `data/app.db`.
- Las fotos de las cartas se guardan dentro de la base de datos (se reducen a ~1100 px). Si guardas una carta con muchas fotos y falla con error 413, sube el límite de tu proxy (en nginx: `client_max_body_size 20m;`).
- Requiere Node 18 o superior.
