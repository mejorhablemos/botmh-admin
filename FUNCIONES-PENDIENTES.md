# Funciones Pendientes - Panel de Administración MejorHablemos

## 🔴 CRÍTICAS (Necesarias para Operación Básica)

### 1. **Gestión de Usuarios/Agentes**
**Prioridad: ALTA**

**Funcionalidades:**
- ✅ Backend: API completa (`/api/admin/users/*`)
- ❌ Frontend: Falta completamente

**Páginas a crear:**
- `/users` - Lista de todos los usuarios (admin, therapist, supervisor)
- `/users/new` - Formulario para crear nuevo usuario
- `/users/:id/edit` - Editar usuario existente

**Features:**
- Crear nuevos terapeutas con:
  - Nombre completo
  - Email
  - Rol (admin/therapist/supervisor)
  - Especialización (ansiedad, depresión, pareja, etc.)
  - Máximo de casos concurrentes
  - Estado (disponible/ocupado/no disponible)
- Editar usuarios existentes
- Activar/desactivar usuarios
- Cambiar contraseñas
- Ver historial de casos atendidos por cada terapeuta
- Asignar permisos específicos

**Endpoints disponibles (backend ya listo):**
- `GET /api/admin/users` - Lista todos los usuarios
- `POST /api/admin/users` - Crear usuario
- `GET /api/admin/users/:id` - Ver usuario
- `PUT /api/admin/users/:id` - Actualizar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario
- `PUT /api/admin/users/:id/status` - Cambiar estado

---

### 2. **Mis Conversaciones Activas**
**Prioridad: ALTA**

**Funcionalidades:**
- Ver SOLO las conversaciones que estoy atendiendo actualmente
- Filtrar por estado (en progreso, esperando respuesta)
- Ver tiempo transcurrido desde último mensaje
- Acceso rápido a cada conversación

**Página:**
- `/conversations` - Actualmente redirige a `/requests`, debe ser página propia

**Información a mostrar:**
- Nombre del paciente
- Última mensaje (preview)
- Hora del último mensaje
- Indicador si el paciente respondió y está esperando
- Estado de la conversación
- Botón para entrar al chat

**Diferencia con "Solicitudes Pendientes":**
- Solicitudes = Casos nuevos sin asignar
- Conversaciones = Mis casos ya tomados y activos

---

### 3. **Asignación Manual de Handoffs**
**Prioridad: ALTA**

**Funcionalidades:**
- Asignar un handoff pendiente a un terapeuta específico (admin/supervisor)
- Reasignar un handoff ya asignado a otro terapeuta
- Ver quién tiene asignado cada handoff

**Endpoints disponibles:**
- `POST /api/admin/handoffs/:id/assign` - Asignar a terapeuta
- `POST /api/admin/handoffs/:id/reassign` - Reasignar

**UI necesaria:**
- En "Solicitudes Pendientes": Botón "Asignar a..."
- Modal con lista de terapeutas disponibles
- Mostrar carga actual de cada terapeuta
- Filtrar por especialización

---

### 4. **Notas Clínicas**
**Prioridad: MEDIA-ALTA**

**Funcionalidades:**
- Agregar notas privadas a una conversación
- Ver historial de notas
- Solo visibles para terapeutas/admin (no para el paciente)

**Página:**
- Dentro de `/conversation/:sessionId` - Panel lateral o sección de notas

**Endpoints disponibles:**
- `POST /api/admin/sessions/:id/notes` - Crear nota
- `GET /api/admin/sessions/:id/notes` - Listar notas

**UI necesaria:**
- Panel de notas en página de conversación
- Formulario para agregar nota
- Lista de notas con timestamp y autor
- Indicador de privacidad

---

## 🟠 IMPORTANTES (Mejoran Operación Diaria)

### 5. **Historial Completo de Conversaciones**
**Prioridad: MEDIA**

**Funcionalidades:**
- Ver TODAS las conversaciones (cerradas, resueltas, abandonadas)
- Búsqueda por:
  - Nombre del paciente
  - Teléfono
  - Fecha
  - Estado
  - Terapeuta que atendió
- Filtros múltiples
- Paginación
- Exportar a CSV/PDF

**Página:**
- `/history` - Actualmente placeholder

**Información a mostrar:**
- Lista de todas las sesiones
- Estado final (resuelto, abandonado, etc.)
- Terapeuta que atendió
- Duración de la conversación
- Fecha de inicio y cierre
- Acceso de solo lectura al chat

