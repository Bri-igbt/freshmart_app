import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';
import productRouter from './routes/productRoutes.js';
import hookahRouter from './routes/hookahRoutes.js';
import cartRouter from './routes/cartRoutes.js';
import addressRouter from './routes/addressRoutes.js';

const PORT = 8000;
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DB
connectDB();

// ROUTES
app.use('/api/users', userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/hookahs", hookahRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);

app.get("/", (req, res) => {
  res.send("API WORKING")
});

app.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`)
});