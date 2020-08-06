import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";
import mongo from "connect-mongo";
import passport from "passport";
import passportLocal from "passport-local";

import appRoutes from "./routes/user";
import { CONSTANTS } from "./config/constants";
import { user } from "./models/user";

const MongoStore = mongo(session);

// Create Express server
const app = express();

// Connect to MongoDB
mongoose.connect(CONSTANTS.MONGO_URL,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(
    () => {
      console.log("MongoDB connection is set. MongoDB is running.");
    },
  ).catch((err) => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
  });

// Express configuration
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());
app.use(session({
  secret: CONSTANTS.SESSION_SECRET,
  saveUninitialized: true,
  resave: true,
  store: new MongoStore({
    url: CONSTANTS.MONGO_URL,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
const LocalStrategy = passportLocal.Strategy;

passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
  user.findOne({ email: email }, (err, user: any) => {
    if (err) { return done(err); }
    if (!user) {
      return done(undefined, false, { message: `Email ${email} not found.` });
    }
    user.comparePassword(password, (err: Error, isMatch: boolean) => {
      if (err) { return done(err); }
      if (isMatch) {
        return done(undefined, user);
      }
      return done(undefined, false, { message: "Invalid email or password." });
    });
  });
}));

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  user.findById(id, (err, user) => {
    done(err, user);
  });
});

// Routes configuration
app.use(appRoutes);

export default app;
