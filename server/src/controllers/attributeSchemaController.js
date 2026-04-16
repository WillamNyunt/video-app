import * as attributeSchemaService from '../services/attributeSchemaService.js';

export async function getAll(req, res, next) {
  try {
    const schemas = await attributeSchemaService.getAllSchemas();
    return res.json(schemas);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { label, type, options, order } = req.body;
    if (!label || !type) {
      return res.status(400).json({ error: 'label and type are required' });
    }
    const schema = await attributeSchemaService.createSchema({ label, type, options, order });
    return res.status(201).json(schema);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const schema = await attributeSchemaService.updateSchema(req.params.id, req.body);
    return res.json(schema);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await attributeSchemaService.deleteSchema(req.params.id);
    return res.json({ message: 'Attribute schema deleted' });
  } catch (err) {
    next(err);
  }
}
