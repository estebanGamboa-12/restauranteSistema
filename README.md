# Restaurante Mana Altea

Sitio web de **Restaurante Mana Altea** — cocina mediterránea en Altea, con carnes a la brasa, pescados frescos, paellas y arroces, tapas y postres caseros, y reservas online.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **GSAP** + **ScrollTrigger**
- **Lenis** (scroll suave)
- **Framer Motion**
- **shadcn/ui**

## Estructura del proyecto

```
/app              → Rutas y páginas (App Router)
/components       → Componentes reutilizables (layout, UI, providers)
/animations       → Utilidades y presets de animación
/lib              → Utilidades (GSAP, utils)
/hooks            → Hooks personalizados
/styles           → Variables CSS globales
```

## Rutas

| Ruta        | Descripción   |
|------------|---------------|
| `/`        | Inicio        |
| `/menu`    | Menú          |
| `/rooftop` | El Rooftop    |
| `/reservas`| Reservas      |
| `/contacto`| Contacto      |

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Configuración destacada

- **Lenis**: scroll suave global en `SmoothScrollProvider` (`components/providers/SmoothScrollProvider.tsx`).
- **GSAP ScrollTrigger**: registrado en el cliente en el mismo provider; disponible en toda la app.
- **shadcn/ui**: componentes en `components/ui/`; estilos y tema en `app/globals.css`.
