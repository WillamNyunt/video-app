import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    timestamp: {
      type: String,
    },
    fileSizeBytes: {
      type: Number,
    },
    durationSeconds: {
      type: Number,
    },
  },
  { timestamps: true }
);

videoSchema.index({ sessionId: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
