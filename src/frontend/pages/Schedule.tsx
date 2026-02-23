import { useState, useMemo } from 'react';

/* ─── Types ───────────────────────────────────────────────── */
type Role = 'Doctor' | 'Nurse';

interface StaffMember {
  id: string;
  name: string;
  role: Role;
  initials: string;
  color: string;
}

interface ShiftEntry {
  id: string;
  staffId: string;
  name: string;
  role: Role;
  startTime: string;
  endTime: string;
  hasConflict?: boolean;
}

interface ConflictItem {
  staffName: string;
  role: Role;
  conflictType: string;
  action: string;
}

interface EditState {
  open: boolean;
  day: string;
  timeSlot: string;
  shift: ShiftEntry | null;
}

type ScheduleData = Record<string, Record<string, ShiftEntry[]>>;

const STAFF: StaffMember[] = [
  { id: 'jdir',  name: 'John Dir',  role: 'Doctor', initials: 'JD', color: '#6C63FF' },
  { id: 'jdoe',  name: 'John Doe',  role: 'Nurse',  initials: 'JO', color: '#FF6B9D' },
  { id: 'jcruz', name: 'Jane Cruz', role: 'Doctor', initials: 'JC', color: '#845EF7' },
  { id: 'arey',  name: 'Ana Reyes', role: 'Nurse',  initials: 'AR', color: '#FF4E6A' },
];

const ROLE_STYLES: Record<Role, { bg: string; border: string; text: string; dot: string; tag: string }> = {
  Doctor: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', dot: '#6366F1', tag: '#E0E7FF' },
  Nurse:  { bg: '#FFF0F6', border: '#FFADD2', text: '#C2255C', dot: '#F06595', tag: '#FFE3EF' },
};

const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SLOTS = ['08:00 AM','09:00 AM','04:00 PM'];

const WEEKS = [
  { label: 'Feb 2 – 8',      dates: ['2','3','4','5','6','7','8'] },
  { label: 'Feb 9 – 15',     dates: ['9','10','11','12','13','14','15'] },
  { label: 'Feb 16 – 22',    dates: ['16','17','18','19','20','21','22'] },
  { label: 'Feb 23 – Mar 1', dates: ['23','24','25','26','27','28','1'] },
];