---

### 6. **Búsqueda de Pacientes**
**Prioridad: MEDIA**

**Funcionalidades:**
- Buscar paciente por teléfono o nombre
- Ver historial completo del paciente:
  - Todas sus conversaciones anteriores
  - Notas clínicas acumuladas
  - Handoffs previos
  - Progreso del tratamiento

**Página:**
- `/patients/search` - Nueva página
- `/patients/:phoneNumber` - Perfil del paciente

**Endpoints necesarios:**
- `GET /api/admin/sessions/patient/:phoneNumber` - Ya existe
- Agregar endpoint para buscar por nombre parcial

---

### 7. **Dashboard con Estadísticas Reales**
**Prioridad: MEDIA**

**Funcionalidades:**
- Mostrar datos reales (actualmente muestra "-")
- Actualización automática cada X segundos
- Gráficos visuales

**Estadísticas a mostrar:**
- Handoffs pendientes (número real)
- Conversaciones en progreso (número real)
- Casos resueltos hoy
- Tiempo promedio de respuesta
- Tiempo promedio de resolución
- Terapeutas disponibles vs ocupados
- Casos por terapeuta
- Distribución por prioridad/urgencia
- Tendencia por hora del día

**Endpoints disponibles:**
- `GET /api/admin/stats/handoffs` - Estadísticas de handoffs
- `GET /api/admin/stats/sessions` - Estadísticas de sesiones
- `GET /api/admin/stats/therapists` - Estado de terapeutas

---

### 8. **Reportes**
**Prioridad: MEDIA**

**Funcionalidades:**
- Generar reportes personalizados
- Exportar a PDF/Excel
- Programar reportes automáticos por email

**Tipos de reportes:**
- **Reporte de Productividad:**
  - Casos atendidos por terapeuta
  - Tiempo promedio de atención
  - Tasa de resolución
  - Satisfacción del paciente (si se implementa)

- **Reporte de Demanda:**
  - Volumen de solicitudes por hora/día/semana
  - Tipos de consultas más frecuentes
  - Tiempos de espera promedio
  - Casos urgentes vs normales

- **Reporte Clínico:**
  - Motivos de consulta más comunes
  - Duración promedio de tratamientos
  - Tasa de derivación a especialistas

**Página:**
- `/reports` - Actualmente placeholder

---

### 9. **Notificaciones en Tiempo Real**
**Prioridad: MEDIA**

**Funcionalidades:**
- Notificación cuando llega nuevo handoff
- Notificación cuando paciente responde
- Sonido/vibración opcional
- Badge con contador en el icono del navegador

**Tecnología:**
- WebSockets o Server-Sent Events (SSE)
- Integración con Notification API del navegador
- Badge en favicon

**UI necesaria:**
- Centro de notificaciones (campana en header)
- Lista de notificaciones recientes
- Configuración de preferencias de notificaciones
- Permisos del navegador

---

### 10. **Estados de Terapeuta (Disponibilidad)**
**Prioridad: MEDIA**

**Funcionalidades:**
- Cambiar mi estado manualmente:
  - 🟢 Disponible
  - 🟡 Ocupado (pero activo)
  - 🔴 No disponible (no recibir casos)
  - ⏰ En pausa (temporalmente)
- Estado automático basado en carga de trabajo
- No asignar casos cuando estoy "No disponible"

**UI necesaria:**
- Toggle/dropdown en el header o sidebar
- Indicador visual de estado actual
- Contador de casos activos
- Límite de casos concurrentes

---

## 🟡 DESEABLES (Mejoran Experiencia)

### 11. **Mensajes Rápidos (Templates)**
**Prioridad: BAJA-MEDIA**

**Funcionalidades:**
- Guardar respuestas frecuentes como plantillas
- Atajos de teclado para insertar templates
- Variables personalizables {nombre}, {fecha}, etc.

**Ejemplos:**
- "Hola {nombre}, soy {terapeuta} y voy a ayudarte hoy."
- "Gracias por comunicarte. ¿Puedes contarme más sobre...?"
- "Te voy a derivar con un especialista en..."

**UI necesaria:**
- Botón "Mensajes Rápidos" en chat
- Modal con lista de templates
- Página para gestionar templates personales

---

### 12. **Adjuntar Archivos en Chat**
**Prioridad: BAJA-MEDIA**

