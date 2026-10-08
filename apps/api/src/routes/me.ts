import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, getAuth } from "../middleware/auth";

export const meRouter = Router();

// "Who am I, and where do I belong?" The React app calls this right after login
// to decide which portal to show.
meRouter.get("/", authenticate, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: getAuth(req).userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      isSystemAdmin: true,
      memberships: {
        where: { status: "ACTIVE" },
        select: { organizationId: true, role: true, organization: { select: { name: true } } },
      },
    },
  });
  res.json(user);
});