import { UserRole } from '../../generated/prisma/enums';

export type AuthenticatedUser = {
  userId: string;
  workspaceId: string;
  email: string;
  role: UserRole;
};
