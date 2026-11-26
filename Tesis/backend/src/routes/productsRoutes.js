import { Router } from "express";
import { receiveStock, removeStock } from "../controllers/inventoryController.js";
import { saveProduct, searchProducts, updateProduct } from "../controllers/productsController.js";

const router = Router();

router.get("/search", searchProducts);
router.post("/:id/entradas", receiveStock);
router.post("/:id/salidas", removeStock);
router.post("/", saveProduct);
router.put("/:id", updateProduct);

export default router;
