# Backend Context — ivu-shop-backend

Eres un asistente que conoce en detalle el backend de esta aplicación SaaS multi-tenant. Usa el siguiente contexto para responder cualquier pregunta del frontend o ayudar a integrarlo correctamente.

---

## Datos generales

- **Framework**: NestJS 11 + TypeORM 0.3 + PostgreSQL
- **Base URL (dev)**: `http://localhost:3000`
- **Prefijo global**: `/api/v1`
- **Documentación Swagger (dev)**: `http://localhost:3000/api/docs`
- **CORS**: configurado para `FRONTEND_URL` (por defecto `http://localhost:3001`), con `credentials: true`

---

## Autenticación

El backend usa **JWT con doble token**:

| Token | Dónde viaja | TTL |
|---|---|---|
| `accessToken` | Header `Authorization: Bearer <token>` | Corto (minutos) |
| `refresh_token` | Cookie `HttpOnly` | Largo (días) |

**JWT Payload decodificado:**
```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "role": "owner | admin | employee",
  "tenantId": "uuid-del-tenant | null"
}
```

**Roles disponibles:**
- `owner` — dueño del negocio
- `admin` — administrador de la plataforma (superadmin)
- `employee` — empleado del negocio

---

## Enums de referencia

```
BusinessType:       bar | minimarket | auto_parts_shop | clothing_store | shoe_store
BillingCycle:       MONTHLY | YEARLY
SubscriptionStatus: TRIAL | ACTIVE | PAST_DUE | CANCELLED | EXPIRED
Role:               owner | admin | employee
```

---

## Módulo: AUTH — `/api/v1/auth`

### POST `/api/v1/auth/register`
Registro de usuario standalone (sin tenant). Envía email de verificación.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "García",
  "email": "juan@ejemplo.com",
  "password": "MiPass123!"
}
```
**Respuesta 201:** `{ message: string }`

---

### GET `/api/v1/auth/verify-email?token=<token>`
Verifica el email del usuario con el token recibido por correo.

**Query param:** `token` (string)
**Respuesta 200:** `{ message: string }`

---

### POST `/api/v1/auth/login`
Inicia sesión. Retorna `accessToken` en el body y setea la cookie `refresh_token` (HttpOnly).

**Body:**
```json
{
  "email": "owner@barpatio.dev",
  "password": "Owner1234!"
}
```
**Respuesta 200:**
```json
{
  "accessToken": "eyJhbGc..."
}
```
> La cookie `refresh_token` se setea automáticamente. El frontend debe enviar `credentials: 'include'` en fetch o `withCredentials: true` en axios.

---

### POST `/api/v1/auth/refresh`
Renueva el `accessToken` usando la cookie `refresh_token`. Implementa rotación de refresh token.

**Auth requerida:** Cookie `refresh_token` (se envía automáticamente con `credentials: 'include'`)
**Respuesta 200:**
```json
{
  "accessToken": "eyJhbGc..."
}
```

---

### POST `/api/v1/auth/forgot-password`
Envía email con enlace de reset si el correo existe.

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```
**Respuesta 200:** `{ message: string }` (siempre responde igual por seguridad)

---

### POST `/api/v1/auth/reset-password`
Restablece la contraseña con el token recibido por email. Invalida todas las sesiones previas.

**Body:**
```json
{
  "token": "a3f8e1d2c4b5...",
  "password": "NuevaPass123!"
}
```
**Respuesta 200:** `{ message: string }`

---

### POST `/api/v1/auth/logout`
Cierra la sesión, invalida el refresh token y borra la cookie.

**Auth requerida:** `Authorization: Bearer <accessToken>`
**Respuesta 200:** `{ message: string }`

---

## Módulo: TENANTS — `/api/v1/tenants`

### POST `/api/v1/tenants` ⭐ Onboarding público
Registra un nuevo negocio. En una sola transacción crea: Tenant + User OWNER + Subscription TRIAL. Envía email de verificación al owner.

