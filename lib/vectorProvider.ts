export type VectorDocument = {
  id: string;
  userId: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
};

export interface VectorDatabaseProvider {
  upsert(document: VectorDocument): Promise<void>;
  search(userId: string, query: string, limit?: number): Promise<VectorDocument[]>;
}

class InMemoryVectorProvider implements VectorDatabaseProvider {
  private documents: VectorDocument[] = [];

  async upsert(document: VectorDocument) {
    const existingIndex = this.documents.findIndex((doc) => doc.id === document.id);

    if (existingIndex >= 0) {
      this.documents[existingIndex] = document;
      return;
    }

    this.documents.push(document);
  }

  async search(userId: string, query: string, limit = 5) {
    const normalizedQuery = query.toLowerCase();

    return this.documents
      .filter((doc) => doc.userId === userId)
      .filter((doc) => doc.content.toLowerCase().includes(normalizedQuery) || !query)
      .slice(0, limit);
  }
}

export const vectorProvider: VectorDatabaseProvider = new InMemoryVectorProvider();