**Funcionalidades:**
- Enviar imágenes (recursos, ejercicios, etc.)
- Enviar PDFs (folletos, guías)
- Límite de tamaño (5-10MB)
- Preview de imágenes en el chat

**Consideraciones:**
- Storage: ¿Dónde guardar archivos? (Supabase Storage, S3, etc.)
- Seguridad: Solo ciertos tipos de archivos
- HIPAA/Privacidad: Encriptación de archivos médicos

---

### 13. **Marcar Conversación con Etiquetas (Tags)**
**Prioridad: BAJA**

**Funcionalidades:**
- Etiquetar conversaciones:
  - 🏷️ Ansiedad
  - 🏷️ Depresión
  - 🏷️ Crisis
  - 🏷️ Seguimiento
  - 🏷️ Primera vez
  - 🏷️ Recurrente
- Filtrar por etiquetas en historial
- Reportes por categoría

**UI necesaria:**
- Selector de tags en conversación
- Chips/badges para mostrar tags
- Filtro por tags en historial

---

### 14. **Calificación Post-Conversación**
**Prioridad: BAJA**

**Funcionalidades:**
- Al resolver un caso, pedir feedback al paciente
- Escala 1-5 estrellas
- Comentario opcional
- Ver calificaciones en perfil del terapeuta
- Reportes de satisfacción

**Implementación:**
- Enviar mensaje automático al paciente después de resolver
- Link a formulario simple de feedback
- Almacenar en BD con referencia a sesión y terapeuta

---

### 15. **Chat Interno Entre Terapeutas**
**Prioridad: BAJA**

**Funcionalidades:**
- Consultar con otro terapeuta sobre un caso
- Pedir segunda opinión
- Coordinar derivaciones
- Chat grupal del equipo

**UI necesaria:**
- Panel de chat interno (similar a Slack)
- Lista de colegas online
- Menciones @usuario
- Adjuntar referencia a caso

---

### 16. **Programar Seguimientos**
**Prioridad: BAJA**

**Funcionalidades:**
- Agendar un recordatorio para hacer seguimiento
- Notificación cuando llegue la fecha
- Enviar mensaje automático al paciente
- "Recordatorio: Hacer seguimiento con Juan en 3 días"

**UI necesaria:**
- Botón "Programar Seguimiento" en conversación
- Calendario/date picker
- Lista de seguimientos pendientes
- Notificaciones

---

### 17. **Modo Oscuro**
**Prioridad: BAJA**

**Funcionalidades:**
- Toggle dark/light mode
- Guardar preferencia
- Automático según hora del día

---

### 18. **Soporte Multilenguaje (i18n)**
**Prioridad: BAJA**

**Funcionalidades:**
- Inglés, Español, Portugués
- Cambiar idioma en configuración
- Traducción de toda la UI

---

### 19. **Exportar Chat a PDF**
**Prioridad: BAJA**

**Funcionalidades:**
- Descargar conversación completa como PDF
- Incluir notas clínicas (opcional)
- Para guardar en registros del paciente

---

### 20. **Auditoría y Logs**
**Prioridad: BAJA-MEDIA**

**Funcionalidades:**
- Ver quién hizo qué y cuándo
- Log de todas las acciones:
  - Usuario X asignó handoff Y
  - Usuario X leyó conversación Y
  - Usuario X modificó usuario Y
- Filtros por usuario, acción, fecha
- Exportar logs

**Página:**
- `/audit-logs` (solo admin)

---

## 🟢 OPTIMIZACIONES Y MEJORAS TÉCNICAS

### 21. **Auto-refresh de Conversaciones**
**Prioridad: MEDIA**

**Funcionalidades:**
- Actualizar mensajes automáticamente cada X segundos
- Mostrar "Nuevo mensaje" sin recargar página
- Polling o WebSockets

---

### 22. **Paginación en Listas**
**Prioridad: MEDIA**

**Funcionalidades:**
- Paginar solicitudes pendientes (10-20 por página)
- Paginar historial
- Infinite scroll o paginación clásica

---

### 23. **Loading States Mejorados**
**Prioridad: BAJA**

**Funcionalidades:**
- Skeletons en lugar de spinners
- Optimistic UI updates
- Mejor feedback visual

---

### 24. **Manejo de Errores Mejorado**
**Prioridad: MEDIA**

**Funcionalidades:**
- Mensajes de error más descriptivos
- Reintento automático
- Offline mode (guardar borrador localmente)
- Toast notifications

---

