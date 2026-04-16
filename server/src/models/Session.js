import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ locationId: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
