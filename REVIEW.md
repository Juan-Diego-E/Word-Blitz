# REVIEW — Rediseño Clay

Revisión crítica previa a la integración. **No se escribió código de producción.**

---

## 0. Qué pude leer y qué no

El brief pide confirmar que leí los cuatro documentos y el artefacto. No puedo
confirmarlo: **ninguno de los cuatro existe en el repositorio.**

```
$ ls *.md claude/
README.md          ← lo único que hay
claude/            ← no existe
```

| Documento | Estado real |
|---|---|
| `BRAND.md` | **Leído** — pegado íntegro en el mensaje |
| `claude/DESIGN-CLAY.md` | **Leído** — pegado íntegro en el mensaje |
| `DATA.md` | **No lo vi.** Ni en el repo ni en el mensaje |
| `CONTEXT.md` | **No lo vi.** Ni en el repo ni en el mensaje |
| Artefacto `539956c3…` | **No pude abrirlo.** Las URLs de artefacto de claude.ai no son accesibles desde mi navegador de herramientas; devuelve "Page not found" |

Consecuencia concreta: **la sección 3 no puede cumplir la parte de `DATA.md` ni la de
`CONTEXT.md`.** Dejo abajo el inventario real de tipos para que quien tenga esos
documentos haga el cruce en un minuto.

**Sustitución de herramienta.** El brief pide Playwright; no está instalado. Usé el
navegador integrado con el mismo build (`vite build` + `vite preview` en :4173) y
las mismas APIs (`getBoundingClientRect`, `getComputedStyle`, `scrollHeight`). Para
todo lo geométrico y tipográfico es equivalente. **La excepción está declarada en
C-01: no muestreé píxeles, computé la composición de capas.**

---

## 1. Mediciones reproducidas

Build: `vite build` sobre `4b9c611` ("Nuevo modo Órbita") — el commit que la
auditoría dice haber medido. Preview en `localhost:4173`.

### Encaje en pantalla (C-02)

| Medición | Documento | **Mío** | Δ |
|---|---|---|---|
| 360×640 · `scrollHeight` | 940 px | **937 px** | 3 |
| 360×640 · `scrollY` tras bajar al juicio | 300 | **297** | 3 |
| 360×640 · `.roulette` / `.timer-ring` `top` | −276 | **−273** | 3 |
| 390×844 · `scrollHeight` | 966 px | **963 px** | 3 |
| 390×844 · recorte del ranking | 98 px | **95 px** | 3 |

**Confirmado.** Tres píxeles de diferencia en cinco cifras independientes.

**Refinamiento que agrego.** El documento dice que la letra y el cronómetro "salen
de cuadro". Es cierto, pero *solo después de que el moderador baja para alcanzar
SÍ/NO*. Con `scrollY = 0` a 360×640:

```
.roulette    top   24 → bottom  100   visible
.card        top  189 → bottom  563   visible
.judgement   top  587 → bottom  651   NO visible (11 px por debajo del pliegue)
```

Y el dato que cambia el diagnóstico: **el trío esencial necesita 627 px y el
viewport tiene 640.** Cabe. Lo que empuja el documento a 937 px es el podio.
El problema no es que el juego sea demasiado grande: es que el ranking completo
compite con los controles por el mismo pliegue. Esto respalda exactamente la
solución propuesta en PR 2 (ranking colapsado a chips) y le pone número.

### Contraste de la categoría (C-01)

Mecanismo verificado sobre el render:

```
.card::before   conic-gradient(#ff4545,#00ff99,#006aff,#ff0095)
                animation spin-angle 10s · opacity .5 · blur(16px) · z-index −1
.card::after    mismo conic · opacity .4 · z-index −1
.card__face--front
                backdrop-filter: blur(14px)
                background: linear-gradient(160deg, #ffffff24, #ffffff0d)
                background-color: transparent
```

La cara que muestra la categoría es **blanco al 14 %→5 % y nada más**. Debajo hay un
gradiente cónico saturado girando a 10 s. El contraste del texto es una función del
tiempo, tal como afirma el documento.

| | Documento (muestreado) | **Mío (computado)** |
|---|---|---|
| Rango | 3,10 – 5,46 | **2,90 – 5,39** |
| Peor posición | — | `#00ff99` → **2,90** |

