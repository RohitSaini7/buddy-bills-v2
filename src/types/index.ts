export type ActionResponse<T = void> =
  ({ success: true } & (T extends void ? Record<string, never> : T)) | { error: string };
