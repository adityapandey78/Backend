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
      .get(authControllers.resendverificationLink);

export const authRoutes = router;