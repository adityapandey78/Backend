import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { 
    getUserByEmail,
    createUser, 
    hashPassword, 
    comparePassword ,
    // generateToken == no need now, will use dual auth
    createSession,
    createAccessToken,
    createRefreshToken,
    clearSession
} from "../services/auth.services.js";
import { loginUserSchema, registerUserSchema } from "../validators/auth-validator.js";

export const getRegisterPage=(req,res)=>{
    if(req.user) return res.redirect("/");
    return res.render("../views/auth/register",{errors: req.flash('errors')});
};

export const postRegister= async (req,res)=>{
    if(req.user) return res.redirect("/");

    const {success, data, error} = registerUserSchema.safeParse(req.body);

   if(!success){
    const errorMessage = error.issues?.[0]?.message || "Validation error";
    req.flash("errors", errorMessage);
    return res.redirect('/register');
   }

   const {name, email, password} = data;
    const userExists= await getUserByEmail(email);
    console.log("The user already exists",userExists);
    
    if(userExists){
        req.flash("errors","User Already Exists.")
        return res.redirect("/register");
    }

    //Hashing of password
    const hashedPassword= await hashPassword(password);

    const [user]= await createUser({name, email, password:hashedPassword});
    console.log(user);
    
    res.redirect("/login");
    
}
export const getLoginPage=(req,res)=>{
    if(req.user) return res.redirect("/");
    return res.render("../views/auth/login",{errors: req.flash('errors')})
};

export const postLogin=async (req,res)=>{
    if(req.user) return res.redirect("/");
    //setting up the login logic
   
    const {success, data, error} = loginUserSchema.safeParse(req.body);

   if(!success){
    const errorMessage = error.issues?.[0]?.message || "Validation error";
    req.flash("errors", errorMessage);
    return res.redirect('/login');
   }
    const {email, password} = data;
    //checking if the user exists
    const user= await getUserByEmail(email);
    console.log("getUserByEmaiil",user);
    
    if(!user){
        req.flash("errors","Invalid User or Password");
        return res.redirect("/login")
    };

    //checking if the password is valid
    const isPasswordValid = await comparePassword(user.password, password);
    //if(user.password!== password) return res.redirect("/login");
    if(!isPasswordValid){
        req.flash("errors","Invalid User or Password");
        // console.log("getting the password wrong");
        
        return res.redirect("/login");
    }

//    const token= generateToken({
//     id:user.id,
//     name:user.name,
//     email:user.email,
//   });

//   res.cookie("access_token",token);
//The above method was used only for the JWT thingy 

//: Steps for the dual sessions
// 1: Creating a session
 const session = await createSession(user.id,{
    ip:req.clientIp,
    userAgent:req.headers["user-agent"],
 });

 const accessToken= createAccessToken({
    id:user.id,
    name:user.name,
    email:user.email,
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

res.redirect("/");
}

export const getMe= (req,res)=>{
    if(!req.user) return res.send("Not logged in");
    return res.send(`<h1> hey ${req.user.name} - ${req.user.email}</h1>`)
};

export const logoutUser= async (req,res)=>{
    await clearSession(req.user.sessionId)

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.redirect('/login');
}