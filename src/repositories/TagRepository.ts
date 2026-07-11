export class TagRepository {
  // Stub for future when Tags become a database table
  // Currently tags are handled as text[] inside experiences.
  public static async getAll(): Promise<any[]> {
    return [];
  }
}
