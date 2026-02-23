import { useEffect, useState } from 'react';
import {
  fetchDoctors,
  addDoctor,
  type Doctor,
  type NewDoctor,
} from '../../backend/services/staffService';

type Status = 'on duty' | 'off duty' | 'on break';

const departmentColors: Record<string, string> = {
  Cardiology: '#E53E3E',
  Neurology: '#805AD5',
  Pediatrics: '#38A169',
  Orthopedics: '#DD6B20',
  Dermatology: '#D69E2E',
  Radiology: '#3182CE',
  Surgery: '#E53E3E',
  General: '#4A90D9',
};

const DEPARTMENTS = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Radiology',
  'Surgery',
  'General',
];

function getAvatarColor(dept: string): string {
  return departmentColors[dept] ?? '#4A90D9';
}

function getInitials(name: string): string {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getStatus(slots: number): Status {
  if (slots === 0) return 'off duty';
  if (slots <= 2) return 'on break';
  return 'on duty';
}

const statusConfig: Record<
  Status,
  { label: string; bg: string; color: string }
> = {
  'on duty': { label: '+On Duty', bg: '#E8F5E9', color: '#2E7D32' },
  'off duty': { label: '+Off Duty', bg: '#FFEBEE', color: '#C62828' },
  'on break': { label: '+On Break', bg: '#E3F2FD', color: '#1565C0' },
};

// ─── Add Staff Modal ──────────────────────────────────────────────────────────

const EMPTY_FORM: NewDoctor = {
  doctor_name: '',
  department: '',
  workingHours: '',
  availableSlots: 0,
  contact_number: '',
  email_address: '',
};

function AddStaffModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (doctor: Doctor) => void;
}) {
  const [form, setForm] = useState<NewDoctor>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof NewDoctor, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (
      !form.doctor_name.trim() ||
      !form.department ||
      !form.email_address.trim()
    ) {
      setError('Doctor name, department, and email are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error } = await addDoctor(form);
    setSaving(false);
    if (error) {
      setError(error);
    } else if (data) {
      onSuccess(data);
      onClose();
    }
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {/* Modal box */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '28px 28px 24px',
          width: 420,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <h2
          style={{
            margin: '0 0 20px',
            fontSize: 18,
            fontWeight: 700,
            color: '#1a1a2e',
          }}
        >
          Add Staff Profile
        </h2>

        {error && (
          <div
            style={{
              background: '#FFEBEE',
              color: '#C62828',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Doctor Name */}
          <div>
            <label style={labelStyle}>Doctor Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Maria Santos"
              value={form.doctor_name}
              onChange={(e) => handleChange('doctor_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Department */}
          <div>
            <label style={labelStyle}>Department</label>
            <select
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              style={{
                ...inputStyle,
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Working Hours */}
          <div>
            <label style={labelStyle}>Working Hours</label>
            <input
              type="text"
              placeholder="e.g. 08:00 AM - 05:00 PM"
              value={form.workingHours}
              onChange={(e) => handleChange('workingHours', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Available Slots */}
          <div>
            <label style={labelStyle}>Available Slots</label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 8"
              value={form.availableSlots}
              onChange={(e) =>
                handleChange('availableSlots', Number(e.target.value))
              }
              style={inputStyle}
            />
          </div>

          {/* Contact Number */}
          <div>
            <label style={labelStyle}>Contact Number</label>
            <input
              type="text"
              placeholder="e.g. 09171234567"
              value={form.contact_number}
              onChange={(e) => handleChange('contact_number', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Email Address */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. doctor@clinika.com"
              value={form.email_address}
              onChange={(e) => handleChange('email_address', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 22,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: '#f0f0f5',
              color: '#555',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              background: saving ? '#93b4f5' : '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {saving ? 'Saving...' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

function StaffCard({ doctor }: { doctor: Doctor }) {
  const status = getStatus(doctor.availableSlots);
  const { label, bg, color } = statusConfig[status];
  const avatarColor = getAvatarColor(doctor.department);
  const initials = getInitials(doctor.doctor_name);
  const joinDate = new Date(doctor.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '14px 12px 12px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.07)',
        position: 'relative',
        boxSizing: 'border-box',
        height: '100%',
      }}
    >
      <button
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#bbb',
          fontSize: 18,
          lineHeight: 1,
          padding: '2px 4px',
        }}
      >
        ⋮
      </button>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {initials}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>
          {doctor.doctor_name}
        </div>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 5 }}>
          {doctor.department}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: bg,
            color,
            padding: '2px 10px',
            borderRadius: 20,
            display: 'inline-block',
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0 8px' }} />

      <div style={{ fontSize: 10, color: '#555' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
          }}
        >
          <span style={{ flexShrink: 0 }}>✉</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doctor.email_address}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
          }}
        >
          <span style={{ flexShrink: 0 }}>📞</span>
          <span>{doctor.contact_number}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ flexShrink: 0 }}>🕐</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doctor.workingHours}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0 6px' }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          gap: 4,
        }}
      >
        <span style={{ color: '#aaa', whiteSpace: 'nowrap' }}>
          Date of Joining
        </span>
        <span style={{ color: '#444', fontWeight: 600, textAlign: 'right' }}>
          {joinDate}
        </span>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}
    >
      <span
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#aaa',
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        🔍
      </span>
      <input
        type="text"
        placeholder="Search staff..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#fff',
          border: '1px solid #dce0f0',
          borderRadius: 8,
          padding: '6px 30px 6px 32px',
          fontSize: 13,
          color: '#333',
          outline: 'none',
          height: 34,
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#aaa',
            fontSize: 13,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  search,
  onSearch,
  filter,
  onFilter,
  departments,
  onAddStaff,
}: {
  search: string;
  onSearch: (v: string) => void;
  filter: string;
  onFilter: (v: string) => void;
  departments: string[];
  onAddStaff: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      <button style={navBtn}>‹</button>
      <button style={navBtn}>›</button>

      <button
        style={{
          background: '#fff',
          border: '1px solid #dce0f0',
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: '#333',
        }}
      >
        New <span style={{ fontSize: 10 }}>▾</span>
      </button>

      <SearchBar value={search} onChange={onSearch} />

      <div style={{ flex: 1 }} />

      <select
        value={filter}
        onChange={(e) => onFilter(e.target.value)}
        style={{
          background: '#fff',
          border: '1px solid #dce0f0',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          cursor: 'pointer',
          color: '#333',
          appearance: 'none',
          WebkitAppearance: 'none',
          minWidth: 120,
          height: 34,
        }}
      >
        {departments.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <button
        onClick={onAddStaff}
        style={{
          background: '#2563EB',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '7px 16px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          whiteSpace: 'nowrap',
          height: 34,
        }}
      >
        + Add Staff
      </button>
    </div>
  );
}

// ─── Staff Grid ───────────────────────────────────────────────────────────────

function StaffGrid({ doctors }: { doctors: Doctor[] }) {
  if (doctors.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          color: '#aaa',
          padding: 40,
          fontSize: 14,
        }}
      >
        No staff found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {doctors.map((doctor) => (
        <div
          key={doctor.doctorID}
          style={{
            flex: '0 0 calc(20% - 10px)',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <StaffCard doctor={doctor} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function StaffInformation() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Members');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchDoctors();
      if (error) setError(error);
      else setDoctors(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleNewDoctor(doctor: Doctor) {
    setDoctors((prev) => [...prev, doctor]);
  }

  const departments = [
    'All Members',
    ...Array.from(new Set(doctors.map((d) => d.department))),
  ];

  const filtered = doctors.filter((d) => {
    const matchesDept = filter === 'All Members' || d.department === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.doctor_name.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.email_address.toLowerCase().includes(q) ||
      d.contact_number.includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <div
      style={{
        background: '#EEF2FB',
        minHeight: '100vh',
        padding: 20,
        fontFamily: "'Segoe UI', 'DM Sans', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <Toolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        departments={departments}
        onAddStaff={() => setShowModal(true)}
      />

      {loading && (
        <div
          style={{
            textAlign: 'center',
            color: '#888',
            padding: 40,
            fontSize: 14,
          }}
        >
          Loading staff data...
        </div>
      )}

      {error && (
        <div
          style={{
            textAlign: 'center',
            color: '#C62828',
            background: '#FFEBEE',
            borderRadius: 10,
            padding: '16px 20px',
            fontSize: 13,
          }}
        >
          ⚠️ Failed to load data: {error}
        </div>
      )}

      {!loading && !error && <StaffGrid doctors={filtered} />}

      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onSuccess={handleNewDoctor}
        />
      )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dce0f0',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  color: '#555',
  padding: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#444',
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #dce0f0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#333',
  outline: 'none',
  background: '#fff',
};

export default StaffInformation;
