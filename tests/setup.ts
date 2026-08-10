import { mock } from "bun:test";

let mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  image: null as string | null,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession = {
  id: "test-session-id",
  userId: "test-user-id",
  expiresAt: new Date(Date.now() + 86400000),
  token: "test-token",
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: null,
  userAgent: null,
};

// Expose a way to change the mock user in tests
export function setMockUser(user: Partial<typeof mockUser>) {
  mockUser = { ...mockUser, ...user };
  mockSession.userId = mockUser.id;
}

mock.module("@/lib/auth", () => {
  return {
    getCachedSession: async () => {
      return { user: mockUser, session: mockSession };
    },
  };
});

// Also mock next/cache's revalidatePath since it fails outside Next.js router context
mock.module("next/cache", () => {
  return {
    revalidatePath: () => {},
  };
});
