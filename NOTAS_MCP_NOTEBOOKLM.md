# Notas sobre MCP NotebookLM

Para habilitar la conexión con tus cuadernos de NotebookLM en este proyecto, he configurado el servidor MCP `notebooklm`. 
Dado que requiere autenticación con tu cuenta de Google (OAuth2), debes iniciar sesión manualmente.

**Paso a seguir:**
Abre una terminal normal en tu sistema y ejecuta el siguiente comando:

```bash
uvx notebooklm-mcp-cli login
```
*(Nota: también puedes intentarlo con `~/.local/bin/notebooklm-mcp login` si `uvx` no está disponible).*

Esto abrirá una ventana en tu navegador web donde deberás autorizar a la aplicación. Una vez completado, el servidor MCP instalado por Antigravity estará listo para interactuar con tus cuadernos sin problemas, redirigiendo los errores al archivo `/tmp/notebooklm-mcp.err` de forma limpia.
