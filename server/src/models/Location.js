import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    pictureUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Location = mongoose.model('Location', locationSchema);

export default Location;
