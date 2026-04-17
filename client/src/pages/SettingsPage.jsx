import { useEffect, useState } from 'react';
import { Settings, Sun, Moon, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { updateSetting } from '../api/settings';
import { getSchema, createSchema, updateSchema, deleteSchema } from '../api/attributeSchema';
import './SettingsPage.css';

const SCHEMA_TYPES = ['dropdown', 'checkbox', 'slider'];

function SchemaFormFields({ type, options, onChange }) {
  if (type === 'dropdown') {
    const items = options?.items || [];
    function handleItemChange(idx, val) {
      const next = [...items];
      next[idx] = val;
      onChange({ items: next });
    }
    function addItem() { onChange({ items: [...items, ''] }); }
    function removeItem(idx) {
      const next = items.filter((_, i) => i !== idx);
      onChange({ items: next });
    }
    return (
      <div className="schema-options">
        <span className="form-label">Options</span>
        {items.map((item, idx) => (
          <div key={idx} className="schema-option-row">
            <input
              type="text"
              className="form-input"
              value={item}
              onChange={(e) => handleItemChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
            />
            <button type="button" className="btn-icon danger" onClick={() => removeItem(idx)} title="Remove option">
              <X size={13} />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary schema-add-option" onClick={addItem}>
          <Plus size={13} />
          Add option
        </button>
      </div>
    );
  }

  if (type === 'slider') {
    const min = options?.min ?? 0;
    const max = options?.max ?? 100;
    const step = options?.step ?? 1;
    return (
      <div className="schema-options">
        <div className="schema-options-row">
          <div className="form-group">
            <label className="form-label">Min</label>
            <input
              type="number"
              className="form-input"
              value={min}
              onChange={(e) => onChange({ ...options, min: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max</label>
            <input
              type="number"
              className="form-input"
              value={max}
              onChange={(e) => onChange({ ...options, max: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Step</label>
            <input
              type="number"
              className="form-input"
              value={step}
              min={0}
              step="any"
              onChange={(e) => onChange({ ...options, step: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    );
  }

  return null; // checkbox has no extra options
}

const EMPTY_FORM = { label: '', type: 'dropdown', options: {}, order: 0 };

export default function SettingsPage() {
  const [schema, setSchema] = useState([]);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState('');

  // Theme
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );
  const [themeError, setThemeError] = useState('');
  const [themeSaving, setThemeSaving] = useState(false);

  // Schema form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchSchema();
  }, []);

  async function fetchSchema() {
    setSchemaLoading(true);
    setSchemaError('');
    try {
      const data = await getSchema();
      setSchema(data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      setSchemaError(err.message);
    } finally {
      setSchemaLoading(false);
    }
  }

  async function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
    setThemeError('');
    setThemeSaving(true);
    try {
      await updateSetting('theme', next);
    } catch (err) {
      document.documentElement.setAttribute('data-theme', theme);
      setTheme(theme);
      setThemeError(err.message);
    } finally {
      setThemeSaving(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(attr) {
    setEditingId(attr._id);
    setForm({
      label: attr.label,
      type: attr.type,
      options: attr.options ? { ...attr.options } : {},
      order: attr.order ?? 0,
    });
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.label.trim()) { setFormError('Label is required.'); return; }
    if (!form.type) { setFormError('Type is required.'); return; }
    setFormSubmitting(true);
    try {
      const payload = {
        label: form.label.trim(),
        type: form.type,
        options: form.options,
        order: Number(form.order) || 0,
      };
      if (editingId) {
        const updated = await updateSchema(editingId, payload);
        setSchema((prev) =>
          prev.map((s) => (s._id === editingId ? updated : s)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );
      } else {
        const created = await createSchema(payload);
        setSchema((prev) => [...prev, created].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
      closeForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeleteError('');
    if (!confirm('Delete this attribute? Existing person data using it will not be removed.')) return;
    try {
      await deleteSchema(id);
      setSchema((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Settings size={20} />
          Settings
        </h1>
      </div>

      {/* Theme */}
      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="theme-toggle-row">
          <div>
            <p className="settings-label">Theme</p>
            <p className="settings-hint">Current: {theme === 'dark' ? 'Dark' : 'Light'}</p>
          </div>
          <button
            className="btn btn-secondary theme-toggle-btn"
            onClick={handleThemeToggle}
            disabled={themeSaving}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
        {themeError && <p className="error-message">{themeError}</p>}
      </section>

      {/* Attribute Schema */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Person Attribute Schema</h2>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} />
            Add Attribute
          </button>
        </div>
        <p className="settings-hint" style={{ marginBottom: 16 }}>
          Define the dynamic attributes that people can have. Types: dropdown, checkbox, slider.
        </p>

        {schemaError && <p className="error-message">{schemaError}</p>}
        {deleteError && <p className="error-message">{deleteError}</p>}

        {schemaLoading ? (
          <div className="spinner" />
        ) : schema.length === 0 ? (
          <p className="empty-state">No attributes defined. Add one above.</p>
        ) : (
          <div className="schema-list">
            {schema.map((attr) => (
              <div key={attr._id} className="schema-row">
                <div className="schema-row__info">
                  <span className="schema-row__label">{attr.label}</span>
                  <span className="badge schema-row__type">{attr.type}</span>
                  {attr.type === 'dropdown' && attr.options?.items?.length > 0 && (
                    <span className="schema-row__detail">
                      [{attr.options.items.join(', ')}]
                    </span>
                  )}
                  {attr.type === 'slider' && (
                    <span className="schema-row__detail">
                      {attr.options?.min ?? 0}–{attr.options?.max ?? 100} (step {attr.options?.step ?? 1})
                    </span>
                  )}
                </div>
                <div className="schema-row__actions">
                  <button className="btn-icon" onClick={() => openEdit(attr)} title="Edit attribute">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(attr._id)} title="Delete attribute">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Schema Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 className="modal-title">{editingId ? 'Edit Attribute' : 'Add Attribute'}</h2>
            {formError && <p className="error-message" style={{ marginBottom: 16 }}>{formError}</p>}
            <form onSubmit={handleFormSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Label *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  disabled={formSubmitting}
                  autoFocus
                  placeholder="e.g. Hair color"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Type *</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, options: {} }))}
                  disabled={formSubmitting}
                >
                  {SCHEMA_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Display order</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                  disabled={formSubmitting}
                  min={0}
                />
              </div>

              <SchemaFormFields
                type={form.type}
                options={form.options}
                onChange={(opts) => setForm((f) => ({ ...f, options: opts }))}
              />

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeForm} disabled={formSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
