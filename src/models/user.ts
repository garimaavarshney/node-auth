import mongoose from "mongoose";
import bcrypt from "bcrypt";

export type UserDocument = mongoose.Document & {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  dob: Date;
  streetAddress: string;
  contact: string;
  accountStatus: boolean;
  comparePassword: comparePasswordFunction;
};

type comparePasswordFunction = (candidatePassword: string,
  cb: (err: any, isMatch: any) => {
  }) => void;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: ""
  },
  lastName: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  dob: Date,
  streetAddress: String,
  contact: String,
  accountStatus: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
});

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
  const user = this as UserDocument;
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Check to compare password.
 */
const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

userSchema.methods.comparePassword = comparePassword;

export const user = mongoose.model<UserDocument>("user", userSchema);
