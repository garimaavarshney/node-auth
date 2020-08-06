import async from "async";
import nodemailer from "nodemailer";
import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { user, UserDocument } from "../models/user";
import { CONSTANTS } from "../config/constants";

export const addUser = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
    return;
  } else {
    await check("username", "Username cannot be blank").isLength({ min: 1 }).run(req);
    await check("email", "Email is not valid").isEmail().run(req);
    await check("password", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
    await check("confirmPassword", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
    await check("confirmPassword", "Passwords do not match").equals(req.body.password).run(req);
    await check("dob", "Date of birth is not valid").isDate().run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).send({ error: errors.array() });
      return;
    }

    const userDoc = req.body as UserDocument;
    userDoc.firstName = req.body.firstName || "";
    userDoc.lastName = req.body.lastName || "";
    userDoc.streetAddress = req.body.streetAddress || "";
    userDoc.contact = req.body.contact || "";

    const userData = new user({
      username: req.body.username,
      password: req.body.password,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      email: req.body.email,
      dob: new Date(req.body.dob),
      streetAddress: userDoc.streetAddress,
      contact: userDoc.contact,
      accountStatus: true
    });

    try {
      await userData.save();
      res.status(201).send({ data: userData });

    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};

export const updateUserByEmail = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
    return;
  } else {
    try {
      await check("email", "Email is not valid").isEmail().run(req);
      await check("dob", "Date of birth is not valid").isDate().run(req);

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).send({ error: errors.array() });
        return;
      }

      const userDoc = req.body as UserDocument;
      userDoc.firstName = req.body.firstName || "";
      userDoc.lastName = req.body.lastName || "";
      userDoc.streetAddress = req.body.streetAddress || "";
      userDoc.contact = req.body.contact || "";

      const update = {
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        dob: new Date(req.body.dob),
        streetAddress: userDoc.streetAddress,
        contact: userDoc.contact,
      };

      const userData = await user.findOneAndUpdate({ email: req.body.email }, { $set: update },
        {
          "fields": { _id: 0, firstName: 1, lastName: 1, dob: 1, streetAddress: 1, contact: 1 },
          new: true
        });
      if (userData) {
        res.status(201).send({ data: userData });
      } else {
        res.status(400).send({ message: "User does not exist." });
      }
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
    return;
  } else {
    try {
      await check("password", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
      await check("confirmPassword", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
      await check("confirmPassword", "Passwords do not match").equals(req.body.password).run(req);

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).send({ error: errors.array() });
        return;
      }

      const userData = await user.findOneAndUpdate({ email: req.body.email }, { password: req.body.password });
      if (userData) {

        const transporter = nodemailer.createTransport({
          host: CONSTANTS.SENDGRID_HOST,
          port: CONSTANTS.SENDGRID_PORT,
          auth: {
            user: CONSTANTS.SENDGRID_USER,
            pass: CONSTANTS.SENDGRID_PASSWORD
          }
        });

        const mailOptions = {
          from: "testnodemail@yopmail.com",
          to: userData.email,
          subject: "Your password has been updated",
          text: `Hello ${userData.username},\n\nThis is a confirmation email for your account ${userData.email}. Your password has been updated.\n`
        };

        transporter.sendMail(mailOptions, (err) => {
          if (err) {
            res.status(400).send({ error: err.message });
          } else {
            res.status(201).send({ msg: "Email has been sent successfully!", data: userData });
          }
        });

      } else {
        res.status(400).send({ message: "User does not exist." });
      }
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};

export const fetchAllUser = async (req: Request, res: Response) => {
  try {
    const userData = await user.find({}, { _id: 0, username: 1, firstName: 1, lastName: 1, email: 1 });
    if (userData && userData.length > 0) {
      res.status(201).send({ data: userData });
    } else {
      res.status(400).send({ message: "No user data found." });
    }
  } catch (error) {
    res.status(500).send({ error: error });
  }
};

export const fetchUserByEmail = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
    return;
  } else {
    try {
      const userData = await user.find({ email: req.body.email },
        { _id: 0, username: 1, password: 1, firstName: 1, lastName: 1, email: 1, dob: 1, streetAddress: 1, contact: 1 });
      if (userData && userData.length > 0) {
        res.status(201).send({ data: userData[0] });
      } else {
        res.status(400).send({ message: "User does not exist." });
      }
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};

export const deleteUserByEmail = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
    return;
  } else {
    try {
      const userData = await user.findOneAndDelete({ email: req.body.email });
      if (userData) {
        res.status(201).send({ message: "User profile has been deleted." });
      } else {
        res.status(400).send({ message: "User does not exist." });
      }
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};

export const checkUserByEmail = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
    return;
  } else {
    try {
      await check("email", "Email is not valid").isEmail().run(req);
      await check("password", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).send({ error: errors.array() });
        return;
      }

      const userData = await user.find({ email: req.body.email },
        { _id: 0, username: 1, firstName: 1, lastName: 1, email: 1, dob: 1, streetAddress: 1, contact: 1 });
      if (userData && userData.length > 0) {
        res.status(201).send({ data: userData[0] });
      } else {
        res.status(400).send({ message: "User does not exist." });
      }
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};
