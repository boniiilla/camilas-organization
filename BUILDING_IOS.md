# Guía para Compilar la App iOS con Capacitor

Esta guía te ayudará a convertir la app web en una aplicación nativa iOS que puedes instalar en tu iPhone o iPad con datos persistentes mediante SQLite.

## Requisitos Previos

1. **Mac con macOS** (necesario para compilar apps iOS)
2. **Xcode** instalado desde la App Store
3. **Node.js y pnpm** instalados
4. **Cuenta de Apple Developer** (gratuita para desarrollo, de pago para publicar en App Store)

## Paso 1: Preparar el Proyecto

### 1.1 Descargar el Código

Descarga todo el código del proyecto a tu Mac. Puedes usar el botón [Download Project](#project-download) o clonar el repositorio si está en Git.

### 1.2 Instalar Dependencias

Abre la Terminal en la carpeta del proyecto y ejecuta:

```bash
pnpm install
```

### 1.3 Compilar la App Web

```bash
pnpm run build
```

Este comando genera la versión optimizada de la app en la carpeta `dist/spa`.

## Paso 2: Inicializar Capacitor

### 2.1 Verificar Configuración

El archivo `capacitor.config.ts` ya está configurado con:

```typescript
{
  appId: 'com.camila.organization',
  appName: "Camila's Organization",
  webDir: 'dist/spa'
}
```

Puedes cambiar el `appId` si lo deseas (formato: `com.tunombre.tuapp`).

### 2.2 Añadir Plataforma iOS

```bash
npx cap add ios
```

Este comando crea una carpeta `ios/` con el proyecto de Xcode.

### 2.3 Sincronizar Archivos

```bash
npx cap sync ios
```

Este comando copia los archivos web compilados al proyecto iOS.

## Paso 3: Configurar SQLite en iOS

El plugin SQLite ya está instalado, pero necesitas configurarlo en Xcode:

### 3.1 Abrir Xcode

```bash
npx cap open ios
```

Esto abrirá el proyecto en Xcode automáticamente.

### 3.2 Configurar Permisos (Opcional)

Si necesitas permisos especiales, edita `ios/App/App/Info.plist`:

```xml
<key>UIFileSharingEnabled</key>
<true/>
<key>LSSupportsOpeningDocumentsInPlace</key>
<true/>
```

## Paso 4: Compilar y Ejecutar en Xcode

### 4.1 Seleccionar Equipo de Desarrollo

1. En Xcode, selecciona el proyecto "App" en el navegador izquierdo
2. Ve a la pestaña "Signing & Capabilities"
3. Selecciona tu equipo de Apple Developer (puedes usar una cuenta gratuita)
4. Xcode generará automáticamente un perfil de aprovisionamiento

### 4.2 Seleccionar Dispositivo

En la barra superior de Xcode:
- Para **simulador**: Selecciona "iPhone 15" (o cualquier otro)
- Para **dispositivo físico**: Conecta tu iPhone/iPad y selecciónalo

### 4.3 Compilar y Ejecutar

1. Presiona el botón ▶️ (Play) o usa `Cmd + R`
2. Xcode compilará la app
3. La app se instalará y abrirá automáticamente

## Paso 5: Instalar en Dispositivo Físico

### 5.1 Conectar iPhone/iPad

1. Conecta tu dispositivo al Mac con un cable USB
2. Desbloquea el dispositivo
3. Confía en el ordenador si se solicita

### 5.2 Configurar Dispositivo para Desarrollo

1. En el dispositivo, ve a **Ajustes > General > Gestión de dispositivos**
2. Toca tu cuenta de Apple Developer
3. Toca "Confiar en [tu cuenta]"

### 5.3 Compilar para Dispositivo

1. En Xcode, selecciona tu dispositivo en el menú desplegable superior
2. Presiona ▶️ para compilar e instalar
3. La app se instalará en tu dispositivo

## Paso 6: Persistencia de Datos con SQLite

### ✅ ¿Cómo Funciona?

La app automáticamente detecta si está corriendo en iOS nativo y usa SQLite en lugar de localStorage:

- **En navegador web**: Usa localStorage (datos temporales)
- **En app iOS**: Usa SQLite (datos permanentes en el dispositivo)

### 📁 Ubicación de la Base de Datos

Los datos se guardan en:
```
/Library/Application Support/CapacitorDatabase/camila_organization.db
```

### 🔄 Actualizar la App

Cuando hagas cambios en el código:

```bash
# 1. Recompilar la app web
pnpm run build

# 2. Sincronizar con iOS
npx cap sync ios

# 3. Volver a compilar en Xcode (Cmd + R)
```

## Paso 7: Publicar en App Store (Opcional)

### 7.1 Requisitos

- Cuenta de Apple Developer de pago ($99/año)
- App Store Connect configurado
- Certificados y perfiles de distribución

### 7.2 Proceso Simplificado

1. En Xcode, cambia el esquema a "Release"
2. Ve a **Product > Archive**
3. Una vez archivado, selecciona "Distribute App"
4. Sigue el asistente de Xcode para subir a App Store Connect
5. Completa la información en App Store Connect
6. Envía para revisión de Apple

## Solución de Problemas Comunes

### Error: "Could not find module 'Capacitor'"

```bash
pnpm install
npx cap sync ios
```

### Error: "No signing certificate found"

1. Xcode > Preferences > Accounts
2. Añade tu Apple ID
3. Descarga certificados automáticamente

### Error: "Build failed"

1. Limpia el build: **Product > Clean Build Folder** (Shift + Cmd + K)
2. Cierra Xcode
3. Borra la carpeta `ios/App/Pods`
4. Ejecuta: `npx cap sync ios`
5. Abre Xcode de nuevo

### La app se cierra inmediatamente

1. Verifica los logs en Xcode (Cmd + Shift + Y para abrir la consola)
2. Comprueba que `pnpm run build` se ejecutó correctamente
3. Verifica que `capacitor.config.ts` apunta a `dist/spa`

## Recursos Adicionales

- [Documentación de Capacitor](https://capacitorjs.com/docs/ios)
- [Guía de SQLite Plugin](https://github.com/capacitor-community/sqlite)
- [Publicar en App Store](https://developer.apple.com/app-store/submissions/)
- [Xcode Help](https://developer.apple.com/documentation/xcode)

## Comandos Rápidos de Referencia

```bash
# Instalar dependencias
pnpm install

# Compilar app web
pnpm run build

# Añadir iOS (solo primera vez)
npx cap add ios

# Sincronizar cambios
npx cap sync ios

# Abrir en Xcode
npx cap open ios

# Ver logs en tiempo real
npx cap run ios
```

## Notas Importantes

- ✅ Los datos se guardan permanentemente en SQLite cuando la app corre en iOS
- ✅ La app funciona offline completamente
- ✅ No necesitas servidor ni conexión a internet
- ⚠️ Para compartir datos entre dispositivos, necesitarías implementar sincronización en la nube (Supabase, Firebase, etc.)
- ⚠️ Los datos solo están en el dispositivo, no en la nube

## Soporte

Si tienes problemas:
1. Revisa la consola de Xcode para ver errores
2. Verifica que todos los pasos se completaron correctamente
3. Asegúrate de tener Xcode actualizado
4. Consulta la documentación oficial de Capacitor

---

¡Listo! Ahora tienes una app nativa iOS con persistencia de datos mediante SQLite. 🎉
