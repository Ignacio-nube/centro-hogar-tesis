# Scripts del backend

Scripts de mantenimiento que se ejecutan **a mano en el servidor** (la PC donde
corre el backend y está la base de datos). No son parte de la app web.

---

## `reset-password.mjs` — Recuperar una contraseña

Sirve para restablecer la contraseña de **cualquier** usuario directamente en la
base de datos, **sin necesidad de iniciar sesión**.

### ¿Para qué se usa?

El caso típico: **el administrador se olvidó su propia contraseña** y no hay otro
admin que pueda restablecerla desde la pantalla de Usuarios. Como este script
trabaja por fuera del login, te saca de ese problema.

(Para resetear a un usuario normal NO hace falta el script: el admin lo hace
desde la app, en **Usuarios → botón de la llave 🔑**.)

### Cómo usarlo

1. Abrí una terminal en la carpeta `backend`.
2. Ejecutá, poniendo el email del usuario y la nueva contraseña:

```bash
npm run reset-password correo@ejemplo.com NuevaClave123
```

Ejemplo para recuperar el admin:

```bash
npm run reset-password admin@centrohogar.com MiClaveNueva2026
```

Si todo sale bien, vas a ver:

```
✅ Contraseña restablecida para Admin Sistema (admin@centrohogar.com).
   Ya puede iniciar sesión con la nueva contraseña.
```

Listo: ahora podés entrar a la app con esa contraseña nueva.

### Reglas

- La nueva contraseña debe tener **al menos 8 caracteres**.
- El email debe existir en la base; si no, te avisa y no cambia nada.
- Lee la conexión a MySQL desde el archivo `.env` del backend (las mismas
  variables `DB_HOST`, `DB_USER`, etc. que usa la app).

### Consejo

Creá una **segunda cuenta de administrador**. Así, si uno se olvida la clave, el
otro lo resetea desde la app sin tener que tocar el servidor. Este script queda
como salvavidas para cuando eso no alcance.
