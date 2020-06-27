export class Queue {
  private maxSimultaneously: number;
  private __active: number;
  private __queue: (() => any)[];

  constructor(maxSimultaneously = 1) {
    this.maxSimultaneously = maxSimultaneously;
    this.__active = 0;
    this.__queue = [];
  }

  async enqueue(func: () => any) {
    if (++this.__active > this.maxSimultaneously) {
      await new Promise((resolve) => this.__queue.push(resolve));
    }

    try {
      return await func();
    } catch (err) {
      throw err;
    } finally {
      this.__active--;
      if (this.__queue.length > 0) {
        let func = this.__queue.shift();
        if (func) {
          func();
        }
      }
    }
  }

  async destroy() {
    await new Promise((resolve) => {
      this.enqueue(resolve);
    });
  }
}
