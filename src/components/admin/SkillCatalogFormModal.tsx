import React, { useState } from 'react';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { AdminSelect } from './AdminSelect';
import { skillTokenError, resourceDescriptionError } from '../../lib/inputValidation';
import { getAccessToken } from '../../lib/supabase';
import { normalizeText, isDuplicateDbError } from '../../lib/utils';

export interface SkillFormValues {
  name: string;
  description: string;
  domain_id: string;
}

interface DomainOption {
  id: string;
  name: string;
}

interface SkillCatalogFormModalProps {
  isOpen: boolean;
  editingId: string | null;
  initialValues: SkillFormValues;
  domains: DomainOption[];
  catalogSkills: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function SkillCatalogFormModal({
  isOpen,
  editingId,
  initialValues,
  domains,
  catalogSkills,
  onClose,
  onSaved,
  showToast
}: SkillCatalogFormModalProps) {
  const [formData, setFormData] = useState<SkillFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validateForm(): string | null {
    const newErrors: Record<string, string> = {};
    const nameErr = skillTokenError(formData.name);
    if (nameErr) newErrors.name = nameErr;
    const descErr = resourceDescriptionError(formData.description);
    if (descErr) newErrors.description = descErr;
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return Object.values(newErrors)[0];
    return null;
  }

  async function handleSave() {
    const v = validateForm();
    if (v) {
      showToast(v, 'error');
      return;
    }

    const normalizedSkillName = normalizeText(formData.name);
    const duplicateSkill = catalogSkills.some(
      (skill) => normalizeText(skill.name) === normalizedSkillName && skill.id !== editingId
    );
    if (duplicateSkill) {
      showToast('Already exists', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const payload = {
        id: editingId || undefined,
        name: formData.name.trim(),
        description: formData.description.trim(),
        domain_id: formData.domain_id.trim() || undefined
      };

      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to save skill');
      }

      showToast(editingId ? 'Skill updated successfully' : 'Skill created successfully', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      if (isDuplicateDbError(err)) {
        showToast('Already exists', 'error');
      } else {
        const msg = err?.message || 'Failed to save skill';
        showToast(
          /row-level security|RLS|policy|not-null|null value in column "domain_id"/i.test(String(msg))
            ? `${msg} (If domain is required in your DB, run: ALTER TABLE public.skills ALTER COLUMN domain_id DROP NOT NULL; or add a domain first.)`
            : msg,
          'error'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AdminModal
      isOpen
      wide
      title={editingId ? 'Edit Skill' : 'Add New Skill'}
      onClose={onClose}
      onSubmit={handleSave}
      loading={saving}
    >
      <AdminInput
        label="Skill Name"
        value={formData.name}
        onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
        placeholder="e.g., React.js, TypeScript"
        error={errors.name}
        required
        validator={skillTokenError}
        onValidated={(err) => setErrors((prev) => ({ ...prev, name: err ?? '' }))}
      />
      {domains.length === 0 && (
        <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          No domains loaded yet. Leave Domain as Unassigned, or set up the Domains tab + database first and refresh.
        </p>
      )}
      <AdminSelect
        label="Domain (optional)"
        value={formData.domain_id}
        onChange={(value) => setFormData((prev) => ({ ...prev, domain_id: value }))}
        options={domains.map((d) => ({ value: d.id, label: d.name }))}
        placeholder="Unassigned (optional — add domains later)"
        error={errors.domain_id}
      />
      <AdminInput
        label="Description"
        type="textarea"
        value={formData.description}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
        placeholder="What will students learn?"
        error={errors.description}
        required
        validator={resourceDescriptionError}
        onValidated={(err) => setErrors((prev) => ({ ...prev, description: err ?? '' }))}
      />
    </AdminModal>
  );
}
