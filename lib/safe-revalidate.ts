import { revalidatePath } from 'next/cache';

/**
 * An invariant-safe wrapper around Next.js revalidatePath.
 * In standalone test runners or CLI scripts, calling revalidatePath outside
 * of Next.js static generation store throws an error. This function safely ignores that error.
 */
export function safeRevalidatePath(path: string, type?: 'page' | 'layout'): void {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  } catch {
    // Gracefully ignore outside Next.js request lifecycle
  }
}
