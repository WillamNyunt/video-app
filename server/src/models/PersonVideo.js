import mongoose from 'mongoose';

const personVideoSchema = new mongoose.Schema(
  {
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
  },
  { timestamps: true }
);

personVideoSchema.index({ personId: 1, videoId: 1 }, { unique: true });

const PersonVideo = mongoose.model('PersonVideo', personVideoSchema);

export default PersonVideo;
