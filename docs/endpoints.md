# ivu-shop API — Referencia de Endpoints

**Base URL:** `http://localhost:3001/api/v1`
**Formato:** JSON
**CORS origin permitido:** `http://localhost:4200` (Angular dev) — ajustar `FRONTEND_URL` en `.env`

---

## Índice

1. [Autenticación y sesión](#1-autenticación-y-sesión)
2. [Tenants — Onboarding](#2-tenants--onboarding)
3. [Usuarios](#3-usuarios)
4. [Planes](#4-planes)
5. [Suscripciones](#5-suscripciones)
6. [Productos](#6-productos)
7. [Inventario](#7-inventario)
8. [Proveedores](#8-proveedores)
9. [Compras](#9-compras)
10. [Clientes](#10-clientes)
11. [Ventas](#11-ventas)
12. [Gastos](#12-gastos)
13. [Reportes](#13-reportes)
14. [Guía Angular — configuración del cliente HTTP](#14-guía-angular--configuración-del-cliente-http)
15. [Modelos de respuesta](#15-modelos-de-respuesta)
16. [Códigos de error](#16-códigos-de-error)

---

## 1. Autenticación y sesión

El sistema usa **JWT de doble token**:

| Token | Transporte | TTL |
|---|---|---|
| `accessToken` | Header `Authorization: Bearer <token>` | 15 minutos (configurable en `JWT_EXPIRES_IN`) |
| `refresh_token` | Cookie `HttpOnly; SameSite=Strict` | 7 días |

### Payload del JWT (decodificado)
```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "role": "owner | admin | employee",
  "tenantId": "uuid-del-tenant | null",
  "iat": 1709000000,
  "exp": 1709003600
}
```

> El frontend puede decodificar el payload con `atob(token.split('.')[1])` para leer `role` y `tenantId` sin verificar la firma.

---

### POST `/api/v1/auth/register`
Registra un usuario standalone (sin tenant ni negocio). Envía email de verificación.

**Auth:** No requerida

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "García",
  "email": "juan@ejemplo.com",
  "password": "MiPass123!"
}
```

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `firstName` | string | ✅ | — |
| `lastName` | string | ✅ | — |
| `email` | string | ✅ | formato email válido |
| `password` | string | ✅ | mínimo 8 chars, 1 mayúscula, 1 número |

**Respuesta 201:**
```json
{ "message": "Registration successful. Please check your email to verify your account." }
```

---

### GET `/api/v1/auth/verify-email?token=<token>`
Verifica el email del usuario con el token recibido por correo. Llamar al montar la página `/verify-email`.

**Auth:** No requerida
**Query param:** `token` (string, 64 hex chars)

**Respuesta 200:**
```json
{ "message": "Email verified successfully. You can now log in." }
```

**Errores:**
```
400 — "Invalid or expired verification token"   → token incorrecto o >24h
400 — "Account is already verified"             → enlace ya usado
```

---

### POST `/api/v1/auth/login`
Inicia sesión. Devuelve `accessToken` en body y setea cookie `refresh_token` (HttpOnly).

**Auth:** No requerida

**Body:**
```json
{
  "email": "owner@mitienda.com",
  "password": "MiPass123!"
}
```

**Respuesta 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> La cookie `refresh_token` se setea automáticamente. Angular debe tener `withCredentials: true` en el `HttpClient`.

**Errores:**
```
401 — "Invalid credentials"                              → email o contraseña incorrectos
403 — "Please verify your email address before logging in" → no verificó el email
```

---

### POST `/api/v1/auth/refresh`
Renueva el `accessToken` usando la cookie `refresh_token`. Implementa **rotación**: cada llamada invalida el token anterior y emite uno nuevo.

**Auth:** Cookie `refresh_token` (se envía automáticamente con `withCredentials: true`)
**Body:** vacío

**Respuesta 200:**
```json
{ "accessToken": "eyJhbGc..." }
```

**Errores:**
```
401 — token expirado o sesión inexistente  → redirigir a /login
403 — "Refresh token reuse detected"       → posible robo; sesión cerrada → redirigir a /login
```

> **Estrategia recomendada en Angular:** usar un `HttpInterceptor` que ante un 401 llame a `/auth/refresh`, guarde el nuevo `accessToken` en memoria y reintente la petición original automáticamente.

---

### POST `/api/v1/auth/logout`
Cierra la sesión, invalida el refresh token y borra la cookie.

**Auth:** `Authorization: Bearer <accessToken>`
**Body:** vacío

**Respuesta 200:**
```json
{ "message": "Logged out successfully" }
```

---

### POST `/api/v1/auth/forgot-password`
Envía email con enlace de reset si el correo existe. Siempre responde igual (seguridad anti-enumeración).

**Auth:** No requerida

**Body:**
```json
{ "email": "usuario@ejemplo.com" }
```

**Respuesta 200:**
```json
{ "message": "If that email exists, a reset link has been sent." }
```

---

### POST `/api/v1/auth/reset-password`
Restablece la contraseña con el token del email. Invalida todas las sesiones previas.

**Auth:** No requerida

**Body:**
```json
{
  "token": "a3f8e1d2c4b564ab...",
  "password": "NuevaPass123!"
}
```

**Respuesta 200:**
```json
{ "message": "Password reset successfully." }
```

**Errores:**
```
400 — "Invalid or expired reset token"   → token incorrecto o >1h
```

---

## 2. Tenants — Onboarding

### POST `/api/v1/tenants`
**Registro de negocio nuevo.** En una única transacción crea: Tenant + User OWNER + Subscription TRIAL. Envía email de verificación al owner.

**Auth:** No requerida

**Body:**
```json
{
  "name": "Tienda El Éxito",
  "businessType": "minimarket",
  "ownerName": "Carlos Pérez",
  "email": "contacto@tienda.com",
  "ownerFirstName": "Carlos",
  "ownerLastName": "Pérez",
  "ownerEmail": "carlos@tienda.com",
  "ownerPassword": "Seguro123!",
  "phone": "3001234567",
  "address": "Calle 45 # 12-34",
  "city": "Medellín",
  "country": "Colombia"
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | ✅ | Nombre del negocio |
| `businessType` | enum | ✅ | `bar \| minimarket \| auto_parts_shop \| clothing_store \| shoe_store` |
| `ownerName` | string | ✅ | Nombre de contacto del negocio |
| `email` | string | ✅ | Email público del negocio |
| `ownerFirstName` | string | ✅ | — |
| `ownerLastName` | string | ✅ | — |
| `ownerEmail` | string | ✅ | Email con el que el owner hará login |
| `ownerPassword` | string | ✅ | Mínimo 8 chars, 1 mayúscula, 1 número |
| `phone` | string | ❌ | — |
| `address` | string | ❌ | — |
| `city` | string | ❌ | — |
| `country` | string | ❌ | Default `"Colombia"` |

**Respuesta 201:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "tienda-el-exito"
}
```

**Errores:**
```
409 — "Business email already in use"
409 — "Owner email already in use"
409 — "Business name already taken..."
404 — "No active plans available"
```

---

### GET `/api/v1/tenants/:id`
Obtiene datos de un tenant.

**Auth:** Bearer token | Roles: `owner` (solo su propio tenant), `admin`

**Respuesta 200:** Objeto [Tenant](#tenant)

---

### PATCH `/api/v1/tenants/:id`
Actualiza datos del negocio.

**Auth:** Bearer token | Rol: `owner`

**Body (todos opcionales):**
```json
{
  "name": "Nuevo nombre",
  "phone": "3009876543",
  "address": "Nueva dirección",
  "city": "Bogotá",
  "country": "Colombia",
  "logoUrl": "https://cdn.ejemplo.com/logo.png"
}
```

**Respuesta 200:** Objeto [Tenant](#tenant)

---

### DELETE `/api/v1/tenants/:id`
Desactiva un tenant (soft delete).

**Auth:** Bearer token | Rol: `admin`
**Respuesta 204:** Sin contenido

---

## 3. Usuarios

Todos los endpoints requieren `Authorization: Bearer <accessToken>`. Los usuarios solo ven/gestionan usuarios de su mismo tenant (scoping automático por `tenantId` del JWT).

### GET `/api/v1/users`
Lista usuarios activos. Los `admin` ven todos los tenants; `owner` y `employee` solo ven su tenant.

**Auth:** Bearer token (cualquier rol)

**Respuesta 200:** Array de [User](#user)

---

### GET `/api/v1/users/:id`
Obtiene un usuario por ID.

**Auth:** Bearer token

**Respuesta 200:** Objeto [User](#user)

---

### POST `/api/v1/users`
Crea un nuevo usuario dentro del tenant. El `tenantId` se toma del JWT.

**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{
  "firstName": "María",
  "lastName": "López",
  "email": "maria@tienda.com",
  "password": "Segura123!",
  "role": "employee",
  "phone": "3001234567"
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `firstName` | string | ✅ | — |
| `lastName` | string | ✅ | — |
| `email` | string | ✅ | — |
| `password` | string | ✅ | — |
| `role` | enum | ❌ | `owner \| admin \| employee` — default: `employee` |
| `phone` | string | ❌ | — |

**Respuesta 201:** Objeto [User](#user)

---

### PATCH `/api/v1/users/:id`
Actualiza datos de un usuario del mismo tenant.

**Auth:** Bearer token | Roles: `owner`, `admin`

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

**Respuesta 200:** Objeto [User](#user)

---

### DELETE `/api/v1/users/:id`
Desactiva un usuario (soft delete, `isActive = false`).

**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

## 4. Planes

### GET `/api/v1/plans` — Público
Lista los planes activos y públicos (para página de precios).

**Auth:** No requerida

**Respuesta 200:** Array de [Plan](#plan)

---

### GET `/api/v1/plans/:id` — Público
**Auth:** No requerida
**Respuesta 200:** Objeto [Plan](#plan)

---

### POST `/api/v1/plans`
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

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | ✅ |
| `price` | number | ✅ |
| `maxUsers` | int | ✅ |
| `description` | string | ❌ |
| `currency` | string | ❌ default `"COP"` |
| `billingCycle` | enum | ❌ `MONTHLY \| YEARLY` default `MONTHLY` |
| `maxProducts` | int | ❌ `-1` = ilimitado |
| `features` | string[] | ❌ |
| `isActive` | boolean | ❌ default `true` |
| `isPublic` | boolean | ❌ default `true` |
| `sortOrder` | int | ❌ default `0` |

**Respuesta 201:** Objeto [Plan](#plan)

---

### PATCH `/api/v1/plans/:id`
**Auth:** Bearer token | Rol: `admin`
**Body:** Igual que POST, todos opcionales.
**Respuesta 200:** Objeto [Plan](#plan)

---

### DELETE `/api/v1/plans/:id`
Desactiva un plan (`isActive = false`).
**Auth:** Bearer token | Rol: `admin`
**Respuesta 204:** Sin contenido

---

## 5. Suscripciones

### GET `/api/v1/subscriptions/my`
Suscripciones del tenant del usuario autenticado. Incluye datos del plan.

**Auth:** Bearer token (cualquier rol)

**Respuesta 200:** Array de [Subscription](#subscription) con `plan` poblado

---

### POST `/api/v1/subscriptions/:id/cancel`
**Auth:** Bearer token | Rol: `owner`

**Body (opcional):**
```json
{ "reason": "Ya no necesito el servicio" }
```

**Respuesta 200:** Objeto [Subscription](#subscription)

---

### POST `/api/v1/subscriptions/:id/activate`
**Auth:** Bearer token | Rol: `admin`
**Body:** vacío
**Respuesta 200:** Objeto [Subscription](#subscription)

---

## 6. Productos

### GET `/api/v1/products/categories`
Lista categorías del tenant ordenadas por nombre.

**Auth:** Bearer token (cualquier rol)
**Respuesta 200:**
```json
[
  { "id": "uuid", "tenantId": "uuid", "name": "Bebidas" }
]
```

---

### POST `/api/v1/products/categories`
**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{ "name": "Bebidas" }
```

**Respuesta 201:** Objeto categoria

---

### DELETE `/api/v1/products/categories/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

### GET `/api/v1/products`
Lista todos los productos activos del tenant con sus categorías y códigos de barra.

**Auth:** Bearer token (cualquier rol)

**Respuesta 200:** Array de [Product](#product)

---

### GET `/api/v1/products/:id`
**Auth:** Bearer token
**Respuesta 200:** Objeto [Product](#product)

---

### GET `/api/v1/products/barcode/:barcode`
Búsqueda por código de barras — optimizado para POS.

**Auth:** Bearer token

**Respuesta 200:** Objeto [Product](#product)

**Errores:**
```
404 — producto no encontrado o inactivo
```

---

### POST `/api/v1/products`
**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{
  "name": "Cerveza Club Colombia 330ml",
  "description": "Cerveza lager nacional",
  "price": 3500,
  "cost": 2200,
  "tax": 19,
  "minStock": 12,
  "initialStock": 48,
  "categoryIds": ["uuid-categoria"],
  "barcodes": ["7702011006061"]
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | ✅ | máx 200 chars |
| `price` | number | ✅ | precio de venta base (sin impuesto) |
| `description` | string | ❌ | — |
| `cost` | number | ❌ | costo unitario — default `0` |
| `tax` | int | ❌ | porcentaje IVA — default `0` |
| `minStock` | int | ❌ | stock mínimo para alerta — default `0` |
| `initialStock` | int | ❌ | si > 0 crea movimiento INITIAL en inventario |
| `categoryIds` | uuid[] | ❌ | IDs de categorías existentes |
| `barcodes` | string[] | ❌ | uno o varios códigos de barra |

**Respuesta 201:** Objeto [Product](#product)

---

### PATCH `/api/v1/products/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`

**Body (todos opcionales):**
```json
{
  "name": "Nuevo nombre",
  "price": 4000,
  "cost": 2500,
  "tax": 19,
  "minStock": 6,
  "isActive": false,
  "categoryIds": ["uuid"],
  "barcodes": ["7702011006062"]
}
```

> Enviar `categoryIds: []` elimina todas las categorías. Enviar `barcodes: []` elimina todos los códigos.

**Respuesta 200:** Objeto [Product](#product)

---

### DELETE `/api/v1/products/:id`
Desactiva el producto (`isActive = false`).

**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

## 7. Inventario

### GET `/api/v1/inventory/product/:productId`
Historial de movimientos de un producto.

**Auth:** Bearer token | Roles: `owner`, `admin`

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "productId": "uuid",
    "type": "ENTRY",
    "quantity": 24,
    "costAtMovement": 2200,
    "referenceType": "PURCHASE",
    "referenceId": "uuid-factura",
    "note": "Factura de compra F-001",
    "createdAt": "2025-03-01T10:00:00Z"
  }
]
```

**Tipos de movimiento:** `INITIAL | ENTRY | EXIT | ADJUSTMENT | SALE | RETURN`

---

### GET `/api/v1/inventory/low-stock`
Productos donde `stock <= minStock`.

**Auth:** Bearer token | Roles: `owner`, `admin`

**Respuesta 200:** Array de [Product](#product)

---

### POST `/api/v1/inventory/adjust`
Registra un ajuste manual de inventario.

**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{
  "productId": "uuid",
  "quantity": -3,
  "note": "Merma por vencimiento"
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `productId` | uuid | ✅ | — |
| `quantity` | int | ✅ | positivo = entrada, negativo = salida |
| `note` | string | ❌ | — |

**Respuesta 201:** Objeto InventoryMovement

---

## 8. Proveedores

### GET `/api/v1/suppliers`
**Auth:** Bearer token (cualquier rol)
**Respuesta 200:** Array de [Supplier](#supplier)

---

### GET `/api/v1/suppliers/:id`
**Auth:** Bearer token
**Respuesta 200:** Objeto [Supplier](#supplier)

---

### POST `/api/v1/suppliers`
**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{
  "name": "Distribuidora Bavaria S.A.",
  "phone": "6012345678",
  "email": "ventas@bavaria.com",
  "address": "Cra 50 # 10-20, Bogotá",
  "notes": "Entrega los martes"
}
```

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | ✅ |
| `phone` | string | ❌ |
| `email` | string | ❌ |
| `address` | string | ❌ |
| `notes` | string | ❌ |

**Respuesta 201:** Objeto [Supplier](#supplier)

---

### PATCH `/api/v1/suppliers/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`
**Body:** Igual que POST, todos opcionales.
**Respuesta 200:** Objeto [Supplier](#supplier)

---

### DELETE `/api/v1/suppliers/:id`
Desactiva el proveedor.
**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

## 9. Compras

### GET `/api/v1/purchases`
Lista todas las facturas de compra del tenant.

**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 200:** Array de [PurchaseInvoice](#purchaseinvoice)

---

### GET `/api/v1/purchases/pending`
Lista facturas con estado `PENDING` o `PARTIAL`, ordenadas por fecha de vencimiento.

**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 200:** Array de [PurchaseInvoice](#purchaseinvoice)

---

### GET `/api/v1/purchases/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 200:** Objeto [PurchaseInvoice](#purchaseinvoice) con `items` y `items.product`

---

### POST `/api/v1/purchases`
Registra una factura de compra. Actualiza automáticamente el **costo promedio ponderado** y el **stock** de cada producto dentro de una transacción.

**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{
  "supplierId": "uuid",
  "invoiceNumber": "F-2025-001",
  "invoiceDate": "2025-03-20",
  "dueDate": "2025-04-20",
  "paymentType": "CREDIT",
  "notes": "Pedido mensual",
  "items": [
    {
      "productId": "uuid-producto",
      "quantity": 24,
      "unitCost": 2100,
      "taxPercent": 19
    }
  ]
}
```

| Campo raíz | Tipo | Requerido | Notas |
|---|---|---|---|
| `supplierId` | uuid | ✅ | — |
| `invoiceNumber` | string | ✅ | — |
| `invoiceDate` | date (ISO) | ✅ | `"YYYY-MM-DD"` |
| `paymentType` | enum | ✅ | `CASH \| CREDIT` |
| `dueDate` | date (ISO) | ❌ | Requerido si `CREDIT` |
| `notes` | string | ❌ | — |
| `items` | array | ✅ | Al menos 1 item |

| Campo de item | Tipo | Requerido | Notas |
|---|---|---|---|
| `productId` | uuid | ✅ | — |
| `quantity` | int ≥ 1 | ✅ | — |
| `unitCost` | number ≥ 0 | ✅ | Costo unitario de esta compra |
| `taxPercent` | int | ❌ | default `0` |

> Si `paymentType = CASH` → `status = PAID` automáticamente.
> Si `paymentType = CREDIT` → `status = PENDING`.

**Respuesta 201:** Objeto [PurchaseInvoice](#purchaseinvoice)

---

### PATCH `/api/v1/purchases/:id/status`
Actualiza el estado de una factura (ej: marcar como pagada).

**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{ "status": "PAID" }
```

`status`: `PENDING | PAID | PARTIAL`

**Respuesta 200:** Objeto [PurchaseInvoice](#purchaseinvoice)

---

## 10. Clientes

### GET `/api/v1/customers`
**Auth:** Bearer token (cualquier rol)
**Respuesta 200:** Array de [Customer](#customer)

---

### GET `/api/v1/customers/:id`
**Auth:** Bearer token
**Respuesta 200:** Objeto [Customer](#customer)

---

### POST `/api/v1/customers`
**Auth:** Bearer token | Roles: `owner`, `admin`, `employee`

**Body:**
```json
{
  "name": "Pedro Rodríguez",
  "documentId": "1234567890",
  "phone": "3151234567",
  "email": "pedro@gmail.com",
  "address": "Calle 10 # 5-20",
  "notes": "Cliente frecuente"
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | ✅ | máx 200 |
| `documentId` | string | ❌ | NIT o cédula para facturación |
| `phone` | string | ❌ | — |
| `email` | string | ❌ | — |
| `address` | string | ❌ | — |
| `notes` | string | ❌ | — |

**Respuesta 201:** Objeto [Customer](#customer)

---

### PATCH `/api/v1/customers/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`, `employee`
**Body:** Igual que POST + `isActive?: boolean`, todos opcionales.
**Respuesta 200:** Objeto [Customer](#customer)

---

### DELETE `/api/v1/customers/:id`
Desactiva el cliente.
**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

## 11. Ventas

### GET `/api/v1/sales`
Lista todas las ventas del tenant.

**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 200:** Array de [Sale](#sale)

---

### GET `/api/v1/sales/:id`
**Auth:** Bearer token (cualquier rol)
**Respuesta 200:** Objeto [Sale](#sale) con `items`

---

### POST `/api/v1/sales`
Registra una venta. Valida stock, toma snapshot de precio y costo, descuenta inventario.

**Auth:** Bearer token (cualquier rol)

**Body:**
```json
{
  "customerId": "uuid",
  "paymentType": "CASH",
  "discount": 500,
  "notes": "Cliente con tarjeta fidelidad",
  "items": [
    {
      "productId": "uuid-producto",
      "quantity": 2,
      "discount": 0
    }
  ]
}
```

| Campo raíz | Tipo | Requerido | Notas |
|---|---|---|---|
| `paymentType` | enum | ✅ | `CASH \| CARD \| TRANSFER \| CREDIT` |
| `items` | array | ✅ | Al menos 1 item |
| `customerId` | uuid | ❌ | Venta anónima si se omite |
| `discount` | number | ❌ | Descuento a nivel de venta (monto fijo) |
| `notes` | string | ❌ | — |

| Campo de item | Tipo | Requerido | Notas |
|---|---|---|---|
| `productId` | uuid | ✅ | — |
| `quantity` | int ≥ 1 | ✅ | — |
| `discount` | number | ❌ | Descuento por item (monto fijo) — default `0` |

> **Fórmula de totales:**
> - `itemSubtotal = unitPrice * quantity - itemDiscount`
> - `itemTax = itemSubtotal * (taxPercent / 100)`
> - `saleSubtotal = Σ itemSubtotal`
> - `saleTaxAmount = Σ itemTax`
> - `saleTotal = saleSubtotal + saleTaxAmount - saleDiscount`

**Respuesta 201:** Objeto [Sale](#sale) con `items`

**Errores:**
```
400 — "Sale must have at least one item"
400 — "One or more products not found or inactive"
400 — "Insufficient stock for product 'X'. Available: N"
```

---

### POST `/api/v1/sales/:id/cancel`
Cancela una venta y restaura el stock de todos los items.

**Auth:** Bearer token | Roles: `owner`, `admin`
**Body:** vacío

**Respuesta 200:** Objeto [Sale](#sale) con `status: "CANCELLED"`

**Errores:**
```
400 — "Sale is already cancelled"
```

---

## 12. Gastos

### GET `/api/v1/expenses/categories`
**Auth:** Bearer token (cualquier rol)
**Respuesta 200:**
```json
[{ "id": "uuid", "tenantId": "uuid", "name": "Servicios públicos" }]
```

---

### POST `/api/v1/expenses/categories`
**Auth:** Bearer token | Roles: `owner`, `admin`

**Body:**
```json
{ "name": "Servicios públicos" }
```

**Respuesta 201:** Objeto categoría

---

### DELETE `/api/v1/expenses/categories/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

### GET `/api/v1/expenses`
**Auth:** Bearer token (cualquier rol)
**Respuesta 200:** Array de [Expense](#expense) ordenados por fecha descendente

---

### GET `/api/v1/expenses/:id`
**Auth:** Bearer token
**Respuesta 200:** Objeto [Expense](#expense)

---

### POST `/api/v1/expenses`
**Auth:** Bearer token | Roles: `owner`, `admin`, `employee`

**Body:**
```json
{
  "description": "Pago de energía eléctrica",
  "amount": 185000,
  "expenseDate": "2025-03-20",
  "paymentType": "TRANSFER",
  "categoryId": "uuid-categoria",
  "notes": "Factura EPM marzo"
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `description` | string | ✅ | máx 255 chars |
| `amount` | number ≥ 0 | ✅ | — |
| `expenseDate` | date (ISO) | ✅ | `"YYYY-MM-DD"` |
| `paymentType` | enum | ✅ | `CASH \| CARD \| TRANSFER` |
| `categoryId` | uuid | ❌ | — |
| `notes` | string | ❌ | — |

**Respuesta 201:** Objeto [Expense](#expense)

---

### PATCH `/api/v1/expenses/:id`
**Auth:** Bearer token | Roles: `owner`, `admin`
**Body:** Igual que POST, todos opcionales.
**Respuesta 200:** Objeto [Expense](#expense)

---

### DELETE `/api/v1/expenses/:id`
Elimina el gasto definitivamente.
**Auth:** Bearer token | Roles: `owner`, `admin`
**Respuesta 204:** Sin contenido

---

## 13. Reportes

Todos requieren `Authorization: Bearer <accessToken>` con rol `owner` o `admin`.

### GET `/api/v1/reports/dashboard?from=&to=`
Resumen ejecutivo del período.

**Query params:** `from` y `to` en formato `YYYY-MM-DD`

**Respuesta 200:**
```json
{
  "period": { "from": "2025-03-01", "to": "2025-03-31" },
  "sales": {
    "count": 142,
    "revenue": 4850000,
    "taxCollected": 736000,
    "totalDiscounts": 25000
  },
  "profitability": {
    "cogs": 2900000,
    "grossProfit": 1950000,
    "grossMargin": 40.21,
    "expenses": 450000,
    "netProfit": 1500000,
    "netMargin": 30.93
  },
  "inventory": {
    "lowStockCount": 3
  },
  "purchases": {
    "pendingAmount": 850000
  }
}
```

---

### GET `/api/v1/reports/profit-loss?from=&to=`
Estado de Pérdidas y Ganancias con detalle diario.

**Query params:** `from`, `to` (`YYYY-MM-DD`)

**Respuesta 200:**
```json
{
  "period": { "from": "2025-03-01", "to": "2025-03-31" },
  "revenue": 4850000,
  "cogs": 2900000,
  "grossProfit": 1950000,
  "grossMargin": 40.21,
  "expenses": 450000,
  "netProfit": 1500000,
  "netMargin": 30.93,
  "dailySales": [
    { "date": "2025-03-01T00:00:00Z", "salesCount": 8, "revenue": 180000 }
  ],
  "expensesByCategory": [
    { "categoryId": "uuid", "total": 185000 }
  ]
}
```

---

### GET `/api/v1/reports/top-products?from=&to=`
Top 10 productos más vendidos por ingresos.

**Query params:** `from`, `to` (`YYYY-MM-DD`)

**Respuesta 200:**
```json
[
  {
    "productId": "uuid",
    "name": "Cerveza Club Colombia 330ml",
    "unitsSold": 384,
    "revenue": 1344000,
    "cogs": 844800,
    "profit": 499200
  }
]
```

---

### GET `/api/v1/reports/inventory`
Valorización completa del inventario. Sin parámetros.

**Respuesta 200:**
```json
{
  "summary": {
    "totalProducts": 45,
    "totalCostValue": 12500000,
    "totalRetailValue": 19800000,
    "potentialProfit": 7300000,
    "lowStockCount": 3
  },
  "products": [
    {
      "id": "uuid",
      "name": "Cerveza Club Colombia 330ml",
      "stock": 48,
      "cost": 2200,
      "price": 3500,
      "minStock": 12,
      "costValue": 105600,
      "retailValue": 168000,
      "isLowStock": false
    }
  ]
}
```

---

## 14. Guía Angular — configuración del cliente HTTP

### 14.1 Configuración global (`app.config.ts`)

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // ...
  ],
};
```

---

### 14.2 Servicio de autenticación

```typescript
// auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:3001/api/v1';

  // Guardar accessToken en memoria (NUNCA en localStorage)
  private _accessToken = signal<string | null>(null);
  readonly accessToken = this._accessToken.asReadonly();

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string }>(
        `${this.API}/auth/login`,
        { email, password },
        { withCredentials: true }   // ← necesario para recibir la cookie
      )
      .pipe(tap(({ accessToken }) => this._accessToken.set(accessToken)));
  }

  refresh() {
    return this.http
      .post<{ accessToken: string }>(
        `${this.API}/auth/refresh`,
        {},
        { withCredentials: true }   // ← necesario para enviar la cookie
      )
      .pipe(tap(({ accessToken }) => this._accessToken.set(accessToken)));
  }

  logout() {
    return this.http
      .post(`${this.API}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this._accessToken.set(null)));
  }

  getDecodedToken(): { sub: string; email: string; role: string; tenantId: string } | null {
    const token = this._accessToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
```

---

### 14.3 Interceptor con refresh automático

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.accessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true })
    : req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // Token expirado → intentar renovar
        return authService.refresh().pipe(
          switchMap((res) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              withCredentials: true,
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh falló → ir a login
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

### 14.4 Flujo de onboarding completo

```
1. Formulario de registro  →  POST /api/v1/tenants
2. Pantalla "Revisa tu email"
3. El usuario abre el enlace del email:
      https://tuapp.com/verify-email?token=<hex64>
4. Angular lee el token de la URL y llama:
      GET /api/v1/auth/verify-email?token=<token>
5. Redirigir a /login con mensaje de éxito
6. Formulario de login  →  POST /api/v1/auth/login
7. Guardar accessToken en el AuthService (memoria)
8. Redirigir al dashboard
```

---

### 14.5 Vistas sugeridas para Angular

| Ruta Angular | Descripción | Módulo API |
|---|---|---|
| `/register` | Registro de negocio nuevo | `POST /tenants` |
| `/verify-email` | Verificación de email | `GET /auth/verify-email` |
| `/login` | Login | `POST /auth/login` |
| `/forgot-password` | Solicitar reset | `POST /auth/forgot-password` |
| `/reset-password` | Nueva contraseña | `POST /auth/reset-password` |
| `/dashboard` | KPIs del período | `GET /reports/dashboard` |
| `/products` | Catálogo + búsqueda | `GET /products` |
| `/products/new` | Crear producto | `POST /products` |
| `/products/:id` | Editar producto | `PATCH /products/:id` |
| `/inventory` | Movimientos + bajo stock | `GET /inventory/low-stock` |
| `/inventory/adjust` | Ajuste manual | `POST /inventory/adjust` |
| `/suppliers` | Lista proveedores | `GET /suppliers` |
| `/purchases` | Facturas de compra | `GET /purchases` |
| `/purchases/new` | Registrar factura | `POST /purchases` |
| `/purchases/pending` | Cuentas por pagar | `GET /purchases/pending` |
| `/pos` | Punto de venta | `POST /sales` |
| `/sales` | Historial de ventas | `GET /sales` |
| `/customers` | Lista clientes | `GET /customers` |
| `/expenses` | Lista gastos | `GET /expenses` |
| `/expenses/new` | Registrar gasto | `POST /expenses` |
| `/reports/profit-loss` | P&L mensual | `GET /reports/profit-loss` |
| `/reports/top-products` | Mejores productos | `GET /reports/top-products` |
| `/reports/inventory` | Valorización | `GET /reports/inventory` |
| `/settings/users` | Usuarios del tenant | `GET /users` |
| `/settings/profile` | Perfil del negocio | `GET/PATCH /tenants/:id` |
| `/settings/subscription` | Plan y suscripción | `GET /subscriptions/my` |
| `/admin/tenants` | (admin) Todos tenants | `GET /tenants` |
| `/admin/plans` | (admin) Gestión planes | `GET/POST/PATCH /plans` |

---

## 15. Modelos de respuesta

### User
```typescript
interface User {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'owner' | 'admin' | 'employee';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;   // ISO 8601
  createdAt: string;
  updatedAt: string;
}
```

### Tenant
```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  businessType: 'bar' | 'minimarket' | 'auto_parts_shop' | 'clothing_store' | 'shoe_store';
  ownerName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  logoUrl: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Plan
```typescript
interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  maxUsers: number;
  maxProducts: number;        // -1 = ilimitado
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### Subscription
```typescript
interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  autoRenew: boolean;
  plan: Plan;                  // poblado en GET /subscriptions/my
  createdAt: string;
  updatedAt: string;
}
```

### Product
```typescript
interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  tax: number;                 // porcentaje IVA
  stock: number;
  minStock: number;
  isActive: boolean;
  categories: ProductCategory[];
  barcodes: ProductBarcode[];
  createdAt: string;
  updatedAt: string;
}

interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
}

interface ProductBarcode {
  id: string;
  tenantId: string;
  productId: string;
  barcode: string;
}
```

### Supplier
```typescript
interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### PurchaseInvoice
```typescript
interface PurchaseInvoice {
  id: string;
  tenantId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;         // "YYYY-MM-DD"
  dueDate: string | null;
  paymentType: 'CASH' | 'CREDIT';
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  items: PurchaseInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

interface PurchaseInvoiceItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  taxPercent: number;
  subtotal: number;
  product?: Product;
}
```

### Customer
```typescript
interface Customer {
  id: string;
  tenantId: string;
  name: string;
  documentId: string | null;   // NIT o cédula
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Sale
```typescript
interface Sale {
  id: string;
  tenantId: string;
  customerId: string | null;
  userId: string;
  saleDate: string;            // ISO 8601
  paymentType: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING';
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

interface SaleItem {
  id: string;
  tenantId: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;           // precio en el momento de la venta
  costAtSale: number;          // costo en el momento de la venta
  taxPercent: number;
  discount: number;
  subtotal: number;
  createdAt: string;
}
```

### Expense
```typescript
interface Expense {
  id: string;
  tenantId: string;
  categoryId: string | null;
  userId: string;
  description: string;
  amount: number;
  expenseDate: string;         // "YYYY-MM-DD"
  paymentType: 'CASH' | 'CARD' | 'TRANSFER';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 16. Códigos de error

| HTTP | Causa típica | Qué mostrar en UI |
|---|---|---|
| `400` | Validación fallida, campos inválidos, stock insuficiente | Mensaje del campo `message` |
| `401` | Token expirado o no enviado | Redirigir a /login (o intentar refresh primero) |
| `403` | Rol insuficiente, refresh token reutilizado | Mensaje de acceso denegado |
| `404` | Recurso no encontrado | Mensaje "no encontrado" |
| `409` | Email o slug duplicado | Mostrar campo específico (`message` lo indica) |
| `500` | Error interno del servidor | Mensaje genérico, reportar al equipo |

**Formato de error estándar:**
```json
{
  "statusCode": 400,
  "message": "One or more products not found or inactive",
  "error": "Bad Request"
}
```

> Para errores de validación (400), `message` puede ser un **array** con los mensajes de cada campo fallido:
```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "price must not be less than 0"
  ],
  "error": "Bad Request"
}
```
