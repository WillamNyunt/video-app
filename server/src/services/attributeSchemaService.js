import PersonAttributeSchema from '../models/PersonAttributeSchema.js';

export async function getAllSchemas() {
  return PersonAttributeSchema.find().sort({ order: 1, createdAt: 1 });
}

export async function createSchema(data) {
  return PersonAttributeSchema.create(data);
}

export async function updateSchema(id, data) {
  const schema = await PersonAttributeSchema.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!schema) {
    throw Object.assign(new Error('Attribute schema not found'), { status: 404 });
  }
  return schema;
}

export async function deleteSchema(id) {
  const schema = await PersonAttributeSchema.findByIdAndDelete(id);
  if (!schema) {
    throw Object.assign(new Error('Attribute schema not found'), { status: 404 });
  }
  return schema;
}
