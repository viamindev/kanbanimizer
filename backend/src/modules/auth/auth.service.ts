import type * as authSchema from "@/modules/auth/auth.schema";
import * as jwtUtils from "@/utils/jwt";
import * as tokenService from "./token.service";
import bcrypt from "bcrypt";
import { db } from "@/db/index";
import { usersTable } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import * as appError from "@/utils/errors";

export async function RegisterUser({
  email,
  username,
  password,
}: authSchema.RegisterInput) {
  const isEmailBusy = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (isEmailBusy.length > 0)
    throw new appError.ConflictError("Email already in use");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db
    .insert(usersTable)
    .values({ email, username, passwordHash })
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username,
    });

  if (user[0]) {
    const newUser = user[0];
    const accessToken = jwtUtils.signAccessToken({ userId: newUser.id });
    const refreshToken = jwtUtils.signRefreshToken({ userId: newUser.id });

    await tokenService.saveRefreshToken(newUser.id, refreshToken);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
      accessToken,
      refreshToken,
    };
  } else {
    throw new appError.BadRequestError();
  }
}

export async function LoginUser({ email, password }: authSchema.LoginInput) {
  const foundUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (foundUser.length === 0) throw new appError.UnauthorizedError();

  const user = foundUser[0];
  if (!user) throw new appError.UnauthorizedError();

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) throw new appError.UnauthorizedError();

  const accessToken = jwtUtils.signAccessToken({ userId: user.id });
  const refreshToken = jwtUtils.signRefreshToken({ userId: user.id });

  await tokenService.saveRefreshToken(user.id, refreshToken);

  return {
    user: { id: user.id, email: user.email, username: user.username },
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
}
