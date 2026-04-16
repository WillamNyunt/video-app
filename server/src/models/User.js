import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'guest'],
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
