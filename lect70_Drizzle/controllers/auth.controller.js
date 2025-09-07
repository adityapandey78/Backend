export const getRegisterPage=(req,res)=>{
    return res.render("../views/auth/register")
};

export const getLoginPage=(req,res)=>{
    return res.render("../views/auth/login")
};

export const postLogin=(req,res)=>{
//    res.setHeader("Set-Cookie","isLoggedIn=true; path=/;"); //previous code but will use optmised one
res.cookie("isLoggedIn",true);
   //The above is the method of setting up the login
    res.redirect("/");
}

