# SUMA - Casos de uso por los 16 módulos de la documentación

Revisión del 26 de noviembre de 2026. El archivo vigente es **SUMA-Diagramas_Vistas.eapx**. La entrega principal contiene **16 diagramas generales**, uno por cada nombre de la columna **Nombre (módulo)** de la hoja **Req. Funcionales** de `DocumentacionResumenRequisitos (1) (1).xlsx`. Se conserva la asignación exacta de cada RF en esa columna.

En Enterprise Architect, abrir **SUMA > Vista de Escenarios > 00 General RF y subrequisitos > 00 Generales por módulo**. Cada general contiene los RF de su módulo. Cada RF sigue siendo compuesto: doble clic para abrir su hijo. Se conservan los 50 hijos y sus 179 subrequisitos exactos. Volver a abrir el modelo si ya estaba abierto durante la actualización.

Los módulos son:

1. **Gestión de usuarios**: RF-01, RF-02, RF-03, RF-05, RF-06, RF-47, RF-50
2. **Validación de usuarios**: RF-04, RF-07
3. **Administración**: RF-08, RF-13, RF-14, RF-41, RF-42
4. **Referidos**: RF-09, RF-10, RF-11
5. **Puntos y recompensas**: RF-12, RF-15, RF-32, RF-33, RF-34, RF-35
6. **Gamificación**: RF-16, RF-17, RF-18
7. **Juegos**: RF-19, RF-20
8. **Capacitaciones**: RF-21, RF-22
9. **Talleres**: RF-23, RF-24, RF-25
10. **Comunidad**: RF-26, RF-27, RF-28, RF-29, RF-30
11. **Salud y bienestar**: RF-31
12. **Búsquedas**: RF-36
13. **Notificaciones**: RF-37, RF-38, RF-39, RF-40
14. **Reportes**: RF-43, RF-45
15. **Encuestas**: RF-44
16. **Usuarios y perfiles**: RF-46, RF-48, RF-49

El PDF **SUMA-Casos-de-uso-y-clases-Auditoria1.pdf** tiene 69 páginas: índice navegable, 16 generales, 50 hijos, un único diagrama de clases y la especificación del flujo automático. Las tarjetas CRC se entregan en el Word **SUMA-CRC-Clases.docx**; la lámina individual ampliable está en **SUMA-Clases-Unificado.pdf**. El índice abre cada módulo; cada RF abre su hijo y «Volver al general» regresa al módulo al que pertenece. Los marcadores siguen esa organización.

El índice SVG está en `diagramas/Revision-auditoria-1/index.html`. `Jerarquia-RF/Modulo-01.svg` a `Modulo-16.svg` contienen los generales. Los archivos `RF-01.svg` a `RF-50.svg` conservan los hijos y sus enlaces de regreso al módulo correcto. `general.svg` es ahora un índice visual de los 16 módulos. `cobertura.csv` registra los 229 requisitos, sus módulos y ambos destinos de navegación. El ZIP reúne modelo, PDF, guía y exportaciones.

Se conserva la presentación del ejemplo AUTOSYS: límite de SUMA, actores fuera del sistema, casos generales y subcasos, y relaciones UML con dirección y condición. En cada general los actores aparecen una sola vez, con rutas que no atraviesan otros óvalos. La partición por módulos organiza la lectura; no crea requisitos nuevos ni altera sus nombres, reglas o responsables.

La validación de cuentas y referidos permanece automática contra la fuente institucional autorizada. El administrador consulta y da seguimiento; no dicta aprobaciones o rechazos. La asociación manual de RF-11-5 corrige una relación y dispara validación automática. Ante fallas técnicas se conserva Pendiente y se reintenta cada 5 minutos. Se mantiene la confirmación atómica e idempotente del estado, puntos de ambas partes y eventos de aviso.

El diagrama principal de clases está en **SUMA > Vista Lógica > Diagrama Clases > 00 Clases general del sistema**. Reúne **56 elementos: 55 clases y una interfaz**, con sus atributos, operaciones y 82 relaciones. Conserva las **37 clases originales** (Object_ID 101 a 137), incorpora **5 clases adicionales existentes en el código** y justifica **14 propuestas del CRC**. De las 37 originales, 14 tienen clase en el código y 23 siguen modeladas pendientes. En total se contrastaron 19 clases con sus declaraciones del backend.

Las tarjetas CRC usan las columnas **Clase / Responsabilidades / Colaboradores**, siguiendo el ejemplo AUTOSYS. Cada elemento tiene un identificador CRC compartido entre Word y diagrama. Las 14 propuestas se justifican individualmente por responsabilidades que faltan. El Word incluye archivos y líneas de código, requisitos y adaptaciones pendientes. `CRC-clases-trazabilidad.csv` permite revisar esa correspondencia.

En las exportaciones, azul identifica código confirmado; ámbar, clases originales pendientes; verde, propuestas del CRC. FuenteInstitucional es una interfaz. Los nombres de las operaciones implementadas proceden del código y las firmas se abrevian sin parámetros. Las propiedades públicas de JavaScript se muestran públicas; los miembros estáticos se subrayan y los derivados llevan `/`. Los tipos de JavaScript son inferidos del código y del modelo de datos.

El código actual aún tiene dictamen administrativo de cuentas y referidos. ValidadorCuenta y ValidadorReferido expresan la adaptación automática exigida por los requisitos; no se presentan como implementados. Este trabajo actualiza el diseño y no modifica el código de producción.

Las seis vistas parciales anteriores quedan en la subcarpeta **Complementarias - recortes de clases**. Sus exportaciones SVG anteriores se consideran históricas; la exportación vigente es `Clases-unificado.svg` y sus datos están en `modelo-clases-unificado.json`. La copia previa del EAPX está en `originales/SUMA-Diagramas_Vistas.antes-clases-CRC-2026-11-26.eapx`.

Verificación: 16 módulos comparados con la matriz; 50 RF repartidos una sola vez entre esos generales; 179 subrequisitos y los 50 enlaces compuestos nativos conservados; 16 enlaces del índice, 50 enlaces a hijos y 50 retornos al módulo correcto comprobados en el PDF. Se verificaron los elementos y enlaces del EAPX, y se renderizaron las páginas de los generales para revisión visual. La navegación se comprobó en la estructura del archivo; no se repitió la prueba de doble clic en la aplicación.

La vista conjunta anterior queda en **Complementarios - vistas conjuntas**. Su copia previa está en `originales/SUMA-Diagramas_Vistas.antes-16-modulos-2026-11-26.eapx`. Las vistas CU anteriores continúan como complemento. Las secuencias y actividades afectadas por aprobación manual siguen marcadas HISTÓRICO; sus reemplazos y las ilustraciones antiguas de Word permanecen pendientes.

Verificación de clases y CRC: 37 identidades originales conservadas; 19 declaraciones de clases contrastadas con el código; 56 tarjetas y elementos concordantes; 82 relaciones visibles; ausencia de superposición entre cajas y rutas que atraviesen otras clases. Se renderizaron y revisaron las 11 páginas del Word con el motor de Word. Los casos de uso y sus enlaces compuestos nativos se conservaron.
