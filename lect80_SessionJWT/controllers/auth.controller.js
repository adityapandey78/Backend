import { getUserByEmail,createUser, hashPassword, comparePassword } from "../services/auth.services.js";

export const getRegisterPage=(req,res)=>{
    return res.render("../views/auth/register")
};

export const postRegister= async (req,res)=>{
    //console.log(req.body);
    const {name, email,password}= req.body;
    //checking if the user exists
    const userExists= await getUserByEmail(email);
    console.log("The user already exists",userExists);
    
    if(userExists) return res.redirect("/register");

    //Hashing of password
    const hashedPassword= await hashPassword(password);

    const [user]= await createUser({name, email, password:hashedPassword});
    console.log(user);
    
    res.redirect("/login");
    
}
export const getLoginPage=(req,res)=>{
    return res.render("../views/auth/login")
};

export const postLogin=async (req,res)=>{
    //setting up the login logic

    const {email,password}= req.body;
    //checking if the user exists
    const user= await getUserByEmail(email);
    console.log("getUserByEmaiil",user);
    
    if(!user) return res.redirect("/login");

    //checking if the password is valid
    const isPasswordValid = await comparePassword(user.password, password);
    //if(user.password!== password) return res.redirect("/login");
    if(!isPasswordValid){
        return res.redirect("/login");
    }

    //    res.setHeader("Set-Cookie","isLoggedIn=true; path=/;"); //previous code but will use optmised one

    res.cookie("isLoggedIn",true);
   //The above is the method of setting up the login
    res.redirect("/");
}

