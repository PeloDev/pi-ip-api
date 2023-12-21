import "dotenv/config";
import express from "express";
import morgan from "morgan"; // HTTP request logger middleware
import helmet from "helmet"; // Security middleware
import cors from "cors";
import ipRoutes from "./routes/ipRoutes";
import requestLogger from "./middleware/requestLogger";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);

// Routes
app.use('/ip', ipRoutes)

export default app;