### 25. **Tests E2E**
**Prioridad: BAJA-MEDIA**

**Funcionalidades:**
- Tests automatizados con Playwright/Cypress
- CI/CD para correr tests antes de deploy
- Coverage reports

---

### 26. **Performance Monitoring**
**Prioridad: BAJA**

**Funcionalidades:**
- Integración con Sentry o similar
- Monitoreo de errores en producción
- Alertas automáticas
- Performance metrics

---

### 27. **Caché y Optimizaciones**
**Prioridad: BAJA-MEDIA**

**Funcionalidades:**
- React Query optimizado
- Service Worker para PWA
- Caché de assets
- Lazy loading de componentes

---

### 28. **Responsive Mobile Mejorado**
**Prioridad: MEDIA**

**Funcionalidades:**
- Sidebar collapsible en móvil
- Touch gestures
- Bottom navigation
- UI optimizada para pantalla pequeña

---

### 29. **Accesibilidad (a11y)**
**Prioridad: MEDIA**

**Funcionalidades:**
- ARIA labels completos
- Navegación por teclado
- Screen reader support
- Contraste adecuado (WCAG AA)

---

### 30. **PWA (Progressive Web App)**
**Prioridad: BAJA-MEDIA**

**Funcionalidades:**
- Instalar como app nativa
- Funcionar offline (limitado)
- Push notifications
- App icon en home screen

---

## 📊 RESUMEN POR PRIORIDAD

### 🔴 CRÍTICAS (1-4):
1. Gestión de Usuarios/Agentes ✅ Backend | ❌ Frontend
2. Mis Conversaciones Activas
3. Asignación Manual de Handoffs
4. Notas Clínicas

### 🟠 IMPORTANTES (5-10):
5. Historial Completo
6. Búsqueda de Pacientes
7. Dashboard con Datos Reales
8. Reportes
9. Notificaciones en Tiempo Real
10. Estados de Disponibilidad

### 🟡 DESEABLES (11-20):
11. Mensajes Rápidos
12. Adjuntar Archivos
13. Etiquetas/Tags
14. Calificación Post-Conversación
15. Chat Interno
16. Programar Seguimientos
17. Modo Oscuro
18. Multilenguaje
19. Exportar a PDF
20. Auditoría y Logs

### 🟢 OPTIMIZACIONES (21-30):
21. Auto-refresh
22. Paginación
23. Loading States
24. Manejo de Errores
25. Tests E2E
26. Performance Monitoring
27. Caché
28. Responsive Mobile
29. Accesibilidad
30. PWA

---

## 🎯 ROADMAP SUGERIDO

### **Fase 1: Funcionalidad Básica (1-2 semanas)**
- ✅ Login/Logout (HECHO)
- ✅ Ver Solicitudes Pendientes (HECHO)
- ✅ Chat con Pacientes (HECHO)
- ✅ Resolver Conversaciones (HECHO)
- ⏳ Gestión de Usuarios (PENDIENTE)
- ⏳ Mis Conversaciones Activas (PENDIENTE)

### **Fase 2: Operación Completa (2-3 semanas)**
- Asignación Manual
- Notas Clínicas
- Historial Completo
- Dashboard con Datos Reales
- Estados de Disponibilidad

### **Fase 3: Mejoras de UX (2-3 semanas)**
- Búsqueda de Pacientes
- Notificaciones en Tiempo Real
- Mensajes Rápidos
- Reportes Básicos

### **Fase 4: Features Avanzados (3-4 semanas)**
- Reportes Completos
- Adjuntar Archivos
- Etiquetas
- Calificación
- Programar Seguimientos

### **Fase 5: Optimización y Escalabilidad (2-3 semanas)**
- Tests E2E
- Performance Monitoring
- PWA
- Accesibilidad
- Responsive Mobile Mejorado

---

## 💡 NOTAS FINALES

### Backend vs Frontend Status:
La mayoría de funciones críticas YA TIENEN el backend completo. Solo falta crear la UI.

### Priorización:
Enfocarse en Fase 1 y 2 para tener un producto mínimamente viable y operacional.

### Consideraciones de Privacidad:
- HIPAA compliance si opera en USA
- Encriptación de datos sensibles
- Consentimiento del paciente para almacenar conversaciones
- Políticas de retención de datos

### Escalabilidad:
- Diseñar pensando en 10-50 terapeutas simultáneos
- Base de datos optimizada para búsquedas
- CDN para assets estáticos
- Load balancing para backend
