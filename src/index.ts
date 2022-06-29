import "dotenv/config";

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "@koa/router";
import validator, { Joi } from "koa-context-validator";

import { getAccessToken, getUserInfo } from "./discord";
import {
  createOrUpdateUser,
  getTransaction,
  getUserFromID,
  getUserFromKey,
  makeTransaction
} from "./db";

const app = new Koa();
app.use(bodyParser());
const router = new Router();

interface UserInfo {
  id: string;
  username: string;
  discriminator: string;
  apiKey: string;
  balance: number;
}

interface TransactionInfo {
  id: string;
  from: string;
  to: string;
  amount: number;
}

router.get(
  "/oauth",
  validator({
    query: Joi.object().keys({
      code: Joi.string().required() // <--------\
    }) //                                       |
  }), //                                        | you fucking idiot
  async (ctx) => {
    const code = ctx.query.code as string; // --|

    const accessTokenInfo = await getAccessToken(code);
    const user = await createOrUpdateUser(accessTokenInfo);
    console.log(user);

    ctx.response.status = 200;
    ctx.response.body = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      apiKey: user.apiKey,
      balance: user.balance
    } as UserInfo;
  }
);

router.post(
  "/transactions",
  validator({
    headers: Joi.object()
      .keys({
        authorization: Joi.string().required()
      })
      .unknown(),
    body: Joi.object().keys({
      to: Joi.string().required(),
      amount: Joi.number().integer().positive().required()
    })
  }),
  async (ctx) => {
    const apiKey = ctx.request.headers["authorization"] as string | null;

    if (apiKey == null) {
      ctx.status = 401;
      return;
    }

    const user = await getUserFromKey(apiKey!);
    if (user == null) {
      ctx.status = 401;
      return;
    }

    const body = ctx.request.body;
    if (user.balance - body.amount < 0) {
      ctx.status = 400;
      ctx.body = {
        error: "Insufficient funds."
      };
      return;
    }

    const to = await getUserFromID(body.to);
    if (to == null) {
      ctx.status = 400;
      ctx.body = {
        error: "User not found."
      };
      return;
    }

    const transaction = await makeTransaction(user, to, body.amount);
    ctx.status = 200;
    ctx.body = {
      id: transaction.id.toString(),
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount
    } as TransactionInfo;
  }
);

router.get("/transactions/:id", async (ctx) => {
  const transaction = await getTransaction(ctx.params.id);

  if (transaction == null) {
    ctx.status = 400;
    ctx.body = {
      error: "Transaction not found."
    };
    return;
  }

  ctx.status = 200;
  ctx.body = {
    id: transaction.id.toString(),
    from: transaction.from,
    to: transaction.to,
    amount: transaction.amount
  } as TransactionInfo;
});

router.get(
  "/me",
  validator({
    headers: Joi.object()
      .keys({
        authorization: Joi.string().required()
      })
      .unknown()
  }),
  async (ctx) => {
    const apiKey = ctx.request.headers["authorization"] as string | null;

    if (apiKey == null) {
      ctx.status = 401;
      return;
    }

    const user = await getUserFromKey(apiKey!);
    if (user == null) {
      ctx.status = 401;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      apiKey: user.apiKey,
      balance: user.balance
    } as UserInfo;
  }
);

app.use(router.middleware());
app.listen(process.env.PORT);
