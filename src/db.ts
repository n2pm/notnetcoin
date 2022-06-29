import { PrismaClient, Transaction, User } from "@prisma/client";
const prisma = new PrismaClient();

import {
  DiscordAccessTokenInfo,
  getUserInfo,
  refreshAccessToken
} from "./discord";
import crypto from "crypto";

export function getRandomKey(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function createOrUpdateUser(
  accessTokenInfo: DiscordAccessTokenInfo
): Promise<User> {
  const userInfo = await getUserInfo(accessTokenInfo.accessToken);
  const tokenExpiry = new Date(Date.now() + accessTokenInfo.expiresIn * 1000);

  const user = await prisma.user.upsert({
    where: {
      id: userInfo.id
    },
    update: {
      username: userInfo.username,
      discriminator: userInfo.discriminator,

      accessToken: accessTokenInfo.accessToken,
      refreshToken: accessTokenInfo.refreshToken,
      tokenExpiry: tokenExpiry,

      apiKey: getRandomKey()
    },
    create: {
      id: userInfo.id,
      username: userInfo.username,
      discriminator: userInfo.discriminator,

      accessToken: accessTokenInfo.accessToken,
      refreshToken: accessTokenInfo.refreshToken,
      tokenExpiry: tokenExpiry,

      apiKey: getRandomKey(),
      balance: 0
    }
  });

  return user;
}

export async function getUserFromKey(apiKey: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      apiKey
    }
  });

  return user;
}

export async function getUserFromID(id: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      id
    }
  });

  return user;
}

export async function makeTransaction(from: User, to: User, amount: number) {
  const transaction = await prisma.transaction.create({
    data: {
      from: from.id,
      to: to.id,
      amount: amount
    }
  });

  await prisma.user.update({
    where: {
      id: from.id
    },
    data: {
      balance: from.balance - amount
    }
  });

  await prisma.user.update({
    where: {
      id: to.id
    },
    data: {
      balance: to.balance + amount
    }
  });

  return transaction;
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: parseInt(id)
    }
  });

  return transaction;
}

export async function addDaily(user: User): Promise<number> {
  const amt = Math.floor(Math.random() * (50 - 2) + 1);

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      balance: user.balance + amt,
      dailyReset: new Date(Date.now() + 86400000)
    }
  });

  return amt;
}

async function handleRefresh() {
  const expiringUsers = await prisma.user.findMany({
    where: {
      tokenExpiry: {
        lte: new Date(Date.now() - 1000 * 60 * 60)
      }
    }
  });

  for (const user of expiringUsers) {
    const accessToken = await refreshAccessToken(user.refreshToken);
    await createOrUpdateUser(accessToken);
  }
}

setInterval(handleRefresh, 1000 * 60 * 5);
handleRefresh();
