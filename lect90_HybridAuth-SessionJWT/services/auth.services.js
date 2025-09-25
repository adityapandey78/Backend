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
      sessionId: currentSession.id, 
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

//clearing the session post logout
export const clearSession=async(sessionId)=>{
  return db.delete(sessionsTable)
            .where(eq(sessionsTable.id,sessionId));

}

//Login with tokens 
export const authenticateUser= async ({req, res, user, name, email})=>{
  const session = await createSession(user.id,{
          ip:req.clientIp,
          userAgent:req.headers["user-agent"],
      });
  
      const accessToken= createAccessToken({
          id:user.id,
          name:user.name||name,// ye name wo data me tha toh isliye lgaa and user.name for the second parts's usage 
          email:user.email||email,
          sessionId:session.id,
      });
      const refreshToken= createRefreshToken({sessionId:session.id});
  
      const baseConfig ={httpOnly:true,secure:true}; // for the sale of ease, declaring a var here and will use in both the functions
  
      res.cookie("access_token",accessToken,{
          ...baseConfig,
          maxAge:ACCESS_TOKEN_EXPIRY,
      });
  
      res.cookie("refresh_token",refreshToken,{
          ...baseConfig,
          maxAge:REFRESH_TOKEN_EXPIRY,
      });
}