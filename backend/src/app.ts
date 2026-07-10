import express from "express";
import authRouter from "./modules/auth/auth.routes";
import projectsRouter from "./modules/projects/projects.routes";
import cors from "cors";
import errorMiddleware from "./middleware/error.middleware";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/auth", authRouter);
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/projects", projectsRouter);

app.use(errorMiddleware);
