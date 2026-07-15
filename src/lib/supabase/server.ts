export async function createClient() {
  return {
    auth: {
      async exchangeCodeForSession(...args: unknown[]) {
        void args;
        return { error: null };
      },
    },
  };
}
