import { verifyJWTToken } from "../services/auth.services.js";

export const verifyAuthentication=(req,res,next)=>{
    const token= req.cookies.access_token;
    if(!token){//agar user ne login ho ni kr rkha hai
        req.user=null;
        return next();
    }
    try {
        const decodedToken= verifyJWTToken(token);
        req.user = decodedToken
        console.log(`req.user:`,req.user);
        
    } catch (error) {
        console.log("Error in verifying the JWT Token",error);
        req.user=null; //null rakho taaki wo undefined naa aaye
        
    }
    return next();
}
/**
 *! You can add any property to req, but:
 * Avoid pverwriting existing properties.
 * Use req.user for authentication
 * Group custom properties under req.custom if needed
 * Keep the data lightweight
 */