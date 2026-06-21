export type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  userId: string;
  organizationId: string;
  email: string;
  displayName: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAtUtc: string;
};
