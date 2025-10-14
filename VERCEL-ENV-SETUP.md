# Configuración de Variables de Entorno en Vercel

## Problema
El panel admin no muestra los handoffs/chats porque no está conectado al backend de Railway en producción.

## Solución
Configurar la variable de entorno en Vercel para que apunte al backend correcto.

## Pasos para configurar en Vercel:

### Opción 1: Desde el Dashboard de Vercel (Recomendado)

1. Ve a https://vercel.com/mejorhablemos/botmh-admin
2. Click en **Settings** (⚙️)
3. Click en **Environment Variables** en el menú lateral
4. Agrega una nueva variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://botmh-chatbot-production.up.railway.app/api`
   - **Environment**: Selecciona `Production`, `Preview`, y `Development`
5. Click en **Save**
6. Ve a la pestaña **Deployments**
7. En el último deployment, click en los 3 puntos (...) → **Redeploy**
8. Espera que termine el deployment

### Opción 2: Desde la CLI de Vercel

```bash
cd C:\Users\PC\Desarrollos Claude\botmh-admin
vercel env add VITE_API_BASE_URL
# Cuando pregunte el valor, pega:
# https://botmh-chatbot-production.up.railway.app/api

# Redeploy
vercel --prod
```

## Verificación

Después de configurar:

1. Abre https://chat.mejorhablemos.us/requests
2. Deberías ver los 3 handoffs pendientes:
   - Carlos Ramírez (NORMAL priority)
   - 2x Usuario Web Test (URGENT priority)

## Variables de entorno actuales:

### Local (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Producción (Vercel)
```env
VITE_API_BASE_URL=https://botmh-chatbot-production.up.railway.app/api
```

## Debugging

Para verificar que la variable está configurada en Vercel:

1. Ve al dashboard de Vercel → Settings → Environment Variables
2. Busca `VITE_API_BASE_URL`
3. Debería mostrar el valor de Railway

Si sigue sin funcionar:

1. Abre la consola del navegador (F12)
2. Ve a Network
3. Busca el request a `/admin/handoffs`
4. Verifica la URL completa del request
5. Debería ser `https://botmh-chatbot-production.up.railway.app/api/admin/handoffs`
