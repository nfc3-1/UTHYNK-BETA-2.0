declare module 'vitest' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void) => void;
  export const expect: (value: unknown) => {
    toBe: (expected: unknown) => void;
    toContain: (expected: unknown) => void;
    toMatchObject: (expected: unknown) => void;
    toBeNull: () => void;
    toThrow: (expected?: string | RegExp) => void;
  };
  export const vi: {
    stubEnv: (name: string, value: string) => void;
    unstubAllEnvs: () => void;
  };
}

declare module 'vitest/config' {
  export function defineConfig(config: unknown): unknown;
}
