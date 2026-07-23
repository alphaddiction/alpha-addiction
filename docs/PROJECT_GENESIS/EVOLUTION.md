# EVOLUTION ENGINE - Consolidación Cognitiva y Poda de Memoria

## Propósito del Evolution Engine

El **Evolution Engine** es el responsable de decidir cómo evoluciona la estructura cognitiva del sistema a largo plazo. 

A diferencia de los motores reactivos (como `Reasoning` o `Perception` que operan ante llamadas directas de chat), el motor de evolución actúa como un **demonio asíncrono offline** en segundo plano (emulando la fase de consolidación del sueño en cerebros biológicos).

---

## Tareas Clave de Consolidación y Poda

1.  **Fortalecimiento de Patrones**: Agrupa observaciones repetidas en el `UserModel` para consolidarlas como rasgos estables de comportamiento y hábitos.
2.  **Consolidación de Lecciones Aprendidas**: Analiza planes ejecutados con éxito o fallo, convirtiendo el historial de ejecuciones en axiomas legibles en el prompt de planificación.
3.  **Poda de Información Irrelevante (Olvido Inteligente)**:
    *   Para evitar el crecimiento ilimitado de la base de datos de contexto y la lentitud del RAG, el motor calcula el **Puntaje de Decaimiento Cognitivo (Cognitive Decay Score)** de los recuerdos vectoriales y chats antiguos.
    *   Los recuerdos con baja importancia y que no han sido accedidos en un largo intervalo son eliminados o comprimidos en resúmenes históricos globales.
4.  **Optimización del Grafo de Conocimiento**: Detecta nodos huérfanos o con similitudes ortográficas críticas, proponiendo o ejecutando fusiones automáticas de entidades empresariales.
