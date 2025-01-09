import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routers/authRouter.js";
import usersRouter from "./routers/usersRouter.js";
import employeesRouter from "./routers/employeesRouter.js";
import shiftsRouter from "./routers/shiftsRouter.js";
import scheduleRouter from "./routers/scheduleRouter.js";
import feedRouter from "./routers/feedRouter.js";
import routesRouter from "./routers/routesRouter.js";
import wifiWhitelistRouter from "./routers/wifiWhitelistRouter.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use(authRouter);
app.use(usersRouter);
app.use(employeesRouter);
app.use(shiftsRouter);
app.use(scheduleRouter);
app.use(feedRouter);
app.use(routesRouter);
app.use(wifiWhitelistRouter);
const PORT = process.env.PORT ?? 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
