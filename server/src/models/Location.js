import mongoose from 'mongoose';
import { encryptedFieldsPlugin } from '../plugins/encryptFields.js';

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

locationSchema.plugin(encryptedFieldsPlugin, { fields: ['address'] });

const Location = mongoose.model('Location', locationSchema);

export default Location;