**Body:**
```json
{
  "name": "Bar El Patio",
  "businessType": "bar",
  "ownerName": "Juan García",
  "email": "contacto@barpatio.com",
  "phone": "6041234567",
  "address": "Calle 45 # 12-34",
  "city": "Medellín",
  "country": "Colombia",
  "ownerFirstName": "Juan",
  "ownerLastName": "García",
  "ownerEmail": "juan@barpatio.com",
  "ownerPassword": "Seguro123!"
}
```
> Campos opcionales: `phone`, `address`, `city`, `country`

**Respuesta 201:**
```json
{
  "message": "Tenant created successfully",
  "tenantId": "uuid",
  "ownerId": "uuid"
}
```

---

### GET `/api/v1/tenants/:id`
Obtiene los datos de un tenant.

**Auth:** Bearer token | Roles: `owner`, `admin`
> El owner solo puede ver su propio tenant.

**Respuesta 200:** Objeto Tenant completo

---

### PATCH `/api/v1/tenants/:id`
Actualiza datos del tenant.

**Auth:** Bearer token | Rol: `owner` (solo su propio tenant)

**Body (todos opcionales):**
```json
{
  "name": "Nuevo nombre",
  "phone": "6049876543",
  "address": "Nueva dirección",
  "city": "Bogotá",
  "country": "Colombia",
  "logoUrl": "https://..."
}
```
**Respuesta 200:** Tenant actualizado

---

### DELETE `/api/v1/tenants/:id`
Desactiva un tenant (soft delete, `isActive = false`).

**Auth:** Bearer token | Rol: `admin` (superadmin de plataforma)
**Respuesta 204:** Sin contenido

---

## Módulo: USERS — `/api/v1/users`

Todos los endpoints requieren `Authorization: Bearer <accessToken>`. Los usuarios solo pueden ver/gestionar usuarios de su **mismo tenant** (scoping automático por `tenantId` del JWT).

### GET `/api/v1/users`
Lista los usuarios activos del tenant autenticado.

**Respuesta 200:** Array de User

---

### GET `/api/v1/users/:id`
Obtiene un usuario por ID (debe pertenecer al mismo tenant).

**Respuesta 200:** Objeto User

---

### POST `/api/v1/users`
Crea un nuevo usuario dentro del tenant. El `tenantId` se toma automáticamente del JWT.

**Roles permitidos:** `owner`, `admin`

**Body:**
```json
{
  "firstName": "María",
  "lastName": "López",
  "email": "maria@empresa.com",
  "password": "Segura123!",
  "role": "employee",
  "phone": "3001234567"
}
```
> `role` y `phone` son opcionales. Role por defecto: `employee`.

**Respuesta 201:** Objeto User creado

---

### PATCH `/api/v1/users/:id`
Actualiza datos de un usuario del mismo tenant.

**Roles permitidos:** `owner`, `admin`

**Body (todos opcionales):**
```json
{
  "firstName": "María",
  "lastName": "López",
  "phone": "3009876543",
  "role": "admin",
  "isActive": false
}
```
**Respuesta 200:** Usuario actualizado

---

### DELETE `/api/v1/users/:id`
Desactiva un usuario del tenant (soft delete, `isActive = false`).

**Roles permitidos:** `owner`, `admin`
**Respuesta 204:** Sin contenido

---

## Módulo: PLANS — `/api/v1/plans`

### GET `/api/v1/plans` — Público
Lista los planes activos y públicos, ordenados por `sortOrder`. Usar para página de precios.

**Respuesta 200:** Array de Plan

---

### GET `/api/v1/plans/:id` — Público
Detalle de un plan por ID.

**Respuesta 200:** Objeto Plan

---

### POST `/api/v1/plans`
Crea un plan nuevo.

**Auth:** Bearer token | Rol: `admin`

