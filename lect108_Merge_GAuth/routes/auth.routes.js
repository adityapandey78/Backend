import {Router} from "express"
import * as authControllers from "../controllers/auth.controller.js"

const router=Router();

// router.get("/register", authControllers.getRegisterPage);
// router.get("/login", authControllers.getLoginPage);
//* Instead of using the individual login methods we can use the combined with the help of router functionality

router
      .route("/register")
      .get(authControllers.getRegisterPage)
      .post(authControllers.postRegister)


router
      .route("/login")
      .get(authControllers.getLoginPage)
      .post(authControllers.postLogin)

router
      .route("/me")
      .get(authControllers.getMe);

router
      .route("/profile")
      .get(authControllers.getProfilePage);

router
      .route("/logout")
      .get(authControllers.logoutUser);

router
      .route("/verify-email")
      .get(authControllers.getVerifyEmailPage);

router
      .route("/resend-verification-link")
      .post(authControllers.resendVerificationLink);
router 
      .route("/verify-email-token")
      .get(authControllers.verifyEmailToken);

router 
      .route("/google").get(authControllers.getGoogleLoginPage);

router.route("/google/callback").get(authControllers.getGoogleLoginCallback);

// Temporary debug route - REMOVE IN PRODUCTION
router.get("/debug/env", async (req, res) => {
    const { env } = await import("../config/env.js");
    res.json({
        hasGoogleClientId: !!env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID.length > 0,
        hasGoogleSecret: !!env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CLIENT_SECRET.length > 0,
        clientIdLength: env.GOOGLE_CLIENT_ID?.length || 0,
        frontendUrl: env.FRONTEND_URL,
    });
});

export const authRoutes = router;