import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
