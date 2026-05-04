# NormaAI Legal — Portal de Clientes

## Stack
- **Frontend**: HTML/CSS/JS vanilla (igual que FMA)
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (Auth + PostgreSQL)
- **Deploy**: Vercel
- **IA**: Anthropic Claude

## Estructura
```
normaai-legal/
├── public/
│   ├── login.html       ← Página de acceso
│   └── dashboard.html   ← Portal principal (noticias + agente IA)
├── server.js            ← API backend
├── package.json
├── vercel.json
└── normaai-schema.sql   ← Ejecutar en Supabase primero
```

## Deploy paso a paso

### 1. Supabase
1. Abre tu proyecto en supabase.com
2. Ve a SQL Editor
3. Ejecuta el contenido de `normaai-schema.sql`

### 2. Variables de entorno en Vercel
En el proyecto de Vercel, agrega estas variables:
```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key (Settings → API)
ANTHROPIC_API_KEY=sk-ant-tu-clave
LIMITE_CONSULTAS_MES=100
```

### 3. GitHub + Vercel
```bash
git init
git add .
git commit -m "NormaAI Legal Portal v1.0"
git remote add origin https://github.com/Isonauta/normaai-legal-portal.git
git push -u origin main
```
Luego conectar en Vercel y agregar dominio `legal.normaai.cl`

### 4. Crear primer cliente
1. En Supabase → Authentication → Users → "Invite user"
2. Ingresa el email del cliente
3. En SQL Editor ejecuta:
```sql
SELECT activar_cliente('email@cliente.cl', 'Nombre', 'Empresa SA', '');
```

## Cómo publicar noticias
Desde Supabase → Table Editor → noticias:
- Agrega una fila con título, resumen, categoría
- Pon `publicada = true` para que aparezca
- Si tienes video de YouTube, pega la URL en `video_url`
