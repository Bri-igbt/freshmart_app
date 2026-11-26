import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import productRouter from "./routes/productRoutes.js";
import hookahRouter from "./routes/hookahRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import addressRouter from "./routes/addressRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import adminOrderRouter from "./routes/adminOrderRoutes.js";

const PORT = process.env.PORT || 8000;
const isProduction = process.env.NODE_ENV === "production";
const isVercel = Boolean(process.env.VERCEL);
const app = express();

if (isProduction) app.set("trust proxy", 1);

// CLIENT_URL and ADMIN_URL can each hold several URLs separated by commas
const splitUrls = (value) => (value ? value.split(",") : []);

const allowedOrigins = [
  ...(isProduction ? [] : ["http://localhost:3000", "http://localhost:3001"]),
  // Set ALLOW_LOCALHOST=true on Vercel while testing; remove it once live
  ...(process.env.ALLOW_LOCALHOST === "true"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
  ...splitUrls(process.env.ADMIN_URL),
  ...splitUrls(process.env.CLIENT_URL),
]
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOriginSet = new Set(allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOriginSet.has(origin)) {
        return callback(null, true);
      }

      console.log(`CORS blocked origin: ${origin}`);
      callback(null, false);
    },
  })
);
app.use(express.json());

// Serverless: connect to MongoDB once and reuse the connection
let dbPromise = null;
app.use(async (req, res, next) => {
  try {
    dbPromise = dbPromise || connectDB();
    await dbPromise;
    next();
  } catch (error) {
    dbPromise = null;
    console.log(error);
    res.status(500).json({ success: false, message: "Database unavailable" });
  }
});

// ROUTES (more specific path first)
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/hookahs", hookahRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payment", paymentRouter);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }

  console.log(err);
  res.status(500).json({
    success: false,
    message: isProduction ? "Something went wrong" : err.message,
  });
});

// Locally: start a normal server. On Vercel: just export the app.
if (!isVercel) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server Started on http://localhost:${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  });
}

export default app;
