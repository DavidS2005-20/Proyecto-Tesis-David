import { Router } from "express";
import { saveProduct, searchProducts, updateProduct } from "../controllers/productsController.js";

const router = Router();

router.get("/search", searchProducts);
router.post("/", saveProduct);
router.put("/:id", updateProduct);

export default router;
