# Guía del Panel de Administración - MejorHablemos

## ¿Qué son los "Handoffs"?

**Handoff** = **Solicitud de Atención Humana**

Cuando el bot no puede ayudar a un paciente (crisis, caso complejo, el usuario pide hablar con un humano), el sistema crea un "handoff" que es básicamente una solicitud para que un terapeuta real atienda al paciente.

### Estados de Handoffs:
- 📋 **PENDING** (Pendiente): Nadie lo ha tomado aún
- ✋ **ASSIGNED** (Asignado): Un terapeuta lo tomó
- 💬 **IN_PROGRESS** (En Progreso): El terapeuta está chateando con el paciente
- ✅ **RESOLVED** (Resuelto): El caso se cerró exitosamente
- ❌ **EXPIRED/CANCELLED**: Se canceló o expiró

### Prioridades:
- 🔴 **URGENT** (Urgente): Crisis, necesita atención inmediata
- 🟠 **HIGH** (Alta): Caso complejo, atender pronto
- 🔵 **NORMAL** (Normal): Puede esperar un poco
- ⚪ **LOW** (Baja): No es urgente

---

## Navegación del Panel

### 📊 Dashboard
Vista general con estadísticas:
- Handoffs pendientes
- Conversaciones en progreso
- Casos resueltos hoy

### 🔔 Solicitudes Pendientes (`/requests`)
**Aquí ves a los pacientes que necesitan ayuda.**

Muestra:
- Nombre del paciente
- Teléfono
- Prioridad (🔴🟠🔵⚪)
- Motivo de la solicitud
- Mensaje del paciente (si lo dejó)

**Acción**: Click en "✋ Atender" para tomar el caso y empezar a chatear.

### 💬 Mis Conversaciones (`/conversations`)
Por ahora redirige a Solicitudes Pendientes. En el futuro mostrará solo tus conversaciones activas.

### 📋 Historial (`/history`)
(Por implementar) Verás todas las conversaciones pasadas.

---

## Flujo de Trabajo: Cómo Atender a un Paciente

### 1. **Ver Solicitudes Pendientes**
- Ir a "Solicitudes Pendientes" en el menú lateral
- Verás una lista de pacientes esperando

### 2. **Tomar un Caso**
- Click en "✋ Atender"
- Esto te lleva a la página de Conversación

### 3. **Chatear con el Paciente**
- Ves todo el historial de mensajes:
  - 👤 **Mensajes del paciente** (azul oscuro, derecha)
  - 🤖 **Mensajes del bot** (blanco, izquierda)
  - 👨‍⚕️ **Tus mensajes** (verde, izquierda)

- Escribe en el campo de texto abajo
- Click "📨 Enviar"

### 4. **Resolver el Caso**
- Cuando termines de ayudar al paciente
- Click en "✅ Resolver"
- Esto cierra la conversación y la marca como resuelta

---

## Estructura Técnica (Backend API)

El backend ya está completo y funcionando. Estos son los endpoints que usa el panel:

### Autenticación
- `POST /api/admin/auth/login` - Login
- `GET /api/admin/auth/me` - Info del usuario actual
- `POST /api/admin/auth/logout` - Cerrar sesión

### Handoffs (Solicitudes)
- `GET /api/admin/handoffs` - Lista de handoffs pendientes
- `POST /api/admin/handoffs/:id/respond` - Responder al paciente
- `POST /api/admin/handoffs/:id/resolve` - Marcar como resuelto

### Sesiones (Conversaciones)
- `GET /api/admin/sessions/:sessionId` - Ver chat completo
- `POST /api/admin/sessions/:sessionId/notes` - Agregar nota clínica
- `GET /api/admin/sessions/patient/:phoneNumber` - Historial del paciente

---

## Roles y Permisos

### 👨‍💼 Admin
- Ve TODOS los handoffs y conversaciones
- Puede crear/editar usuarios
- Acceso a reportes
- Puede asignar casos a otros terapeutas

### 👨‍⚕️ Therapist (Terapeuta)
- Ve handoffs pendientes
- Solo ve sus propias conversaciones activas
- Puede responder y resolver casos

### 👀 Supervisor
- Ve todo pero no puede modificar
- Acceso a reportes y estadísticas

---

## Preguntas Frecuentes

### ¿Dónde veo los chats?
1. Ve a "Solicitudes Pendientes"
2. Click en "✋ Atender" en cualquier solicitud
3. Eso abre la página de conversación con el chat completo

### ¿Cómo derivo un chat a otro terapeuta?
Por ahora no está implementado. Cuando esté listo:
- Botón "Asignar a..." en la página de conversación
- Seleccionar terapeuta de una lista
- El caso se transfiere

### ¿Dónde creo usuarios/agentes?
Esto todavía no está implementado en el frontend. Por ahora los usuarios se crean directamente en la base de datos con SQL. El endpoint existe en el backend pero falta la UI.

### ¿Qué significa cada prioridad?
- **URGENT**: Crisis emocional, riesgo de daño
- **HIGH**: Necesita ayuda pronto, caso complejo
- **NORMAL**: Consulta estándar
- **LOW**: Información general, no urgente

---

## Próximas Funciones a Implementar

### ✅ Ya Funcionan:
- ✅ Login/logout
- ✅ Ver solicitudes pendientes
- ✅ Chatear con pacientes
- ✅ Resolver casos

### 🚧 Pendientes:
- ⏳ Página de "Mis Conversaciones Activas"
- ⏳ Historial completo de conversaciones
- ⏳ Gestión de usuarios (crear/editar terapeutas)
- ⏳ Reportes y estadísticas
- ⏳ Notas clínicas en la UI
- ⏳ Asignar casos a otros terapeutas
- ⏳ Notificaciones en tiempo real
- ⏳ Búsqueda de pacientes

---

## Datos de Prueba

### Usuario Admin:
- **Email**: `info@mejorhablemos.us`
- **Password**: cualquier cosa (en desarrollo no se valida)

### Para crear handoffs de prueba:
Necesitas que alguien chatee con el bot en el sitio web y que el bot decida derivar a humano. Esto pasa cuando:
- El usuario dice palabras relacionadas con crisis
- El usuario pide explícitamente hablar con un humano
- El bot no puede responder la pregunta

---

## URLs

### Desarrollo Local:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### Producción:
- Frontend: https://chat.mejorhablemos.us
- Backend API: https://botmh-chatbot-production.up.railway.app/api

---

## Soporte Técnico

Si algo no funciona:
1. Verifica que el backend esté corriendo (Railway)
2. Revisa la consola del navegador (F12)
3. Verifica que estés logueado
4. Prueba actualizar la página
5. Verifica la conexión a internet

**Nota**: Este panel está en desarrollo activo. Algunas funciones pueden no estar completas aún.
