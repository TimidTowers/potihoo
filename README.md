# potihoo — portafolio de Ana

Portafolio bilingüe (ES/EN) de animación digital. Hecho con **Astro 5 + Tailwind v4 + Decap CMS**.

> Web final: `https://potihoo.vercel.app`
> Panel de edición: `https://potihoo.vercel.app/admin/`

---

## 1. Desarrollo local

```bash
npm install
npm run dev          # http://localhost:4321
```

Para abrir Decap CMS en local (sin login de GitHub):
1. Abre `public/admin/config.yml` y descomenta la línea `local_backend: true`.
2. En otra terminal: `npx decap-server` (proxy local).
3. Visita `http://localhost:4321/admin/`.

> Recuerda comentar de nuevo `local_backend` antes de hacer deploy.

## 2. Comandos

| Comando            | Acción                                      |
|--------------------|---------------------------------------------|
| `npm run dev`      | Servidor local en `localhost:4321`          |
| `npm run build`    | Build estático en `dist/`                   |
| `npm run preview`  | Preview del build                           |

## 3. Deploy a Vercel (potihoo.vercel.app)

1. Sube el repo a GitHub (público o privado).
2. Entra a [vercel.com](https://vercel.com) → *Add New… → Project*.
3. Importa el repo. Vercel detecta Astro automáticamente.
4. En *Project Name* pon **`potihoo`** → tu URL será `potihoo.vercel.app`.
5. Click *Deploy*. Listo.

### 3.1 Configurar Decap CMS para que Ana pueda editar desde el panel

Decap necesita autenticarse contra GitHub para guardar cambios. Pasos:

1. **Crea un OAuth app en GitHub:**
   - GitHub → Settings → Developer settings → OAuth Apps → *New OAuth App*
   - Homepage URL: `https://potihoo.vercel.app`
   - Authorization callback URL: `https://decap-proxy.vercel.app/api/callback` (puedes apuntar a tu propio proxy más adelante)
   - Anota el **Client ID** y genera un **Client Secret**.

2. **Despliega un proxy OAuth gratis** (es un mini servicio que intercambia el token con GitHub). Hay uno listo de Decap:
   - Forkea: https://github.com/sterlingwes/decap-proxy
   - Despliega ese fork como un nuevo proyecto en Vercel.
   - En su *Environment Variables* mete: `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `ORIGIN=https://potihoo.vercel.app`.
   - Anota la URL del proxy (ej. `https://potihoo-decap-proxy.vercel.app`).

3. **Actualiza `public/admin/config.yml`:**
   - `repo: tu-usuario/tu-repo`
   - `base_url: https://potihoo-decap-proxy.vercel.app` (o la que uses)

4. Push y listo. Ana entra a `/admin`, hace login con GitHub y edita.

> **Atajo si por ahora solo edita Sebas:** dejalo en `local_backend: true` y editen en local. Cuando Ana quiera editar sola, completen el paso 3.1.

## 4. Cómo se edita el contenido

### Desde el panel `/admin/` (Ana)
- **Proyectos** → agregar/editar/borrar proyectos del portafolio.
- **Sobre mí** → editar bio, herramientas, experiencia, educación (en cada idioma).
- **Textos del sitio** → cambiar cualquier texto de la interfaz (ES/EN).

### Desde el código (Sebas)
- `src/content/projects/*.md` → un archivo por proyecto.
- `src/content/about/{es,en}.md` → bio en cada idioma.
- `src/i18n/{es,en}.json` → todos los textos de UI.
- `src/styles/global.css` → paleta, tipografía, animaciones.

### Traducción automática ES → EN
Los campos en inglés de los proyectos (`title_en`, `description_en`, `caption_en`)
son **opcionales**: si quedan vacíos, el build los traduce solo con DeepL
(`src/lib/translate.ts`, env var `DEEPL_API_KEY` en Vercel). Lo escrito a mano
siempre tiene prioridad, y si la API falla el sitio muestra el texto en español
(el build nunca se rompe por esto).

## 5. Estructura

```
src/
  components/      # Nav, Footer, Hero, ProjectCard, Marquee, Cursor
  content/
    projects/      # 1 .md por proyecto
    about/         # bio (es.md, en.md)
  i18n/            # es.json, en.json + utils.ts
  layouts/         # Base.astro
  lib/             # helpers (projects.ts)
  pages/
    index.astro             # Home (es)
    about.astro
    contact.astro
    work/
      index.astro           # listado con filtros
      [...slug].astro       # ficha de proyecto
    en/
      ...                   # versiones inglesas (re-render de las anteriores)
  styles/global.css
public/
  admin/           # Decap CMS (panel)
  images/          # imágenes subidas (las de Decap también caen aquí)
```

## 6. Paleta

```
--magenta-500: #e30052   (acento principal)
--fire-500:    #fc4b08   (acento secundario / CTA hover)
--sun-500:     #fee12b   (highlights, detalles)
--ink:         #0a0a0a   (fondo)
--paper:       #f5f1ea   (texto)
```

## 7. Próximos pasos sugeridos

- [ ] Reemplazar placeholders SVG en `/public/images/` por trabajos reales de Ana.
- [ ] Configurar el formulario de contacto con [Formspree](https://formspree.io) (gratis hasta 50/mes) — actualizar el `action` en `src/pages/contact.astro`.
- [ ] Agregar showreel real (Vimeo/YouTube) en el hero o como sección propia.
- [ ] Añadir favicon definitivo.
- [ ] Conectar redes sociales reales en `Footer.astro` y `contact.astro`.
- [ ] (Opcional) Comprar `potihoo.com` y apuntar DNS a Vercel (~12 USD/año).
