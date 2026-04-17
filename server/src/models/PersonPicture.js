import mongoose from 'mongoose';

const personPictureSchema = new mongoose.Schema(
  {
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

personPictureSchema.index({ personId: 1, createdAt: -1 });

const PersonPicture = mongoose.model('PersonPicture', personPictureSchema);
export default PersonPicture;
