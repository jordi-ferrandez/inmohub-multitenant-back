export class BatchProcessor {
  /**
   * Procesa un array de items en lotes de tamaño batchSize,
   * llamando a processFn para cada item, y devuelve un array
   * con todos los resultados R.
   */
  static async processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processFn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      // Promise<R>[]  → Promise.all devuelve R[]
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Procesa un array de items en lotes, igual que la anterior,
   * pero captura internamente los errores de cada item y llama
   * a errorHandler(item, error). Devuelve solo los R exitosos.
   */
  static async processInBatchesWithErrorHandling<T, R>(
    items: T[],
    batchSize: number,
    processFn: (item: T) => Promise<R>,
    errorHandler: (item: T, error: unknown) => void
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises: Promise<R | null>[] = batch.map(async (item) => {
        try {
          return await processFn(item);
        } catch (err) {
          errorHandler(item, err);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const r of batchResults) {
        if (r !== null) {
          results.push(r);
        }
      }
    }

    return results;
  }
}
