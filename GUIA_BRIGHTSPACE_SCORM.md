# Laberinto del Olimpo · SCORM 1.2 para Brightspace

## Qué hace esta versión

- Permite al estudiante seleccionar uno, varios o los cuatro bloques temáticos antes de iniciar.
- Filtra el banco de 134 preguntas según esa selección.
- Calcula la nota final sobre 5.00 a partir del porcentaje de respuestas correctas registradas durante la partida.
- Al completar el juego envía la nota a Brightspace mediante SCORM 1.2.
- Genera un informe detallado visible en pantalla.
- Intenta descargar automáticamente el informe HTML al finalizar.
- Mantiene un botón **Descargar informe** por si el navegador bloquea la descarga automática.
- No usa contraseña docente ni bloqueos de navegador.

## Importación

Sube el ZIP completo como paquete SCORM 1.2 en Brightspace. No descomprimas el paquete antes de importarlo.

La comunicación SCORM no funciona al abrir `index.html` directamente desde el computador. En ejecución local el juego funciona, pero el informe mostrará que Brightspace no está conectado. La nota solo se puede enviar cuando el contenido se ejecuta dentro del reproductor SCORM de Brightspace.

## Escala de nota

El SCO escribe:

- `cmi.core.score.raw`: nota entre 0.00 y 5.00
- `cmi.core.score.min`: 0
- `cmi.core.score.max`: 5
- `cmi.core.lesson_status`: completed al finalizar

La nota se calcula como `5 × (aciertos / respuestas registradas)`.


## Interfaz v2.3
- En el menú, pulse **Elegir temas** para seleccionar uno o más de los cuatro bloques.
- Durante la partida, **Finalizar juego** cierra la evaluación con las respuestas registradas, envía la nota y genera el informe.
