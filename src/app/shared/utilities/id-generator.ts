export class IdGenerator {
  next(prefix = 'id'): string {
    return `${prefix}-${crypto.randomUUID()}`;
  }
}
