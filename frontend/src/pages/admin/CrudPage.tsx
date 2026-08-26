import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

import { api, apiData } from '@/lib/api';
import { Spinner, EmptyState, ErrorState } from '@/components/ui';

export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select';

export interface Field {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
  required?: boolean;
}

export interface Column {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => React.ReactNode;
}

interface CrudPageProps {
  title: string;
  endpoint: string; // e.g. "admin/projects"
  columns: Column[];
  fields: Field[];
  emptyMessage?: string;
}

/**
 * Generic CRUD screen. Every module (projects / experiences / skills) reuses
 * this, so a new module only needs a column + field definition.
 */
export function CrudPage({ title, endpoint, columns, fields, emptyMessage }: CrudPageProps) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Record<string, any>[]>(`/${endpoint}`, { auth: true })
      .then((d) => setRows(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [endpoint]);

  const openCreate = () => {
    const blank: Record<string, any> = {};
    for (const f of fields) {
      blank[f.key] = f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '';
    }
    setForm(blank);
    setEditing(null);
    setFormError('');
    setOpen(true);
  };

  const openEdit = (row: Record<string, any>) => {
    const filled: Record<string, any> = {};
    for (const f of fields) {
      const v = row[f.key];
      filled[f.key] = f.type === 'checkbox' ? v === 1 || v === true : (v ?? '');
    }
    setForm(filled);
    setEditing(row);
    setFormError('');
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const missing = fields.filter((f) => f.required && !String(form[f.key] ?? '').trim());
    if (missing.length) {
      setFormError(`Wajib diisi: ${missing.map((m) => m.label).join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        let v = form[f.key];
        if (f.type === 'number') v = Number(v) || 0;
        payload[f.key] = v;
      }

      if (editing) {
        await api(`/${endpoint}/${editing.id}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/${endpoint}`, {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Record<string, any>) => {
    if (!window.confirm('Hapus data ini?')) return;
    try {
      await api(`/${endpoint}/${row.id}`, { method: 'DELETE', auth: true });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium text-mist-50">{title}</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} aria-hidden="true" />
          Tambah
        </button>
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState message={emptyMessage || 'Belum ada data.'} />
      )}

      {!loading && rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-mono text-xs font-normal text-mist-600">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-mono text-xs font-normal text-mist-600">
                  aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-700/60 last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-mist-200">
                      {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(row)}
                        aria-label="Edit"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-mist-400 hover:bg-ink-700 hover:text-accent"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => remove(row)}
                        aria-label="Hapus"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-mist-400 hover:bg-ink-700 hover:text-red-300"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-lg border border-ink-700 bg-ink-900">
            <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
              <h2 className="text-sm font-medium text-mist-50">
                {editing ? `Edit ${title}` : `Tambah ${title}`}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="flex h-9 w-9 items-center justify-center rounded-md text-mist-400 hover:text-mist-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4 p-5" noValidate>
              {fields.map((f) => (
                <div key={f.key}>
                  {f.type === 'checkbox' ? (
                    <label
                      htmlFor={`f-${f.key}`}
                      className="flex min-h-[44px] cursor-pointer items-center gap-3"
                    >
                      <input
                        id={`f-${f.key}`}
                        type="checkbox"
                        checked={!!form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                        className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent"
                      />
                      <span className="text-sm text-mist-200">{f.label}</span>
                    </label>
                  ) : (
                    <>
                      <label
                        htmlFor={`f-${f.key}`}
                        className="mb-1.5 block font-mono text-xs text-mist-400"
                      >
                        {f.label}
                        {f.required && <span className="text-accent"> *</span>}
                      </label>

                      {f.type === 'textarea' ? (
                        <textarea
                          id={`f-${f.key}`}
                          rows={4}
                          className="input resize-y"
                          placeholder={f.placeholder}
                          value={form[f.key] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        />
                      ) : f.type === 'select' ? (
                        <select
                          id={`f-${f.key}`}
                          className="input"
                          value={form[f.key] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        >
                          <option value="">— pilih —</option>
                          {(f.options || []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`f-${f.key}`}
                          type={f.type === 'number' ? 'number' : 'text'}
                          className="input"
                          placeholder={f.placeholder}
                          value={form[f.key] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        />
                      )}

                      {f.help && <p className="mt-1 font-mono text-[11px] text-mist-600">{f.help}</p>}
                    </>
                  )}
                </div>
              ))}

              {formError && (
                <p className="text-sm text-red-300" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
