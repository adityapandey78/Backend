import {Router} from "express"
import * as authControllers from "../controllers/auth.controller.js"

const router=Router();

router.get("/register", authControllers.getRegisterPage);
// router.get("/login", authControllers.getLoginPage);
//* Instead of using the individual login methods we can use the combined with the help of router functionality

router
      .route("/login")
      .get(authControllers.getLoginPage)
      .post(authControllers.postLogin)
export const authRoutes = router;