**Body:**
```json
{
  "name": "Pro",
  "description": "Ideal para negocios en crecimiento.",
  "price": 99000,
  "currency": "COP",
  "billingCycle": "MONTHLY",
  "maxUsers": 5,
  "maxProducts": 500,
  "features": ["Hasta 5 usuarios", "Reportes avanzados"],
  "isActive": true,
  "isPublic": true,
  "sortOrder": 2
}
```
> Obligatorios: `name`, `price`, `maxUsers`. El resto son opcionales.

**Respuesta 201:** Plan creado

---

### PATCH `/api/v1/plans/:id`
Actualiza un plan existente.

**Auth:** Bearer token | Rol: `admin`
**Body:** Igual que POST pero todos opcionales.
**Respuesta 200:** Plan actualizado

---

### DELETE `/api/v1/plans/:id`
Desactiva un plan (`isActive = false`).

**Auth:** Bearer token | Rol: `admin`
**Respuesta 204:** Sin contenido

---

## Módulo: SUBSCRIPTIONS — `/api/v1/subscriptions`

Todos requieren `Authorization: Bearer <accessToken>`.

### GET `/api/v1/subscriptions/my`
Obtiene las suscripciones del tenant del usuario autenticado. Incluye datos del plan.

**Respuesta 200:** Array de Subscription con `plan` poblado

---

### POST `/api/v1/subscriptions/:id/cancel`
Cancela una suscripción.

**Rol:** `owner`

**Body:**
```json
{
  "reason": "Ya no necesito el servicio"
}
```
> `reason` es opcional.

**Respuesta 200:** Suscripción cancelada

---

### POST `/api/v1/subscriptions/:id/activate`
Activa una suscripción (de TRIAL o CANCELLED a ACTIVE).

**Rol:** `admin` (superadmin de plataforma)
**Respuesta 200:** Suscripción activada

---

## Modelos de respuesta

### User
```ts
{
  id: string           // UUID
  tenantId: string | null
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'owner' | 'admin' | 'employee'
  isActive: boolean
  isEmailVerified: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```
> `password`, `refreshToken`, `emailVerificationToken`, `passwordResetToken` **nunca se devuelven** (`select: false`)

