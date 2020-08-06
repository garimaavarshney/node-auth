import express from "express";
import passport from "passport";
import * as userController from "../controllers/user";

const router = express.Router();

router.post("/create", userController.addUser); // Create a new user
router.get("/users", userController.fetchAllUser); // Fetch all user data
router.post("/user/email", userController.fetchUserByEmail); // Fetch user data by email
router.put("/user/profile", userController.updateUserByEmail); // Update user data by email
router.put("/user/password", userController.updatePassword); // Update user password
router.delete("/user/email", userController.deleteUserByEmail); // Delete user data by email
router.post("/login", passport.authenticate("local"), userController.checkUserByEmail); // Fetch user data by user email

export default router;
