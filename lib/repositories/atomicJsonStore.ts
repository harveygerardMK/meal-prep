import fs from "fs/promises";
import path from "path";

/**
 * JSON document store with temp-file rename writes and per-file serialization.
 * Suitable for local/self-hosted durable disks. Not a multi-instance database.
 */
export class AtomicJsonStore {
  private readonly queues = new Map<string, Promise<unknown>>();

  constructor(private readonly dataDir: string) {}

  async readJson<T>(file: string): Promise<T> {
    const raw = await fs.readFile(this.filePath(file), "utf-8");
    return JSON.parse(raw) as T;
  }

  async writeJson<T>(file: string, data: T): Promise<void> {
    await this.enqueue(file, async () => {
      await fs.mkdir(this.dataDir, { recursive: true });
      const target = this.filePath(file);
      const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
      const payload = JSON.stringify(data, null, 2) + "\n";
      await fs.writeFile(temp, payload, "utf-8");
      await fs.rename(temp, target);
    });
  }

  async updateJson<T>(file: string, updater: (current: T) => T): Promise<T> {
    return this.enqueue(file, async () => {
      const current = await this.readJson<T>(file);
      const next = updater(current);
      await fs.mkdir(this.dataDir, { recursive: true });
      const target = this.filePath(file);
      const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
      const payload = JSON.stringify(next, null, 2) + "\n";
      await fs.writeFile(temp, payload, "utf-8");
      await fs.rename(temp, target);
      return next;
    });
  }

  private filePath(file: string): string {
    return path.join(this.dataDir, file);
  }

  private enqueue<T>(file: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(file) ?? Promise.resolve();
    const next = previous.then(task, task);
    this.queues.set(
      file,
      next.then(
        () => undefined,
        () => undefined
      )
    );
    return next;
  }
}
