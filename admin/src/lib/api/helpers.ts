// Pro Parenting Admin - API Helpers

export function throwIfSupabaseError(error: { message: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}
