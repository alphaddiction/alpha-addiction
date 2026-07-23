# USER MODEL - El Perfil Cognitivo Dinámico del Usuario

## Concepto del Modelo de Usuario

El **User Model** no es un registro estático en una base de datos con un nombre y correo. Es una estructura de datos viva que modela cognitivamente al usuario a partir de observaciones directas, hábitos de uso y preferencias deducidas.

El sistema evoluciona el perfil dinámicamente mediante el procesamiento pasivo de eventos en el `CognitiveBus`.

---

## Áreas de Modelado

1.  **Estilo de Comunicación**
    *   *Métricas*: Nivel de formalidad preferido, densidad de información deseada (resumido vs. técnico), velocidad de lectura y atajos comunes utilizados.
2.  **Hábitos Operativos**
    *   *Métricas*: Horas comunes de actividad en el panel, orden secuencial de revisión de pestañas, patrones de configuración de Drops.
3.  **Preferencias Estéticas**
    *   *Métricas*: Tonalidades cromáticas preferidas en promociones, preferencias de maquetación en mockups de Printful.
4.  **Objetivos de Negocio**
    *   *Métricas*: Metas financieras a corto plazo (ej. "aumentar ventas un 10% en el drop Genesis"), objetivos de reducción de cancelaciones.

---

## Consolidación Basada en Observaciones

El modelo de usuario no cambia ante un solo mensaje. En su lugar, el `UserModelManager` acumula **Observaciones de comportamiento (`IUserObservation`)**. 

El `EvolutionEngine` consolida periódicamente estas observaciones individuales en rasgos de comportamiento estables utilizando thresholds de confianza (ej. si el usuario rechaza 3 planes detallados seguidos y pide resúmenes, se actualiza el rasgo de preferencia de comunicación a `minimalista/resumido`).
