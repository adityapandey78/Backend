import { db } from "../config/db-client.js";
import { sessionsTable, usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

export const getUserByEmail = async(email)=>{
    const [user]= await db.select()
                    .from(usersTable)
                    .where(eq(usersTable.email,email));
    return user;
}

export const createUser= async ({name, email, password})=>{
    return await db.insert(usersTable)
                .values({name,email, password})
                .$returningId();
};

export const hashPassword = async(password)=>{
    return await argon2.hash(password);
}

export const comparePassword= async(hash,password)=>{
    return await argon2.verify(hash,password);
}

// token generating service
export const generateToken=({id, name, email})=>{
    return  jwt.sign({id,name,email}, 
        process.env.JWT_SECERET ,{
        expiresIn:"30d",
    })
};

//verify JWT TOKEN
export const verifyJWTToken=(token)=>{
    return jwt.verify(token, process.env.JWT_SECERET)
}

export const createSession= async(userId,{ip,userAgent})=>{
    const [session] = await db.insert(sessionsTable)
                    .values({userId,ip,userAgent})
                    .$returningId();
    return session;
}

//createAccessToken
export const createAccessToken=({id,name,email,sessionId})=>{
return jwt.sign({id,name,email,sessionId},process.env.JWT_SECERET,{
    expiresIn: ACCESS_TOKEN_EXPIRY/MILLISECONDS_PER_SECOND, //expires in "15m"
});
}
export const createRefreshToken=({sessionId})=>{
return jwt.sign({sessionId},process.env.JWT_SECERET,{
    expiresIn: REFRESH_TOKEN_EXPIRY/MILLISECONDS_PER_SECOND, //expires in "15m"
});
}