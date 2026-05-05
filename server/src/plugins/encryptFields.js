import { encryptText, decryptText } from '../services/cryptoService.js';

function tryDecrypt(value) {
  try {
    return decryptText(value);
  } catch {
    return value; // not yet encrypted (existing data) — pass through unchanged
  }
}

function decryptDoc(doc, fields) {
  if (!doc) return;
  for (const field of fields) {
    if (doc[field] != null) doc[field] = tryDecrypt(doc[field]);
  }
}

/**
 * Mongoose plugin that transparently encrypts/decrypts the specified string fields.
 *
 * Usage:
 *   schema.plugin(encryptedFieldsPlugin, { fields: ['title', 'timestamp'] });
 *
 * For aggregate results (no middleware support), call Model.decryptDocs(results).
 */
export function encryptedFieldsPlugin(schema, { fields = [] } = {}) {
  schema.pre('save', function () {
    for (const field of fields) {
      if (this.isModified(field) && this[field] != null) {
        this[field] = encryptText(this[field]);
      }
    }
  });

  schema.post('save', function (doc) {
    decryptDoc(doc, fields);
  });

  // Encrypt fields carried in findOneAndUpdate / findByIdAndUpdate calls
  schema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    for (const field of fields) {
      if (update[field] != null)        update[field]       = encryptText(update[field]);
      if (update.$set?.[field] != null) update.$set[field]  = encryptText(update.$set[field]);
    }
  });

  schema.post(['find', 'findOne', 'findOneAndUpdate'], function (docs) {
    if (!docs) return;
    Array.isArray(docs) ? docs.forEach((d) => decryptDoc(d, fields)) : decryptDoc(docs, fields);
  });

  // Aggregate bypasses middleware — call this manually on aggregate results
  schema.statics.decryptDocs = function (docs) {
    return docs.map((doc) => {
      const copy = { ...doc };
      decryptDoc(copy, fields);
      return copy;
    });
  };
}
