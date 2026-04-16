import mongoose from 'mongoose';

const personSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // PRIVATE — never log or expose this field
    attributes: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

personSchema.index({ name: 1 });

const Person = mongoose.model('Person', personSchema);

export default Person;