**Confirmado.** No muestreé píxeles —mi herramienta no lee el framebuffer—, computé
la composición real de las capas con sus opacidades y el fondo bajo la carta
(`rgb(13,77,131)`). Que dos métodos distintos caigan a 0,2 del mismo rango es la
mejor evidencia disponible de que el hallazgo es sólido.

### CTA (C-03)

`#FFFFFF` sobre `#f5550e` = **3,39:1**. Idéntico al documento. Falla AA para texto
normal (4,5) y también para texto grande (3:1) por poco margen — el botón usa 600 de
peso a 16 px, así que aplica el umbral de 4,5.

### TV (C-05)

| Elemento | Documento | **Mío** |
|---|---|---|
| `.tv__room` | 16 px | **16 px** |
| `.tv__idle-hint` | 16 px | **16 px** |
| `.tv__fallback` | 16 px | **16 px** |
| `.podium--tv .podium__row` | 28,8 px | **28,8 px** |
| `padding` de `.view` | 24 px | **24 px = 1,25 %** |

**Confirmado exacto.** El 5 % pedido serían 96 px laterales / 54 px verticales. El QR
está fijo en **220 px** sobre 1920 — 11 % del ancho.

### Peso y complejidad (A-09, A-10)

| | Documento | **Mío** |
|---|---|---|
| `logo.png` | 368 KB | **359,6 KB** (copia con hash en `dist/`) |
| `favicon.ico` | 270 KB | **264,1 KB** |
| JS | 348 KB | **346,1 KB** |
| `backdrop-filter` | 9 | **9** |
| animaciones | 10 | **10** |
| `mix-blend-mode` | 1 | **1** |
| `setInterval` 100 ms | sí | **sí** (`useTimer.ts:29`) |

**Confirmado.** Dato extra: el total de imágenes en `public/` + logo suma **1,16 MB**
contra 346 KB de JS. El objetivo de PR 5 (bajar ~600 KB) es alcanzable solo con
`favicon.ico` (264 KB) y `logo.png` (360 KB).

### Los tokens propuestos

Verifiqué **todos** los contrastes que `BRAND.md` declara para el sistema Clay:

| Par | Declarado | **Mío** |
|---|---|---|
| `#EAFBFF` / `#08768F` | 4,94 | **4,94** |
| `#EAFBFF` / `#05586C` | 7,54 | **7,54** |
| `#04222B` / `#4FD8F5` | 9,83 | **9,83** |
| `#04222B` / `#17B2D8` | 6,62 | **6,62** |
| `#2FCBEF` / campo `#EDEFF4` | 1,67 | **1,67** |
| `#07708A` / campo `#EDEFF4` | 4,94 | **4,94** |

**Los seis dan exacto.** La aritmética del sistema es correcta; mis objeciones de la
sección 4 no son sobre los números sino sobre las conclusiones que se sacan de ellos.

---

## 2. Lo que ya no aplica

### C-04 — **cerrado.** No reproduce.

El documento afirma: *"El código de sala de la TV nunca supera 2,75:1. Falla incluso
el umbral de texto grande."*

Medido sobre el mismo build:

```
.tv__code   color rgb(255,162,116) = #ffa274   font-size 112px
            contraste sobre el fondo de la app        4,63:1
            contraste incluyendo el vidrio de .tv__join  3,57:1
            umbral aplicable (112 px)                  3:1  → PASA
```

