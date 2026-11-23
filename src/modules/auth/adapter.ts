import "server-only";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/security";

type AppRole = "CITIZEN" | "ADMIN";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  emailVerified: Date | null;
  image: string | null;
};

type AdapterUserWithRole = AdapterUser & { role: AppRole };

function toAdapterUser(user: UserRow): AdapterUserWithRole {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    image: user.image,
  };
}

const baseAdapter = PrismaAdapter(prisma as never) as Adapter;

function required<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`Adapter Auth.js tidak menyediakan metode ${name}.`);
  return value;
}

export const authAdapter: Adapter = {
  ...baseAdapter,

  async createUser(data: Omit<AdapterUser, "id">) {
    const user = await prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        name: data.name ?? null,
        emailVerified: data.emailVerified ?? null,
        image: data.image ?? null,
        role: "CITIZEN",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
      },
    });

    return toAdapterUser(user);
  },

  async getUser(id) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
      },
    });

    return user ? toAdapterUser(user) : null;
  },

  async getUserByEmail(email) {
    const user = await prisma.user.findFirst({
      where: { email: normalizeEmail(email), deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
      },
    });

    return user ? toAdapterUser(user) : null;
  },

  async updateUser(data) {
    const user = await prisma.user.update({
      where: { id: data.id },
      data: {
        ...(data.email ? { email: normalizeEmail(data.email) } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.emailVerified !== undefined ? { emailVerified: data.emailVerified } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
      },
    });

    return toAdapterUser(user);
  },

  async getSessionAndUser(sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires <= new Date() || session.user.deletedAt) {
      return null;
    }

    const adapterSession: AdapterSession = {
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    };

    return {
      session: adapterSession,
      user: toAdapterUser(session.user),
    };
  },

  async createSession(data) {
    const session = await prisma.session.create({
      data: {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
      },
    });

    return {
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    };
  },

  async updateSession(data) {
    try {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: { expires: data.expires },
      });

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    } catch {
      return null;
    }
  },

  async deleteSession(sessionToken) {
    try {
      const session = await prisma.session.delete({ where: { sessionToken } });
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    } catch {
      return null;
    }
  },

  async createVerificationToken(data) {
    const identifier = normalizeEmail(data.identifier);
    const token = await prisma.verificationToken.create({
      data: {
        identifier,
        token: data.token,
        expires: data.expires,
      },
    });

    return {
      identifier: token.identifier,
      token: token.token,
      expires: token.expires,
    };
  },

  async useVerificationToken({ identifier, token }) {
    const normalized = normalizeEmail(identifier);

    return prisma.$transaction(async (tx) => {
      const record = await tx.verificationToken.findUnique({
        where: { identifier_token: { identifier: normalized, token } },
      });

      if (!record) return null;

      await tx.verificationToken.delete({
        where: { identifier_token: { identifier: normalized, token } },
      });

      return {
        identifier: record.identifier,
        token: record.token,
        expires: record.expires,
      };
    });
  },

  linkAccount: required(baseAdapter.linkAccount, "linkAccount"),
  getUserByAccount: required(baseAdapter.getUserByAccount, "getUserByAccount"),
  unlinkAccount: baseAdapter.unlinkAccount,
  deleteUser: baseAdapter.deleteUser,
};
