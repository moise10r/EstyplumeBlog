const express = require("express");
const app = express();
const dotenv = require("dotenv");
const chalk = require("chalk");
const debug = require("debug")("app");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const csrf = require("csurf");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const Joi = require("joi");
Joi.object = require("joi-objectid")(Joi);

const crypto = require("crypto");

let value = crypto.randomBytes(64).toString("hex");

// const UserRouter = require("./routes/UserRoutes");
const routes = require("./routes/route");

const csrfProtection = csrf();

//load config
dotenv.config({ path: "./config/config.env" });

//connect mongoDB
const connectDB = require("./config/db");
connectDB();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
//middlewares

//connect-flash
app.use(flash());
//bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
//helmet
app.use(helmet());
app.use(compression());
app.use(flash());

// app.use("/", UserRouter);
app.use("/", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(
    `The server is runnig in ${
      process.env.NODE_ENV
    }, on port: ${chalk.bgGreenBright(PORT)}`
  );
});
