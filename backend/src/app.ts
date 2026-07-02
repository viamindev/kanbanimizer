import express from "express";
import authRouter from "./modules/auth/auth.routes"
import cors from 'cors'

export const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

app.use(express.json());
app.use('/auth', authRouter);

app.get('/health', (req,res) => res.json({status: 'ok'}))