### Tenant
```ts
{
  id: string           // UUID
  name: string
  slug: string         // unique, generado del nombre
  businessType: BusinessType
  ownerName: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string
  logoUrl: string | null
  isActive: boolean
  isEmailVerified: boolean
  trialEndsAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

### Plan
```ts
{
  id: string           // UUID
  name: string
  description: string | null
  price: number        // decimal
  currency: string     // 'COP'
  billingCycle: 'MONTHLY' | 'YEARLY'
  maxUsers: number
  maxProducts: number  // -1 = ilimitado
  features: string[]
  isActive: boolean
  isPublic: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

### Subscription
```ts
{
  id: string           // UUID
  tenantId: string
  planId: string
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  startDate: Date
  endDate: Date | null
  trialStartDate: Date | null
  trialEndDate: Date | null
  cancelledAt: Date | null
  cancelReason: string | null
  autoRenew: boolean
  metadata: object | null
  plan: Plan           // poblado en GET /my
  createdAt: Date
  updatedAt: Date
}
```

---

## Errores comunes

| Código | Causa típica |
|---|---|
| 400 | Validación fallida (campo requerido, formato inválido) |
| 401 | Token expirado, inválido o no enviado |
| 403 | Rol insuficiente o intentando acceder a recurso de otro tenant |
| 404 | Recurso no encontrado |
| 409 | Email o slug ya en uso |

---

## Cómo hacer requests autenticados

```ts
// fetch
const res = await fetch('http://localhost:3000/api/v1/users', {
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include', // importante para la cookie de refresh
});

// axios
axios.defaults.withCredentials = true;
axios.get('/api/v1/users', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

---

---

## Flujo de onboarding completo

Este es el flujo que debe implementar el frontend para registrar un nuevo negocio y dejarlo operativo.

### Diagrama general

```
[Formulario de registro]
        │
        ▼
1. POST /api/v1/tenants          ← crea Tenant + User OWNER + Subscription TRIAL
        │
        │  respuesta: { tenantId, slug, message }
        ▼
2. Mostrar pantalla "Revisa tu email"
        │
        │  El usuario recibe email con enlace:
        │  https://tuapp.com/verify-email?token=<hex64chars>
        ▼
3. GET /api/v1/auth/verify-email?token=<token>   ← el frontend lo llama al cargar esa página
        │
        │  Token válido por 24 horas
        ▼
4. Redirigir a /login con mensaje de éxito
        │
        ▼
5. POST /api/v1/auth/login       ← usa ownerEmail + ownerPassword del registro
        │
        │  respuesta: { accessToken }
        │  + cookie HttpOnly: refresh_token (7 días)
        ▼
6. Guardar accessToken en memoria (NO en localStorage)
   Redirigir al dashboard del tenant
```

---

### Paso 1 — Registro del negocio

**Endpoint:** `POST /api/v1/tenants`

Lo que ocurre internamente en una **única transacción de base de datos**:
1. Valida que el email del negocio (`email`) y el email del owner (`ownerEmail`) no estén en uso
2. Genera un `slug` único a partir del nombre del negocio (ej: "Bar El Patio" → `bar-el-patio`)
3. Toma automáticamente el **plan más barato y activo** disponible (el que tenga menor `sortOrder` y `price`)
4. Crea el `Tenant` con `trialEndsAt = ahora + 7 días`
5. Crea el `User` con `role = 'owner'`, contraseña hasheada (bcrypt 12 rounds), y un token de verificación de email aleatorio (64 hex chars, expira en 24h)
6. Crea la `Subscription` con `status = 'TRIAL'`, `trialEndDate = ahora + 7 días`
7. **Fuera de la transacción:** envía el email de verificación al `ownerEmail`

**Body del formulario:**
```json
{
  "name": "Bar El Patio",
  "businessType": "bar",
  "ownerName": "Juan García",
  "email": "contacto@barpatio.com",
  "ownerFirstName": "Juan",
  "ownerLastName": "García",
  "ownerEmail": "juan@barpatio.com",
  "ownerPassword": "Seguro123!",
  "phone": "6041234567",
  "address": "Calle 45 # 12-34",
  "city": "Medellín",
  "country": "Colombia"
}
```

> `email` = email público del negocio (puede ser el mismo que `ownerEmail` o diferente)
> `ownerEmail` = email con el que el owner iniciará sesión

**Respuesta exitosa (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "bar-el-patio"
}
```

**Errores posibles:**
```
409 — "Business email already in use"       → el campo email ya está registrado
409 — "Owner email already in use"          → el ownerEmail ya tiene cuenta
409 — "Business name already taken..."      → el slug generado ya existe, cambiar el nombre
404 — "No active plans available"           → no hay planes en la BD (problema del admin)
```

---

### Paso 2 — Pantalla de "Verifica tu email"

Tras recibir el 201, el frontend debe mostrar una pantalla informando que se envió un email a `ownerEmail`. No hay nada más que llamar al backend en este paso.

El **enlace en el email** apunta a una URL del frontend que incluye el token como query param, por ejemplo:
```
https://tuapp.com/verify-email?token=a3f8e1d2c4b564ab...
```

El frontend debe leer ese `token` de la URL y disparar la llamada al siguiente paso.

---

### Paso 3 — Verificación del email

**Endpoint:** `GET /api/v1/auth/verify-email?token=<token>`

Llamar a este endpoint al montar la página `/verify-email` del frontend.

```ts
// Ejemplo Next.js / React
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const res = await fetch(`http://localhost:3000/api/v1/auth/verify-email?token=${token}`);
```

**Respuesta exitosa (200):**
```json
{ "message": "Email verified successfully. You can now log in." }
```

**Errores posibles:**
```
400 — "Invalid or expired verification token"  → token incorrecto o pasaron más de 24h
400 — "Account is already verified"            → el enlace ya fue usado antes
```

> Si el token expiró (más de 24h), el frontend deberá ofrecer reenviar el email. **Este endpoint de reenvío aún no está implementado en el backend.**

---

### Paso 4 — Login tras verificación

**Endpoint:** `POST /api/v1/auth/login`

Usar las mismas credenciales que se ingresaron en el registro (`ownerEmail` + `ownerPassword`).

```json
{
  "email": "juan@barpatio.com",
  "password": "Seguro123!"
}
```

**Respuesta exitosa (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Adicionalmente, el servidor setea automáticamente la cookie:
```
Set-Cookie: refresh_token=<jwt>; HttpOnly; SameSite=Strict; Max-Age=604800
```

**Errores posibles:**
```
401 — "Invalid credentials"                           → email o contraseña incorrectos, o usuario inactivo
403 — "Please verify your email address before..."    → el usuario intentó login antes de verificar
```

**Importante para el frontend:**
- El `accessToken` debe guardarse en **memoria** (variable de estado, contexto de React, Zustand, etc.). **Nunca en `localStorage`** por seguridad XSS.
- La cookie `refresh_token` es `HttpOnly`, el frontend nunca la ve directamente.
- Configurar el cliente HTTP con `credentials: 'include'` para que la cookie viaje en cada request.

---

### Paso 5 — Uso de la sesión autenticada

Con el `accessToken` obtenido, todas las llamadas protegidas van con:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El JWT contiene (decodificado):
```json
{
  "sub": "uuid-del-usuario",
  "email": "juan@barpatio.com",
  "role": "owner",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1709000000,
  "exp": 1709003600
}
```

El frontend puede decodificar el payload (sin verificar) para obtener `role` y `tenantId` y usarlos para mostrar/ocultar secciones de la UI.

---

### Paso 6 — Renovación del accessToken (refresh)

Cuando el `accessToken` expire (error 401), el frontend debe llamar silenciosamente:

**Endpoint:** `POST /api/v1/auth/refresh`

```ts
const res = await fetch('http://localhost:3000/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include', // envía la cookie refresh_token automáticamente
});
const { accessToken } = await res.json();
// guardar el nuevo accessToken en memoria
```

El backend implementa **rotación de refresh token**: cada llamada a `/refresh` invalida el token anterior y emite uno nuevo (tanto en la respuesta como en la cookie).

**Detección de reuso:** si alguien intenta usar un refresh token que ya fue rotado, el backend invalida **todas las sesiones** del usuario (refreshToken → null) y responde 403. En ese caso el frontend debe redirigir a login.

```
200 — { accessToken: "..." }     → renovación exitosa, nuevo token en cookie
401 — Unauthorized               → refresh token expirado o sesión no existe → ir a login
403 — "Refresh token reuse..."   → posible robo de token, sesión cerrada → ir a login
```

---

### Resumen de tiempos y TTLs

| Elemento | TTL |
|---|---|
| `accessToken` (JWT) | Según `JWT_EXPIRES_IN` del `.env` (típicamente 15m) |
| `refresh_token` (cookie + JWT) | 7 días |
| Token de verificación de email | 24 horas |
| Token de reset de contraseña | 1 hora |
| Trial del tenant | 7 días desde el registro |

---

### Estados posibles del tenant recién registrado

```
Registro exitoso
  └─ Tenant.isEmailVerified = false
  └─ Tenant.isActive = true
  └─ Subscription.status = 'TRIAL'
  └─ Subscription.trialEndDate = now + 7 días
  └─ User.isEmailVerified = false   ← no puede hacer login aún

Tras verificar email
  └─ User.isEmailVerified = true    ← puede hacer login
  (Tenant.isEmailVerified sigue false — se actualiza por separado si se implementa)

Tras activar suscripción (lo hace un admin de plataforma)
  └─ Subscription.status = 'ACTIVE'
```

---

Responde cualquier pregunta del frontend sobre esta API usando el contexto anterior. Si te preguntan por un endpoint específico, muestra el body esperado, la autenticación requerida y el formato de respuesta.
