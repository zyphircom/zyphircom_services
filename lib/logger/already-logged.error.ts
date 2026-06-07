export class AlreadyLoggedError extends Error {
  public readonly alreadyLogged = true;

  constructor(message?: string, options?: { cause?: Error }) {
    super(message);
    if (options?.cause) this.cause = options.cause;
    this.name = this.constructor.name;
  }
}
