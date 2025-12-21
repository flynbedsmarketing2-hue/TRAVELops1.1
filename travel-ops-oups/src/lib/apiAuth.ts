import { getServerSession } from "next-auth";
import type { UserRole } from "../types";
import { authOptions } from "./auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireSession();
  const role = session.user.role as UserRole;
  if (!roles.includes(role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
