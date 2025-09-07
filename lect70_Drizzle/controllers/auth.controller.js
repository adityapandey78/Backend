export const getRegisterPage=(req,res)=>{
    return res.render("../views/auth/register")
};

export const getLoginPage=(req,res)=>{
    return res.render("../views/auth/login")
};

export const postLogin=(req,res)=>{
   res.setHeader("Set-Cookie","isLoggedIn=true; path=/;");
   //The above is the method of setting up the login
    res.redirect("/");
}

