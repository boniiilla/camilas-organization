# Camila's Organization 📚

Una aplicación moderna y completa para gestionar asignaturas, tareas y exámenes. Diseñada con React, TypeScript, Tailwind CSS y Capacitor para funcionar tanto en web como en dispositivos móviles nativos (iOS/Android) con persistencia de datos mediante SQLite.

## ✨ Características

### 🎨 Diseño Moderno
- **Fuente Poppins** para una apariencia elegante y profesional
- **Diseño rounded-full** en todos los componentes (botones, cards, inputs)
- **Paleta de colores personalizada** con tonos rosados (#F9C2FC)
- **Responsive design** optimizado especialmente para móvil
- **Header amplio** con navegación móvil tipo hamburguesa
- **Temas claros** y preparado para tema oscuro

### 📱 Funcionalidades Principales

#### Asignaturas
- ➕ Crear asignaturas con nombre y color personalizado
- 🎨 Identificación visual por color
- 📊 Ver estadísticas de tareas y exámenes por asignatura
- 🗑️ Eliminar asignaturas (elimina también sus tareas y exámenes)

#### Tareas
- ✅ Crear tareas con título, fecha límite y asignatura
- 📅 Vista de calendario organizada por fechas
- 📋 Vista de lista con filtros por asignatura
- ☑️ Marcar tareas como completadas
- 🏷️ Badges para identificar estado (Pendiente/Completada)
- 📊 Estadísticas de tareas pendientes y completadas
- ⏰ Indicadores visuales para tareas de "Hoy" y "Pasadas"

#### Exámenes
- 📝 Crear exámenes con tema, fecha y asignatura
- 📅 Vista de calendario con fechas de examen
- 📋 Vista de lista ordenada cronológicamente
- 🔔 Alertas para exámenes próximos (menos de 7 días)
- 🏆 Diferenciación entre exámenes próximos y realizados
- 📊 Estadísticas de exámenes próximos y realizados

### 💾 Persistencia de Datos

#### En Navegador Web
- Usa **localStorage** para almacenamiento temporal
- Los datos persisten mientras no se limpie la caché

#### En App Nativa (iOS/Android)
- Usa **SQLite** para almacenamiento permanente
- Los datos se guardan en la base de datos del dispositivo
- Funciona **completamente offline**
- Los datos NO se pierden al cerrar la app

## 🚀 Inicio Rápido

### Desarrollo Web

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Compilar para producción
pnpm build

# Iniciar servidor de producción
pnpm start
```

La app estará disponible en `http://localhost:8080`

### Compilar para iOS

Sigue la guía completa en [BUILDING_IOS.md](./BUILDING_IOS.md)

**Resumen rápido:**

```bash
# 1. Compilar la app web
pnpm run build

# 2. Añadir plataforma iOS (solo primera vez)
npx cap add ios

# 3. Sincronizar archivos
npx cap sync ios

# 4. Abrir en Xcode
npx cap open ios

# 5. Compilar en Xcode (Cmd + R)
```

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **TailwindCSS 3** - Framework CSS utility-first
- **React Router 6** - Enrutamiento SPA
- **Radix UI** - Componentes UI accesibles
- **Lucide React** - Iconos modernos
- **Poppins Font** - Tipografía principal

### Backend/Persistencia
- **Express** - Servidor API (opcional)
- **SQLite (Capacitor)** - Base de datos móvil
- **LocalStorage** - Almacenamiento web

### Mobile
- **Capacitor** - Framework para apps nativas
- **@capacitor-community/sqlite** - Plugin SQLite

### Testing
- **Vitest** - Framework de testing

## 📁 Estructura del Proyecto

```
camila-organization/
├── client/                    # Frontend React
│   ├── components/           
│   │   ├── ui/               # Componentes UI (shadcn/ui)
│   │   └── AppLayout.tsx     # Layout principal con header
│   ├── hooks/
│   │   └── use-sqlite.ts     # Hook para SQLite/localStorage
│   ├── pages/
│   │   ├── Index.tsx         # Página principal (dashboard)
│   │   ├── Asignaturas.tsx   # Gestión de asignaturas
│   │   ├── Tareas.tsx        # Gestión de tareas
│   │   ├── Examenes.tsx      # Gestión de exámenes
│   │   └── NotFound.tsx      # Página 404
│   ├── App.tsx               # Configuración de rutas
│   └── global.css            # Estilos globales y tema
│
├── server/                    # Backend Express (opcional)
│   ├── routes/               # Rutas API
│   └── index.ts              # Configuración servidor
│
├── shared/                    # Tipos compartidos
│   └── api.ts                # Interfaces TypeScript
│
├── capacitor.config.ts       # Configuración Capacitor
├── tailwind.config.ts        # Configuración Tailwind
├── vite.config.ts            # Configuración Vite
├── package.json              # Dependencias
├── BUILDING_IOS.md           # Guía iOS detallada
└── README.md                 # Este archivo
```

## 🎨 Personalización

### Cambiar Colores

Edita `client/global.css` para cambiar el esquema de colores:

```css
:root {
  --primary: 297 90% 87%;  /* Color principal (#F9C2FC) */
  --primary-foreground: 270 60% 20%;
  /* ... más colores ... */
}
```

### Cambiar Fuente

Edita `client/global.css` para cambiar la fuente:

```css
@import url("https://fonts.googleapis.com/css2?family=TU_FUENTE&display=swap");
```

Y actualiza `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ["TU_FUENTE", ...],
}
```

### Cambiar Nombre de la App

1. En `capacitor.config.ts`:
```typescript
appName: "Tu Nombre de App"
```

2. En componentes (buscar "Camila's Organization" y reemplazar)

## 📱 Responsive Design

La app está optimizada para:
- 📱 **Móviles** (< 768px): Menú hamburguesa, cards apiladas
- 💻 **Tablets** (768px - 1024px): Grid de 2 columnas
- 🖥️ **Desktop** (> 1024px): Grid de 3 columnas, navegación completa

## 🔒 Privacidad y Datos

- ✅ Todos los datos se almacenan **localmente** en tu dispositivo
- ✅ **No hay servidor externo** que almacene tu información
- ✅ **No se requiere cuenta** ni inicio de sesión
- ✅ **Funciona offline** completamente
- ⚠️ Los datos están **solo en tu dispositivo** (no sincroniza entre dispositivos)

## 🚀 Despliegue

### Web (Netlify/Vercel)

La app ya está lista para desplegarse en Netlify o Vercel:

```bash
# Compilar
pnpm run build

# La carpeta dist/spa contiene los archivos estáticos
```

### iOS App Store

Sigue la [guía completa de iOS](./BUILDING_IOS.md) para publicar en App Store.

### Android Google Play

```bash
# Añadir plataforma Android
npx cap add android

# Sincronizar
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🙏 Agradecimientos

- [Radix UI](https://www.radix-ui.com/) - Componentes UI accesibles
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Capacitor](https://capacitorjs.com/) - Framework para apps nativas
- [Lucide](https://lucide.dev/) - Iconos
- [Poppins Font](https://fonts.google.com/specimen/Poppins) - Tipografía

---

Hecho con ❤️ para Camila
