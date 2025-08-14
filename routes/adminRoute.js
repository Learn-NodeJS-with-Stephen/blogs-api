import express from "express";
import AdminController from "../controllers/adminController.js";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";
import adminController from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", adminController.login);

router.use(auth, isAdmin);

router.get("/posts", adminController.getAllPosts);
router.put("/posts/:id/restrict", adminController.restrictPost);
router.put("/posts/:id/delete", adminController.deletePost);
router.put("/users/:id/restrict", adminController.restrictUser);
router.post("/category", adminController.createCategory);
router.get("/dashboard", adminController.adminDashboard);

export default router;
