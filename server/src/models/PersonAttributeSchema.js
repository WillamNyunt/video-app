import mongoose from 'mongoose';
import { encryptedFieldsPlugin } from '../plugins/encryptFields.js';

const personAttributeSchemaSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['dropdown', 'checkbox', 'slider'],
      required: true,
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      // dropdown: { items: [String] }
      // checkbox: { label: String }
      // slider:   { min: Number, max: Number, step: Number }
    },
    order: {
      type: Number,
    },
  },
  { timestamps: true }
);

personAttributeSchemaSchema.plugin(encryptedFieldsPlugin, { fields: ['label'] });

const PersonAttributeSchema = mongoose.model('PersonAttributeSchema', personAttributeSchemaSchema);

export default PersonAttributeSchema;
