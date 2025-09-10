import { db } from "../config/db-client.js";
import { usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2"
import jwt from "jsonwebtoken"

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
