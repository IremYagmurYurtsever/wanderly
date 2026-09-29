let queue: Promise<unknown> = Promise.resolve();

export function enqueueWikimedia<T>(task: () => Promise<T>): Promise<T> {
  const job = queue.then(task);
  queue = job.catch(() => undefined);
  return job;
}
