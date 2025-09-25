import { refreshTokens, verifyJWTToken } from "../services/auth.services.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

// export const verifyAuthentication=(req,res,next)=>{
//     const token= req.cookies.access_token;
//     if(!token){//agar user ne login ho ni kr rkha hai
//         req.user=null;
//         return next();
//     }
//     try {
//         const decodedToken= verifyJWTToken(token);
//         req.user = decodedToken
//        // console.log(`req.user:`,req.user);
        
//     } catch (error) {
//         console.log("Error in verifying the JWT Token",error);
//         req.user=null; //null rakho taaki wo undefined naa aaye
        
//     }
//     return next();
// }
/**
 *! You can add any property to req, but:
 * Avoid pverwriting existing properties.
 * Use req.user for authentication
 * Group custom properties under req.custom if needed
 * Keep the data lightweight
 */


export const verifyAuthentication = async (req, res, next) => {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    // If no tokens exist, user is not authenticated
    if (!accessToken && !refreshToken) {
        req.user = null;
        return next();
    }

    // Try to verify access token first
    if (accessToken) {
        try {
            const decodedToken = verifyJWTToken(accessToken);
            req.user = decodedToken;
            return next();
        } catch (error) {
            // Access token is invalid, try refresh token
            console.log("Access token invalid, trying refresh token");
        }
    }

    // Try to refresh tokens using refresh token
    if (refreshToken) {
        try {
            const { newAccessToken, newRefreshToken, user } = await refreshTokens(refreshToken);

            const baseConfig = { httpOnly: true, secure: false }; // Set secure: true in production

            res.cookie("access_token", newAccessToken, {
                ...baseConfig,
                maxAge: ACCESS_TOKEN_EXPIRY,
            });

            res.cookie("refresh_token", newRefreshToken, {
                ...baseConfig,
                maxAge: REFRESH_TOKEN_EXPIRY,
            });

            req.user = user;
            return next();

        } catch (error) {
            console.error("Refresh token failed:", error.message);
            
            // Clear invalid cookies
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            
            req.user = null;
            return next();
        }
    }

    // If we reach here, no valid tokens exist
    req.user = null;
    return next();
};