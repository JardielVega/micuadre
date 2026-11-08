# Cuadre: inventario y cuadre diario de una tienda

Aplicación web full-stack con **Node.js, Express y PostgreSQL** para controlar el inventario de una tienda y hacer el cuadre del día.

- El **Jefe** publica los productos (nombre, precio de compra, precio a vender y cantidad), gestiona a sus dependientes y ve las ganancias en el cuadre.
- El **Dependiente** solo ve el inventario (cantidad y precio de venta), vende con un carrito y finaliza el día.

## Funcionalidades

- Pantalla de entrada: *¿Eres Dependiente o Jefe?*
  - **Dependiente**: inicia sesión con el usuario y la contraseña que le dio el jefe.
  - **Jefe**: inicia sesión o crea su perfil nuevo (cada jefe tiene su propia tienda, aislada de las demás).
- Registro y login con **JWT** (cookie `httpOnly`) y contraseñas con **bcrypt**.
- Dos roles: `jefe` (equivale a *admin*) y `dependiente` (equivale a *user*).
- **CRUD de productos** (jefe) con búsqueda por nombre, filtros (stock bajo, agotados, inactivos) y **paginación** (`?page=2&limit=10`).
- **CRUD de dependientes** (jefe): crear, activar/desactivar y eliminar.
- **Vender** (dependiente): carrito con los productos del inventario, confirmar venta, ver las ventas registradas, anular una venta (devuelve el stock) y **Finalizar día**.
- **Cuadre** (jefe): ventas, costo y ganancia por día finalizado, detalle por producto, filtro por fechas, paginación y ventas aún pendientes de cerrar.
- El **precio de compra nunca se envía al dependiente** (se excluye en la consulta, no solo en la vista).
- Los precios se copian en cada venta: cambiar un precio después **no altera los cuadres anteriores**.
- Manejo global de errores, páginas 404/403/500, `helmet`, validación con `express-validator` y límite de intentos en el login.
- Tests con Jest + supertest y Docker Compose con PostgreSQL.

## Tecnologías

- Node.js 22 · Express 5
- PostgreSQL + Sequelize
- JWT + bcryptjs
- EJS (layout + partials), Tailwind CSS, Geist y Phosphor Icons, tema claro y oscuro
- Helmet · express-validator · express-rate-limit
- Jest + supertest · Docker

## Estructura (MVC)

```
config/        conexión a la base de datos
models/        User, Product, Sale, SaleItem, Closure (aquí vive la lógica de negocio)
controllers/   reciben la petición y responden
routes/        URLs de cada módulo
middlewares/   auth (JWT y roles), errores, flash, validaciones
views/         layouts, partials y páginas EJS
public/        css (Tailwind compilado), fuentes y js (carrito)
assets/        iconos SVG usados en las vistas
api/           punto de entrada para Vercel
scripts/       seed con datos de demostración
tests/         pruebas automáticas
```

## Instalación local

Necesitas Node.js 20+ y PostgreSQL (la forma más fácil es Docker).

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Levantar PostgreSQL con Docker:
   ```bash
   docker compose up -d db
   ```
3. Crear el archivo `.env` a partir del ejemplo y poner un `JWT_SECRET` largo y aleatorio:
   ```bash
   cp .env.example .env
   ```
4. (Opcional) cargar datos de demostración:
   ```bash
   npm run seed
   ```
5. Iniciar la aplicación y abrir <http://localhost:3000>:
   ```bash
   npm start
   ```

Las tablas se crean solas al arrancar. Con `npm run dev` se reinicia al guardar y recompila Tailwind.

### Datos de demostración (`npm run seed`)

| Rol | Usuario | Contraseña |
|---|---|---|
| Jefe | `jefe` | `jefe123` |
| Dependiente | `dependiente` | `dependiente123` |

Son solo para desarrollo local (no los uses en una base de datos publicada). Sin el seed, entra como jefe, crea tu perfil y luego crea dependientes desde el menú *Dependientes*.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Texto secreto para firmar los tokens |
| `NODE_ENV` | `development` o `production` |
| `PORT` | Puerto (por defecto 3000) |
| `DB_SSL` | `true` si el proveedor de PostgreSQL exige SSL |

## Tests

```bash
npm test
```

Usan la base `tienda_test` (la crea el contenedor de Docker). Cubren login, roles, que el precio de compra no se filtre al dependiente, CRUD, paginación/búsqueda, stock, anular ventas y el cálculo del cuadre.

## Flujo de uso

1. El jefe crea su perfil, carga los productos y crea las cuentas de sus dependientes.
2. El dependiente entra, arma el carrito en **Vender** y confirma cada venta.
3. Al terminar, el dependiente pulsa **Finalizar día**.
4. El jefe abre **Cuadre**, ve el total vendido, el costo y la ganancia, y el detalle por producto.

## Despliegue (Vercel + Neon)

La aplicación se despliega en **Vercel** y usa **PostgreSQL en Neon**.

1. En [Neon](https://neon.com) crea un proyecto y copia la cadena de conexión con **Connection pooling** activado. Debe terminar en `?sslmode=require`.
2. En [Vercel](https://vercel.com/new) importa este repositorio de GitHub.
3. Antes de desplegar, en **Environment Variables** agrega:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena de conexión de Neon |
   | `JWT_SECRET` | un texto largo y aleatorio |
   | `DB_SSL` | `true` |

4. Pulsa **Deploy**. Las tablas se crean solas en la primera visita.

Los secretos solo viven en las variables de entorno de Vercel, nunca en el repositorio. En producción no se ejecuta `npm run seed`: el jefe se registra desde **Crear perfil**.

### Enlace en producción

(pendiente de agregar)

## Créditos

- Iconos: [Phosphor Icons](https://phosphoricons.com) (MIT), copiados en `assets/icons`.
- Ilustración de la pantalla de inicio: `trending-up` de [Tabler Icons](https://tabler.io/icons) (MIT).
- Tipografías: Geist y Geist Mono (SIL Open Font License), en `public/fonts`.
