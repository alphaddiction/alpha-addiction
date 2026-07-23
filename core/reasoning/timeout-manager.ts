export class TimeoutManager {
  /**
   * Envuelve una promesa asíncrona en un límite de tiempo (timeout).
   * Si la promesa supera el tiempo límite, se cancela y se retorna una falla de timeout.
   */
  static async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorFallback: T
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`⏱️ [TimeoutManager] Execution reached limit of ${timeoutMs}ms. Aborting.`);
        resolve(errorFallback);
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    }
  }
}
