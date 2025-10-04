import {
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";
import {
    getUserByEmail,
    createUser,
    hashPassword,
    comparePassword,
    // generateToken == no need now, will use dual auth
    createSession,
    createAccessToken,
    createRefreshToken,
    clearSession,
    authenticateUser,
    findUserById,
    getAllShortLinks,
    generateRandomToken,
    insertVerifyEmailToken,
    createVerifyEmailLink,
    findVerificationEmailToken,
    findVerificationEmailAndUpdate,
    clearVerifyEmailTokens,
    sendNewVerifyEmailLink,
} from "../services/auth.services.js";
import { sendEmail } from "../lib/nodemailer.js";
import {
    loginUserSchema,
    registerUserSchema,
    verifyEmailSchema,
} from "../validators/auth-validator.js";

export const getRegisterPage = (req, res) => {
    if (req.user) return res.redirect("/");
    return res.render("../views/auth/register", { errors: req.flash("errors") });
};

export const postRegister = async (req, res) => {
    if (req.user) return res.redirect("/");

    const { success, data, error } = registerUserSchema.safeParse(req.body);

    if (!success) {
        const errorMessage = error.issues?.[0]?.message || "Validation error";
        req.flash("errors", errorMessage);
        return res.redirect("/register");
    }

    const { name, email, password } = data;
    const userExists = await getUserByEmail(email);
    console.log("The user already exists", userExists);

    if (userExists) {
        req.flash("errors", "User Already Exists.");
        return res.redirect("/register");
    }

    //Hashing of password
    const hashedPassword = await hashPassword(password);

    const [user] = await createUser({ name, email, password: hashedPassword });
    console.log(user);

    // res.redirect("/login");// no need to redirect to login, we are implementing the direct login after registration

    await authenticateUser({ req, res, user, name, email });
    await sendNewVerifyEmailLink({ email, userId: user.id });

    // Set a flash message to inform the user that a verification link/code
    // has been sent and then redirect them to the verification page.
    req.flash("success", "Verification link sent to your email. Please check your inbox for the 8-digit code.");

    // After registration, send the user to the verification page where they
    // can enter the 8-digit token or request a new verification link.
    res.redirect("/verify-email");
};
export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");
    return res.render("../views/auth/login", { errors: req.flash("errors") });
};

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/");
    //setting up the login logic

    const { success, data, error } = loginUserSchema.safeParse(req.body);

    if (!success) {
        const errorMessage = error.issues?.[0]?.message || "Validation error";
        req.flash("errors", errorMessage);
        return res.redirect("/login");
    }
    const { email, password } = data;
    //checking if the user exists
    const user = await getUserByEmail(email);
    console.log("getUserByEmaiil", user);

    if (!user) {
        req.flash("errors", "Invalid User or Password");
        return res.redirect("/login");
    }

    //checking if the password is valid
    const isPasswordValid = await comparePassword(user.password, password);
    //if(user.password!== password) return res.redirect("/login");
    if (!isPasswordValid) {
        req.flash("errors", "Invalid User or Password");
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

    // //: Steps for the dual sessions
    // // 1: Creating a session
    //  const session = await createSession(user.id,{
    //     ip:req.clientIp,
    //     userAgent:req.headers["user-agent"],
    //  });

    //  const accessToken= createAccessToken({
    //     id:user.id,
    //     name:user.name,
    //     email:user.email,
    //     sessionId:session.id,
    //  });
    //  const refreshToken= createRefreshToken({sessionId:session.id});

    // const baseConfig ={httpOnly:true,secure:true}; // for the sale of ease, declaring a var here and will use in both the functions

    // res.cookie("access_token",accessToken,{
    //     ...baseConfig,
    //     maxAge:ACCESS_TOKEN_EXPIRY,
    // });

    // res.cookie("refresh_token",refreshToken,{
    //     ...baseConfig,
    //     maxAge:REFRESH_TOKEN_EXPIRY,
    // });

    await authenticateUser({ req, res, user });
    res.redirect("/");
};

export const getMe = (req, res) => {
    if (!req.user) return res.send("Not logged in");
    return res.send(`<h1> hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const logoutUser = async (req, res) => {
    await clearSession(req.user.sessionId);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.redirect("/login");
};

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.send("Not logged in!");

    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");

    const userShortLinks = await getAllShortLinks(user.id);

    return res.render("auth/profile", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,
            createdAt: user.createdAt,
            links: userShortLinks,
        },
    });
};
//get Verify email page
export const getVerifyEmailPage = async (req, res) => {
    console.log("req.user: ", req.user);
    console.log("req.user.isEmailValid :", req.user.isEmailValid);

    if (!req.user) return res.redirect("/login");

    // If user is already verified, redirect to home
    if (req.user.isEmailValid === true) return res.redirect("/");

    const user = await findUserById(req.user.id);

    if (!user) return res.redirect("/login");
    if (user.isEmailValid === true) return res.redirect("/");
    return res.render("auth/verify-email", {
        email: req.user.email,
        success: req.flash('success'),
        errors: req.flash('errors'),
    });
};
export const resendVerificationLink = async (req, res) => {
    if (!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);

    if (!user || user.isEmailValid) return res.redirect("/");

    try {
        await sendNewVerifyEmailLink({ email: req.user.email, userId: req.user.id });
        req.flash('success', 'Verification link sent to your email. Please check your inbox.');
    } catch (error) {
        console.error('Failed to resend verification link:', error);
        req.flash('errors', 'Failed to send verification email. Please try again later.');
    }

    return res.redirect('/verify-email');
};

export const verifyEmailToken = async (req, res) => {
    const { data, error } = verifyEmailSchema.safeParse(req.query);
    if (error) {
        // Validation failed (missing/invalid token or email) -> show flash and go back
        req.flash('errors', 'Verification link invalid or expired. Please request a new code.');
        return res.redirect('/verify-email');
    }

    const token = await findVerificationEmailToken(data);
    if (!token) {
        // Token not found or expired
        req.flash('errors', 'Verification code is invalid or expired. Please request a new code.');
        return res.redirect('/verify-email');
    }
    /**
     *: Things to check! inside the findVerificationEmailToken
     * 1.) if the TOKEN is same or not
     * 2.) If the token is not expired
     * 3.) find the userID and the email associated with that or not
     */

    await findVerificationEmailAndUpdate(token.email);
    /**
     * use the token email and update in the DB
     */

    clearVerifyEmailTokens(token.email).catch(console.error);

    // Inform the user and redirect to profile
    req.flash('success', 'Email verified successfully.');
    return res.redirect('/profile');
};
