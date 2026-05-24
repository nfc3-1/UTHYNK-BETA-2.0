export type MemoryVector = {
  id: string;
  userId: string;
  embedding: number[];
  metadata: Record<string, unknown>;
};

const vectorStore: MemoryVector[] = [];

export function storeMemoryVector(vector: MemoryVector) {
  vectorStore.push(vector);
}

export function searchMemoryVectors(userId: string) {
  return vectorStore.filter((vector) => vector.userId === userId);
}