const BASE_SCHEDULE = {
  '08:00 AM': {
    Sun:[], Mon:[{id:'s1',staffId:'jdir',name:'John Dir',role:'Doctor',startTime:'08:00 AM',endTime:'04:00 PM'}],
    Tue:[{id:'s2',staffId:'jdir',name:'John Dir',role:'Doctor',startTime:'08:00 AM',endTime:'04:00 PM'}],
    Wed:[{id:'s3',staffId:'jdir',name:'John Dir',role:'Doctor',startTime:'08:00 AM',endTime:'04:00 PM'}],
    Thu:[{id:'s4',staffId:'jcruz',name:'Jane Cruz',role:'Doctor',startTime:'08:00 AM',endTime:'04:00 PM'}],
    Fri:[{id:'s5',staffId:'jcruz',name:'Jane Cruz',role:'Doctor',startTime:'08:00 AM',endTime:'04:00 PM'}],
    Sat:[{id:'s6',staffId:'jcruz',name:'Jane Cruz',role:'Doctor',startTime:'08:00 AM',endTime:'04:00 PM'}],
  },
  '09:00 AM': {
    Sun:[], Mon:[{id:'s7',staffId:'jdoe',name:'John Doe',role:'Nurse',startTime:'09:00 AM',endTime:'06:00 PM'}],
    Tue:[{id:'s8',staffId:'jdoe',name:'John Doe',role:'Nurse',startTime:'09:00 AM',endTime:'06:00 PM',hasConflict:true}],
    Wed:[{id:'s9',staffId:'jdoe',name:'John Doe',role:'Nurse',startTime:'09:00 AM',endTime:'06:00 PM'}],
    Thu:[{id:'s10',staffId:'jdoe',name:'John Doe',role:'Nurse',startTime:'09:00 AM',endTime:'06:00 PM'}],
    Fri:[{id:'s11',staffId:'jdoe',name:'John Doe',role:'Nurse',startTime:'09:00 AM',endTime:'06:00 PM'}],
    Sat:[{id:'s12',staffId:'jdoe',name:'John Doe',role:'Nurse',startTime:'09:00 AM',endTime:'06:00 PM'}],
  },
  '04:00 PM': {
    Sun:[],
    Mon:[
      {id:'s13',staffId:'arey',name:'Ana Reyes',role:'Nurse',startTime:'04:00 PM',endTime:'12:00 AM',hasConflict:true},
      {id:'s14',staffId:'jcruz',name:'Jane Cruz',role:'Doctor',startTime:'04:00 PM',endTime:'12:00 AM'},
    ],
    Tue:[
      {id:'s15',staffId:'arey',name:'Ana Reyes',role:'Nurse',startTime:'04:00 PM',endTime:'12:00 AM'},
      {id:'s16',staffId:'jcruz',name:'Jane Cruz',role:'Doctor',startTime:'04:00 PM',endTime:'12:00 AM'},
    ],
    Wed:[
      {id:'s17',staffId:'arey',name:'Ana Reyes',role:'Nurse',startTime:'04:00 PM',endTime:'12:00 AM',hasConflict:true},
      {id:'s18',staffId:'jcruz',name:'Jane Cruz',role:'Doctor',startTime:'04:00 PM',endTime:'12:00 AM'},
    ],
    Thu:[
      {id:'s19',staffId:'arey',name:'Ana Reyes',role:'Nurse',startTime:'04:00 PM',endTime:'12:00 AM'},
      {id:'s20',staffId:'jdir',name:'John Dir',role:'Doctor',startTime:'04:00 PM',endTime:'12:00 AM'},
    ],
    Fri:[
      {id:'s21',staffId:'arey',name:'Ana Reyes',role:'Nurse',startTime:'04:00 PM',endTime:'12:00 AM'},
      {id:'s22',staffId:'jdir',name:'John Dir',role:'Doctor',startTime:'04:00 PM',endTime:'12:00 AM'},
    ],
    Sat:[
      {id:'s23',staffId:'arey',name:'Ana Reyes',role:'Nurse',startTime:'04:00 PM',endTime:'12:00 AM'},
      {id:'s24',staffId:'jdir',name:'John Dir',role:'Doctor',startTime:'04:00 PM',endTime:'12:00 AM'},
    ],
  },
};

const CONFLICTS: ConflictItem[] = [
  {staffName:'John Doe',role:'Nurse',conflictType:'Overlapping Shift (Tuesday 5–6 PM)',action:'Resolved'},
  {staffName:'Jane Cruz',role:'Doctor',conflictType:'Exceeds Weekly Hours (52 hrs)',action:'Resolved'},
  {staffName:'Ana Reyes',role:'Nurse',conflictType:'Double Booking (Wed Morning)',action:'Resolved'},
  {staffName:'Ana Reyes',role:'Nurse',conflictType:'Outside Availability (Thu 8am–5pm)',action:'Resolved'},
];

/* ─── Avatar ──────────────────────────────────────────────── */
function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}cc, ${color})`,
      boxShadow: `0 2px 8px ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.34, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
        {initials}
      </span>
    </div>
  );
}

