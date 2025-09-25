import { db } from "../config/db-client.js";
import { sessionsTable, usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

export const getUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user;
};

export const createUser = async ({ name, email, password }) => {
  return await db
    .insert(usersTable)
    .values({ name, email, password })
    .$returningId();
};

export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

export const comparePassword = async (hash, password) => {
  return await argon2.verify(hash, password);
};

// token generating service
export const generateToken = ({ id, name, email }) => {
  return jwt.sign({ id, name, email }, process.env.JWT_SECERET, {
    expiresIn: "30d",
  });
};

//verify JWT TOKEN
export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECERET);
};

export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, ip, userAgent })
    .$returningId();
  return session;
};

//finding Sesion by Id
export const findSessionById = async (sessionId) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));
  return session;
};

//Finding User by Id
export const findUserById = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
};
//createAccessToken
export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECERET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, //expires in "15m"
  });
};
export const createRefreshToken = ({ sessionId }) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECERET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, //expires in "15m"
  });
};

export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken); //isse mujhe session id mil jaayegi jisse me find out kruga aage ka
    const currentSession = await findSessionById(decodedToken.sessionId);

    if (!currentSession || !currentSession.valid) {
      throw new Error("Invalid Session!");
    }

    const user = await findUserById(currentSession.userId);

    if (!user) throw new Error("Invalid User!");

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      sessionId: currentSession.id, // Fixed typo: was 'sessionsId'
    };

    //creating the tokens
    const newAccessToken = createAccessToken(userInfo);

    const newRefreshToken = createRefreshToken({ sessionId: currentSession.id }); // Fixed: pass object

    return {
      newAccessToken,
      newRefreshToken,
      user: userInfo,
    };
  } catch (error) {
    console.log("Error in refreshTokens:", error.message);
    throw error; // Re-throw the error so middleware can handle it
  }
};