La cifra 2,75 corresponde al estado **anterior** al commit `8599b65` ("Invertir el
gradiente para que el texto pase WCAG AA"), que cambió `.tv__code` de
`--color-tangelo` (`#f5550e`) a `--color-tangelo-text` (`#ffa274`) **y** oscureció el
centro del gradiente de fondo. Ese commit es ancestro de `4b9c611`.

**Implicación de método:** la auditoría dice haber medido `4b9c611`, pero al menos
C-04 fue medido en un árbol anterior. No invalida el resto —C-01, C-02, C-03 y C-05
los reproduje sobre `4b9c611`—, pero conviene saberlo antes de tratar cada número
como verificado.

### SÍ/NO — ya corregido por el propio documento

La autocorrección #1 es correcta. Yo mido **6,83:1** (verde) y **7,39:1** (coral);
el documento dice 6,39 y 6,57. Ambos pasan AA con holgura. Coincidimos en el
veredicto.

### Pendiente de coordinar: rama sin mergear

Existe `feat/ux-pase-diseno` (`dca9a95`), **no mergeada**, que toca archivos del
alcance de PR 1 y PR 3: `global.css` (`.btn-ghost`), `SelectMode.{tsx,css}`,
`Settings.{tsx,css}`, las tres configs, y agrega `components/TopBar`. **No cierra
ninguno de los hallazgos listados** (verifiqué: no toca `text-decoration`, así que
A-07 sigue abierto), pero **va a conflictuar** con PR 1 y PR 3 si no se ordena.
Ver sección 5.

---

## 3. Contradicciones

### `DATA.md` ↔ `src/types/index.ts` — **no verificable**

No tengo `DATA.md`. Dejo el inventario real para el cruce:

```
Categoria · Letra · Modo · GameDefaults · AppMeta · Player
GameSnapshot        (incluye gameId: string — UUID por partida)
BoardLayoutDef · BoardPlayer · BoardSnapshot
OrbitaCard · OrbitaPlayer · OrbitaSnapshot · OrbitaAfirmacionDef · OrbitaAtributo
RoomMessage · RoomRole · RoomStatus
ModoSlug = 'clasico' | '1000-nombres' | 'orbita' | 'palabra-diaria'
         | 'infinito' | 'multijugador' | 'contrarreloj'
```

Dos cosas que probablemente `DATA.md` no contemple, por ser posteriores: el campo
**`gameId`** en los tres snapshots, y el bloque entero de tipos **Órbita**.

### `CONTEXT.md` — **no verificable**

No lo tengo. El propio brief lo marca como desactualizado, así que no lo uso como
fuente. Si describe menos de tres modos jugables, está desactualizado: hay tres
(`clasico`, `1000-nombres`, `orbita`).

### `BRAND.md` ↔ `BRAND.md`

Contradicción interna, y es la que sostiene mi objeción principal:

> *"Cálido, cómplice, familiar — habla como quien propone 'dale, una partida más'."*

> *"Contra honesta: el juego se enfría. Se pierde el golpe de calor que le daba
> energía de party-game."*

El documento sabe que la decisión contradice la esencia declarada y lo asume. Mi
objeción no es que lo oculte, sino que **el sacrificio no es necesario** (sección 4).

### `BRAND.md` ↔ el código

`BRAND.md` dice: *"Fredoka y Space Mono ya se cargan en `index.html` y hoy solo se
usan en Órbita."* **Correcto** — lo verifiqué. Cargo actual: Poppins, Fredoka
(500/600/700) y Space Mono (400/700).

---

## 4. Objeciones al diseño

Cuatro de las cinco decisiones me parecen correctas. Una no, y una tercera necesita
un ajuste.

### 4.1 · Retiro de `.glass` y los nueve `backdrop-filter` — **de acuerdo, con un matiz de atribución**

La medición sostiene el cambio. Pero conviene separar dos causas que el documento
mezcla:

- **La causa del fallo de contraste es el `conic-gradient`**, no el `backdrop-filter`.
  Sacar solo el cónico (PR 1) ya lleva el contraste de la categoría a un valor fijo.
- **Los nueve `backdrop-filter` son un costo de rendimiento** (A-10), no de contraste.

Importa porque **PR 1 ya se lleva la victoria crítica**. Si PR 3 se demora o se
descarta, el problema de accesibilidad está resuelto igual. Vender PR 3 con el número
de C-01 sería atribuirle un mérito que ya cobró PR 1.

### 4.2 · Tema claro por defecto — **objeción**

El argumento del documento es sobre el **material**: *"el claymorphism nació claro; el
diurno es la forma nativa"*. Es cierto y no lo discuto. Pero es un argumento sobre la
técnica, no sobre el **contexto de uso**.

Word Blitz se juega en un living, de noche, con una TV encendida. El propio documento
mide la consecuencia:

> *"Luminancia relativa media del cuadro 16:9 completo: blanco pleno 100 % ·
> **Clay Diurno 72 %** · Clay Nocturno 7 %."*

Un rectángulo de 55" al 72 % de blanco pleno, en una sala a oscuras, con gente
mirándolo durante una partida entera. Eso no es una preferencia estética: es fatiga.

**Propuesta:** que el valor por defecto sea `prefers-color-scheme`, y que el
interruptor explícito lo pise. Cuesta una media query y respeta las dos cosas — el
claro sigue siendo la forma nativa del material para quien tiene el sistema en claro,
y quien juega de noche no recibe un flash. Es también lo que ya hace el resto de la
app con `prefers-reduced-motion`.

Si aun así se prefiere forzar el claro, que sea una decisión tomada contra este
número, no en su ausencia.

### 4.3 · Acento celeste — **objeción fundada: la regla es correcta, el salto al celeste no se sigue de ella**

La regla que propone el documento es buena y la suscribo:

> *"El acento es siempre el contrario del campo."*

El problema es la conclusión. El documento presenta el celeste como la salida al
fracaso del naranja, pero **lo que fallaba en el tangelo era su luminosidad, no su
temperatura**. Un naranja *oscurecido* cumple la misma regla sin enfriar la marca.

Medido contra el campo diurno propuesto `#EDEFF4`, con el doble requisito de
tinta ≥4,5 y separación del campo ≥3:1:

| Candidato | tinta / acento | acento / campo | |
|---|---|---|---|
| Celeste propuesto `#08768F` | 4,94 | 4,57 | pasa |
| **Terracota `#9A3412`** | **6,88** | **6,35** | pasa |
| **Ámbar quemado `#92400E`** | **6,84** | **6,16** | pasa |
| **Ladrillo `#8C2F13`** | **7,81** | **7,21** | pasa |
| **Teja `#7C2D12`** | **8,83** | **8,15** | pasa |
| Tangelo actual `#F5550E` | 3,39 | 2,95 | falla |

**Cuatro acentos cálidos superan al celeste en las dos métricas simultáneamente.**
Terracota `#9A3412` da 6,88 / 6,35 contra 4,94 / 4,57 del celeste: casi 40 % más de
margen, conservando la temperatura que `BRAND.md` declara esencial.

O sea: la premisa *"salvar el contraste obliga a enfriar la paleta"* es falsa. Se
puede aplicar la regla del documento —oscurecer el acento hasta que sea el contrario
del campo— sin cambiar de familia cromática.

Efectos colaterales que se evitan si el acento sigue siendo cálido: no hace falta
retirar `--wb-sky` para que el acento no compita con las superficies, la carta puede
seguir siendo celeste en vez de periwinkle, y el wordmark no necesita rehacerse por
color (M-11 sigue haciendo falta por la "I" faltante, pero deja de estar acoplado a
este cambio).

**No pido descartar el celeste.** Pido que se elija sabiendo que la alternativa
cálida existe, mide mejor y no contradice la esencia de marca. Si la preferencia es
estética —"queremos que se vea más fresco"— es una razón legítima; simplemente no es
la razón que el documento da.

### 4.4 · Inversión de polaridad del CTA entre temas — **objeción de consistencia**

Que el mismo botón sea *lo más oscuro de la pantalla* en un tema y *lo más luminoso*
en el otro es elegante como sistema, pero tiene tres costos que el documento no pesa:

1. **Memoria muscular.** El celular circula entre personas. Un CTA que cambia de
   figura-fondo según un ajuste que quizá ninguno de ellos eligió es una señal que
   deja de ser estable.
2. **Superficie de QA.** Cada estado (hover, active, disabled, focus, sobre carta,
   sobre campo) se duplica, y son estados donde el contraste se recalcula.
3. **Capturas y soporte.** Todo screenshot y toda instrucción visual pasa a depender
   del tema.

Es implementable y no está mal. Pero debería ser una decisión explícita —"aceptamos
duplicar el QA del CTA a cambio de que el acento respire en los dos temas"— y no un
efecto colateral de haber elegido un acento claro. Con un acento cálido oscuro (4.3)
el problema desaparece: la polaridad es la misma en los dos temas.

### 4.5 · Retiro del fondo animado con `mix-blend-mode` — **de acuerdo, sin reservas**

`soft-light` está calculado para fondo oscuro; sobre papel claro invierte. Además es
1 de las 10 animaciones y 1 de los `mix-blend-mode`. Retirarlo es gratis y correcto.

---

## 5. Plan de PRs

El orden propuesto (legibilidad → encaje → material → TV → terminación) me parece
correcto: pone adelante lo crítico y medido, y deja para después el cambio global y
riesgoso. Propongo cuatro ajustes.

### Ajuste 1 — resolver la rama pendiente **antes** de PR 1

`feat/ux-pase-diseno` toca `global.css`, `SelectMode`, `Settings` y las tres configs,
y agrega `TopBar`. PR 1 toca `global.css` y PR 3 lo reescribe entero. Dos caminos:

- **(a)** Mergear esa rama primero y partir PR 1 desde ahí. *Recomendado:* ya está
  verificada (0 controles bajo 44 px, 41/41 tests) y su `TopBar` es la base natural
  para el header comprimido de PR 2.
- **(b)** Descartarla y rehacer lo que sirva dentro de PR 3.

Sin decidir esto, PR 1 y PR 3 van a conflictuar.

### Ajuste 2 — partir PR 3 en dos

Es el más riesgoso: cambia la superficie de todos los componentes a la vez. Sugiero:

- **PR 3a — plumbing sin cambio visual.** Los dos temas en `variables.css`, `.e0`–`.e3`,
  `settingsStore.tema`, `data-theme` en la raíz, campo `tema` en el payload de sala y
  aplicado en `TvScreen`. Los componentes siguen usando los tokens viejos. *Se puede
  verificar que nada cambió* — que es lo que hace revertible al siguiente.
- **PR 3b — el cambio de piel.** Componentes a los tokens nuevos, retiro de `.glass`,
  de los `backdrop-filter` y del fondo animado.

### Ajuste 3 — el test de contraste va en PR 1, no al final

Los criterios de aceptación exigen medir contraste **sobre el render** en cada PR.
Eso pide un script, no inspección manual. Propongo agregar en PR 1 un
`scripts/contraste.mjs` que levante el preview, recorra una lista de pares
selector/umbral y falle con código ≠ 0. Cada PR posterior suma sus pares. Sin esto,
el criterio 1 se cumple "a ojo" y se degrada al tercer PR.

### Ajuste 4 — decidir 4.2 y 4.3 antes de PR 3

El tema por defecto y la familia del acento son *entradas* de PR 3, no detalles de
implementación. Necesito una respuesta a las dos objeciones antes de escribir esos
tokens, o voy a escribirlos dos veces.

### Orden y tamaño

| # | PR | Alcance | Tamaño | Riesgo |
|---|---|---|---|---|
| 0 | Mergear `feat/ux-pase-diseno` | — | — | bajo |
| 1 | Legibilidad + script de contraste | CSS puro, 4 archivos | S | bajo |
| 2 | Encaje de la partida | `Game.{tsx,css}`, Podium | M | medio |
| 3a | Tokens y plumbing de tema | `variables.css`, 2 stores, `sync`, `TvScreen` | M | bajo |
| 3b | Cambio de piel | ~todos los `.css` | **L** | **alto** |
| 4 | TV como pieza propia | `TvScreen.{tsx,css}` | M | medio |
| 5 | Terminación | assets, wordmark, chips, beat | M | bajo |

No estimo en horas: no tengo referencia de velocidad en este repo y un número
inventado es peor que ninguno. La secuencia y los tamaños relativos sí los sostengo.

---

## 6. Qué necesito para seguir

1. **`DATA.md` y `CONTEXT.md`**, o confirmación de que los deje fuera de alcance.
2. **Decisión sobre 4.2** (tema por defecto: forzar claro vs. seguir al sistema).
3. **Decisión sobre 4.3** (acento celeste vs. acento cálido oscuro).
4. **Decisión sobre el Ajuste 1** (qué hacer con `feat/ux-pase-diseno`).

Con eso arranco por PR 0/1. No escribo código de producción hasta entonces.

---

### Nota de herramienta

Para medir agregué una entrada `preview` a `.claude/launch.json` (levanta
`vite preview` en :4173). Es el único archivo que toqué. Si molesta, se revierte con
`git checkout .claude/launch.json`.