/* ─── Shift Card ──────────────────────────────────────────── */
function ShiftCard({ shift, onClick }: { shift: ShiftEntry; onClick: () => void }) {
  const s = ROLE_STYLES[shift.role];
  const member = STAFF.find(m => m.id === shift.staffId);
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: hovered ? s.tag : s.bg,
        border: `1.5px solid ${hovered ? s.dot : s.border}`,
        borderRadius: 10,
        padding: '7px 10px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 4px 12px ${s.dot}22` : '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <Avatar initials={member?.initials ?? shift.name[0]} color={member?.color ?? s.dot} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#1a1a3e',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {shift.name.split(' ')[0]}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: s.dot, marginTop: 1 }}>
          {shift.endTime}
        </div>
      </div>
      {shift.hasConflict && (
        <div style={{
          width: 16, height: 16, borderRadius: 4, background: '#FFF0F0',
          border: '1px solid #FFCDD2', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: '#E53935' }}>!</span>
        </div>
      )}
    </div>
  );
}

/* ─── Edit Modal ──────────────────────────────────────────── */
function EditModal({ edit, form, setForm, onSave, onDelete, onClose }: {
  edit: EditState;
  form: Partial<ShiftEntry>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ShiftEntry>>>;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!edit.open) return null;
  const member = STAFF.find(s => s.id === edit.shift?.staffId);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,10,40,0.45)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: 400, maxWidth: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
          padding: '20px 24px 16px', borderBottom: '1px solid #EDE9FE',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: '#DDD6FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 15, color: '#6366F1' }}>✏️</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1E1B4B' }}>Edit Shift</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {edit.day} · {edit.timeSlot}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            borderRadius: 8, width: 28, height: 28, fontSize: 14, color: '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {member && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#F8F8FF', borderRadius: 12, padding: '12px 14px',
              border: '1px solid #EEEEFF',
            }}>
              <Avatar initials={member.initials} color={member.color} size={36} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{edit.shift?.name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: ROLE_STYLES[edit.shift?.role]?.dot }}>
                  {edit.shift?.role}
                </div>
              </div>
            </div>
          )}

          {(['Staff Name', 'startTime', 'endTime'] as const).map((key) => {
            const label = key === 'startTime' ? 'Start Time' : key === 'endTime' ? 'End Time' : 'Staff Name';
            const formKey: keyof ShiftEntry = key === 'Staff Name' ? 'name' : key;
            return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </label>
              <input
                value={(form[formKey] as string) ?? ''}
                onChange={e => setForm(f => ({ ...f, [formKey]: e.target.value }))}
                style={{
                  border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 12px',
                  fontSize: 13, color: '#1E1B4B', outline: 'none', background: '#FAFAFA',
                  fontFamily: 'inherit', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#6366F1')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            );
          })}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Role
            </label>
            <select
              value={form.role ?? 'Nurse'}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{
                border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 12px',
                fontSize: 13, color: '#1E1B4B', outline: 'none', background: '#FAFAFA',
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px 20px',
        }}>
          <button onClick={onDelete} style={{
            border: '1.5px solid #FECACA', background: '#FFF5F5', color: '#EF4444',
            borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            Remove Shift
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              border: 'none', background: '#F9FAFB', color: '#9CA3AF',
              borderRadius: 10, padding: '8px 14px', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
            <button onClick={onSave} style={{
              border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff', borderRadius: 10, padding: '8px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(99,102,241,0.30)',
            }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Conflicts Modal ─────────────────────────────────────── */
function ConflictsModal({ open, onClose, weekLabel }: { open: boolean; onClose: () => void; weekLabel: string }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,10,40,0.45)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: 520, maxWidth: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F8, #FCE7F3)',
          padding: '20px 24px 16px', borderBottom: '1px solid #FCE7F3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: '#FFE0EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>⚠️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1E1B4B' }}>Conflict Resolution</div>
              <div style={{ fontSize: 12, color: '#BE185D', marginTop: 2 }}>Week of {weekLabel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0',
              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
            }}>All Resolved</span>
            <button onClick={onClose} style={{
              border: '1px solid #FCE7F3', background: 'rgba(255,255,255,0.7)',
              borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
              fontSize: 14, color: '#9CA3AF',
            }}>✕</button>
          </div>
        </div>
        <div>
          {CONFLICTS.map((c, i) => {
            const m = STAFF.find(s => s.name === c.staffName);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 22px',
                borderBottom: i < CONFLICTS.length - 1 ? '1px solid #FAFAFA' : 'none',
              }}>
                <Avatar initials={m?.initials ?? c.staffName[0]} color={m?.color ?? '#6366F1'} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>{c.staffName}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20,
                      background: ROLE_STYLES[c.role].bg,
                      border: `1px solid ${ROLE_STYLES[c.role].border}`,
                      fontSize: 10, fontWeight: 700, color: ROLE_STYLES[c.role].text,
                    }}>{c.role}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{c.conflictType}</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#DCFCE7', border: '1px solid #BBF7D0',
                  borderRadius: 20, padding: '5px 10px',
                }}>
                  <span style={{ fontSize: 10, color: '#16A34A' }}>✓</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>{c.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function Schedule() {
  const [weekIdx, setWeekIdx] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [activeStaff, setActiveStaff] = useState<string | null>(null);
  const [sched, setSched] = useState<ScheduleData>(BASE_SCHEDULE);
  const [edit, setEdit] = useState<EditState>({ open: false, day: '', timeSlot: '', shift: null });
  const [form, setForm] = useState<Partial<ShiftEntry>>({});
  const [showConf, setShowConf] = useState(false);

  const week = WEEKS[weekIdx];

  const filtered = useMemo(() =>
    STAFF.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  const filtSched = useMemo(() => {
    const o = {};
    for (const t of SLOTS) {
      o[t] = {};
      for (const d of DAYS) {
        let sh = sched[t]?.[d] ?? [];
        if (activeStaff) sh = sh.filter(s => s.staffId === activeStaff);
        o[t][d] = sh;
      }
    }
    return o;
  }, [sched, activeStaff]);

  const openEdit = (day: string, ts: string, shift: ShiftEntry) => { setEdit({ open: true, day, timeSlot: ts, shift }); setForm({ ...shift }); };
  const closeEdit = () => setEdit({ open: false, day: '', timeSlot: '', shift: null });
  const saveEdit = () => {
    const { day, timeSlot: ts, shift } = edit; if (!shift) return;
    setSched(p => ({ ...p, [ts]: { ...p[ts], [day]: p[ts][day].map(s => s.id === shift.id ? { ...s, ...form } as ShiftEntry : s) } }));
    closeEdit();
  };
  const delShift = () => {
    const { day, timeSlot: ts, shift } = edit; if (!shift) return;
    setSched(p => ({ ...p, [ts]: { ...p[ts], [day]: p[ts][day].filter(s => s.id !== shift.id) } }));
    closeEdit();
  };
  const exportCSV = () => {
    const rows = ['Staff,Role,Day,Start,End'];
    for (const t of SLOTS) for (const d of DAYS) for (const s of (sched[t]?.[d] ?? []))
      rows.push(`${s.name},${s.role},${d},${s.startTime},${s.endTime}`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = `schedule-${week.label.replace(/\s/g, '-')}.csv`;
    a.click();
  };
  const shiftCount = (id: string): number => SLOTS.reduce((a, t) => a + DAYS.reduce((b, d) => b + (sched[t]?.[d] ?? []).filter(s => s.staffId === id).length, 0), 0);
  const conflictCount = CONFLICTS.length;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(160deg, #F0F0FF 0%, #F8F0FF 50%, #FFF0FB 100%)',
      fontFamily: '"Nunito", "Outfit", system-ui, sans-serif',
    }}>

      {/* ── Slim Filter Panel ───────────────────────────────── */}
      <div style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(99,102,241,0.10)',
        boxShadow: '2px 0 16px rgba(99,102,241,0.05)',
        overflow: 'hidden',
      }}>

        {/* hide webkit scrollbar globally for this panel */}
        <style>{`
          .staff-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .staff-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
        `}</style>

        {/* ── Section label + search ── */}
        <div style={{ padding: '20px 14px 12px', flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#C0C2D8',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
          }}>
            Staff Filter
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F5F5FC', borderRadius: 11,
            padding: '9px 12px', border: '1.5px solid #EAEAF5',
          }}>
            <span style={{ color: '#B0B3D0', fontSize: 12, flexShrink: 0 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12, color: '#2D2D6E', width: '100%', fontFamily: 'inherit',
              }}
            />
            {search && (
              <span
                onClick={() => setSearch('')}
                style={{ cursor: 'pointer', color: '#B0B3D0', fontSize: 11, flexShrink: 0 }}
              >✕</span>
            )}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: '#C0C2D8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 14 }}>
            All Staff · {STAFF.length}
          </div>
        </div>

        {/* ── Staff list — scrollable, zero visible scrollbar ── */}
        <div
          className="staff-scroll"
          style={{
            flex: '1 1 0',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 12px 8px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(staff => {
              const active = activeStaff === staff.id;
              return (
                <div
                  key={staff.id}
                  onClick={() => setActiveStaff(active ? null : staff.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 10px', borderRadius: 13, cursor: 'pointer',
                    background: active ? `${staff.color}14` : 'transparent',
                    border: `1.5px solid ${active ? staff.color + '44' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <Avatar initials={staff.initials} color={staff.color} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#1A1A3E',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                    }}>
                      {staff.name}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: ROLE_STYLES[staff.role].dot, marginTop: 2 }}>
                      {staff.role}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: active ? staff.color : '#F0F0F8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: active ? '#fff' : '#A0A3C0' }}>
                      {shiftCount(staff.id)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom: conflicts + export — pinned, never cut off ── */}
        <div style={{
          flexShrink: 0,
          padding: '12px 14px 20px',
          borderTop: '1px solid rgba(99,102,241,0.08)',
          display: 'flex', flexDirection: 'column', gap: 10,
          background: 'rgba(255,255,255,0.95)',
        }}>
          {/* Conflicts card */}
          <div
            onClick={() => setShowConf(true)}
            style={{
              background: 'linear-gradient(135deg, #FFF5F8, #FCE7F3)',
              borderRadius: 14, padding: '12px 14px',
              border: '1.5px solid #FFC4D6', cursor: 'pointer',
              transition: 'all 0.14s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#E11D48' }}>
                {conflictCount} Conflicts
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9F1239', lineHeight: 1.5, marginBottom: 5 }}>
              All resolved this week.
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E11D48' }}>View details →</div>
          </div>

          {/* Export button */}
          <button
            onClick={exportCSV}
            style={{
              border: 'none', borderRadius: 12, padding: '11px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(99,102,241,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%',
            }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 20px',
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(99,102,241,0.08)', flexShrink: 0,
          gap: 12,
        }}>
          {/* Left: title */}
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#9CA3AF', fontWeight: 500 }}>ACOWIS: </span>Schedule
          </div>

          {/* Center: Week navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setWeekIdx(i => Math.max(0, i - 1))}
              disabled={weekIdx === 0}
              style={{
                border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 9,
                width: 30, height: 30, background: '#fff',
                cursor: weekIdx === 0 ? 'not-allowed' : 'pointer',
                opacity: weekIdx === 0 ? 0.35 : 1, fontSize: 16, color: '#6366F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >‹</button>
            <div style={{
              fontSize: 14, fontWeight: 800, color: '#1E1B4B',
              letterSpacing: '-0.02em', minWidth: 120, textAlign: 'center', whiteSpace: 'nowrap',
            }}>
              {week.label}
            </div>
            <button
              onClick={() => setWeekIdx(i => Math.min(WEEKS.length - 1, i + 1))}
              disabled={weekIdx === WEEKS.length - 1}
              style={{
                border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 9,
                width: 30, height: 30, background: '#fff',
                cursor: weekIdx === WEEKS.length - 1 ? 'not-allowed' : 'pointer',
                opacity: weekIdx === WEEKS.length - 1 ? 0.35 : 1, fontSize: 16, color: '#6366F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >›</button>
          </div>

          {/* Right: Legend + active filter chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
            {(['Doctor', 'Nurse'] as Role[]).map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ROLE_STYLES[r].dot, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{r}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#EF4444' }}>⚠</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Conflict</span>
            </div>
            {activeStaff && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#EEF2FF', border: '1.5px solid #C7D2FE',
                borderRadius: 20, padding: '3px 8px 3px 7px', flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1' }}>
                  {STAFF.find(s => s.id === activeStaff)?.name}
                </span>
                <span
                  onClick={() => setActiveStaff(null)}
                  style={{ fontSize: 10, color: '#6366F1', cursor: 'pointer', fontWeight: 700, marginLeft: 2 }}
                >✕</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Calendar Grid ────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(16px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: '0 4px 32px rgba(99,102,241,0.08)',
            overflow: 'hidden',
            minWidth: 700,
          }}>

            {/* Day header row */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(99,102,241,0.09)' }}>
              {/* Time column header */}
              <div style={{
                width: 90, flexShrink: 0, padding: '14px 12px',
                background: 'rgba(248,248,255,0.90)',
                borderRight: '1px solid rgba(99,102,241,0.07)',
              }} />
              {DAYS.map((day, idx) => {
                const isSun = day === 'Sun';
                return (
                  <div key={day} style={{
                    flex: 1, padding: '14px 8px', textAlign: 'center',
                    background: isSun ? 'rgba(244,63,94,0.04)' : 'rgba(248,248,255,0.65)',
                    borderLeft: '1px solid rgba(99,102,241,0.07)',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.09em', color: isSun ? '#F43F5E' : '#C0C4D8',
                      marginBottom: 3,
                    }}>{day}</div>
                    <div style={{
                      fontSize: 22, fontWeight: 800, lineHeight: 1.1,
                      color: isSun ? '#F43F5E' : '#1E1B4B',
                    }}>{week.dates[idx]}</div>
                  </div>
                );
              })}
            </div>

            {/* Time slot rows */}
            {SLOTS.map((slot, ri) => (
              <div key={slot} style={{
                display: 'flex',
                borderBottom: ri < SLOTS.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none',
                minHeight: 130,
              }}>
                {/* Time label */}
                <div style={{
                  width: 90, flexShrink: 0,
                  background: 'rgba(248,248,255,0.80)',
                  borderRight: '1px solid rgba(99,102,241,0.07)',
                  padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#6366F1',
                    background: '#EEF2FF', border: '1px solid #C7D2FE',
                    borderRadius: 8, padding: '4px 8px',
                    whiteSpace: 'nowrap', letterSpacing: '0.01em',
                  }}>
                    {slot}
                  </div>
                </div>

                {/* Day cells */}
                {DAYS.map(day => {
                  const shifts = filtSched[slot]?.[day] ?? [];
                  const isSun = day === 'Sun';
                  return (
                    <div key={`${slot}-${day}`} style={{
                      flex: 1,
                      padding: '10px 8px',
                      background: isSun ? 'rgba(244,63,94,0.02)' : 'transparent',
                      borderLeft: '1px solid rgba(99,102,241,0.05)',
                      display: 'flex', flexDirection: 'column', gap: 6,
                      minWidth: 0,
                    }}>
                      {shifts.map(sh => (
                        <ShiftCard key={sh.id} shift={sh} onClick={() => openEdit(day, slot, sh)} />
                      ))}
                      {shifts.length === 0 && (
                        <div style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0.4, paddingTop: 16,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(99,102,241,0.12)' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditModal
        edit={edit} form={form} setForm={setForm}
        onSave={saveEdit} onDelete={delShift} onClose={closeEdit}
      />
      <ConflictsModal
        open={showConf} onClose={() => setShowConf(false)} weekLabel={week.label}
      />
    </div>
  );
}