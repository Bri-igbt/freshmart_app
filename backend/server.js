import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';

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

app.get("/", (req, res) => {
  res.send("API WORKING")
});

app.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`)
});