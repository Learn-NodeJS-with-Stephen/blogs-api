import express from "express";
import userRoutes from "./routes/usersRoute.js";
import blogsRoutes from "./routes/blogsRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3600;

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.use("/users", userRoutes);
app.use("/blogs", blogsRoutes);
app.use("/admin", adminRoutes);

db.getConnection()
  .then((connection) => {
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })

  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

app.get("/", (req, res) => {
  res.status(200).send(" Welcome to our BlogAPI");
});

app.get("/health", async (req, res) => {
  const healthCheckResponse = {
    status: "ok",
    uptime: process.uptime(), // Uptime of the Node.js process in seconds
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(healthCheckResponse);
});
