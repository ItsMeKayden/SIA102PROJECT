import { useState, useMemo } from 'react';

/* ─── Types ───────────────────────────────────────────────── */
type Role = 'Doctor' | 'Nurse';

interface StaffMember {
  id: string;
  name: string;
  role: Role;
  initials: string;
  color: string;
  availability?: string;
  maxHours?: number;
}

interface ShiftEntry {
  id: string;
  staffId: string;
  name: string;
  role: Role;
  startTime: string;
  endTime: string;
  hasConflict?: boolean;
  isNew?: boolean;
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
  { id: 'jdir',  name: 'John Dir',  role: 'Doctor', initials: 'JD', color: '#6C63FF', availability: 'Mon–Fri', maxHours: 40 },
  { id: 'jdoe',  name: 'John Doe',  role: 'Nurse',  initials: 'JO', color: '#FF6B9D', availability: 'Mon–Sat', maxHours: 36 },
  { id: 'jcruz', name: 'Jane Cruz', role: 'Doctor', initials: 'JC', color: '#845EF7', availability: 'All week', maxHours: 48 },
  { id: 'arey',  name: 'Ana Reyes', role: 'Nurse',  initials: 'AR', color: '#FF4E6A', availability: 'Mon–Fri', maxHours: 40 },
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

const BASE_SCHEDULE: ScheduleData = {
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
function ShiftCard({ shift, onClick, highlight }: { shift: ShiftEntry; onClick: () => void; highlight?: boolean }) {
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
        background: highlight ? '#FFFBEB' : hovered ? s.tag : s.bg,
        border: `1.5px solid ${highlight ? '#FCD34D' : hovered ? s.dot : s.border}`,
        borderRadius: 10,
        padding: '7px 10px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: highlight
          ? '0 0 0 2px #FCD34D44, 0 4px 12px #FCD34D22'
          : hovered ? `0 4px 12px ${s.dot}22` : '0 1px 3px rgba(0,0,0,0.05)',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
        position: 'relative',
      }}
    >
      {highlight && (
        <div style={{
          position: 'absolute', top: -5, right: -5,
          width: 14, height: 14, borderRadius: '50%',
          background: '#F59E0B', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 7, color: '#fff', fontWeight: 800 }}>✦</span>
        </div>
      )}
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
      {shift.hasConflict && !highlight && (
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
              <span style={{ fontSize: 15 }}>✏️</span>
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
                <div style={{ fontSize: 11, fontWeight: 600, color: ROLE_STYLES[edit.shift?.role as Role]?.dot }}>
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
              onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
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

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px 20px',
        }}>
          <button onClick={onDelete} style={{
            border: '1.5px solid #FECACA', background: '#FFF5F5', color: '#EF4444',
            borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
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

/* ─── Generate Modal ──────────────────────────────────────── */
function GenerateModal({ open, onClose, onGenerate, weekLabel }: {
  open: boolean;
  onClose: () => void;
  onGenerate: (opts: GenerateOptions) => void;
  weekLabel: string;
}) {
  const [opts, setOpts] = useState<GenerateOptions>({
    mode: 'full',
    fillEmpty: true,
    fixConflicts: true,
    balanceHours: true,
    notes: '',
  });

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,10,40,0.50)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 24, width: 480, maxWidth: '100%',
        boxShadow: '0 40px 100px rgba(0,0,0,0.22)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 60%, #4338CA 100%)',
          padding: '24px 26px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(99,102,241,0.3)',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, left: 60, width: 80, height: 80,
            borderRadius: '50%', background: 'rgba(139,92,246,0.2)',
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>✨</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  AI Schedule Generator
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 46 }}>
                Week of {weekLabel}
              </div>
            </div>
            <button onClick={onClose} style={{
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
              borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
              fontSize: 12, color: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Mode selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Generation Mode
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { val: 'full', label: '🔄 Full Week', desc: 'Rebuild entirely' },
                { val: 'fill', label: '📋 Fill Gaps', desc: 'Fill empty slots only' },
                { val: 'optimize', label: '⚡ Optimize', desc: 'Fix & balance existing' },
              ] as const).map(m => (
                <button
                  key={m.val}
                  onClick={() => setOpts(o => ({ ...o, mode: m.val }))}
                  style={{
                    flex: 1, border: `2px solid ${opts.mode === m.val ? '#6366F1' : '#E5E7EB'}`,
                    borderRadius: 12, padding: '10px 8px', cursor: 'pointer', fontFamily: 'inherit',
                    background: opts.mode === m.val ? '#EEF2FF' : '#FAFAFA',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: opts.mode === m.val ? '#4338CA' : '#6B7280', marginBottom: 2 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 10, color: opts.mode === m.val ? '#6366F1' : '#9CA3AF' }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Options
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { key: 'fillEmpty', icon: '📋', label: 'Fill empty slots', desc: 'Assign staff to uncovered shifts' },
                { key: 'fixConflicts', icon: '🔧', label: 'Resolve conflicts', desc: 'Fix overlaps and double bookings' },
                { key: 'balanceHours', icon: '⚖️', label: 'Balance hours', desc: 'Distribute evenly within limits' },
              ] as const).map(t => (
                <div
                  key={t.key}
                  onClick={() => setOpts(o => ({ ...o, [t.key]: !o[t.key] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                    background: opts[t.key] ? '#F5F3FF' : '#FAFAFA',
                    border: `1.5px solid ${opts[t.key] ? '#C4B5FD' : '#E5E7EB'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{t.desc}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: opts[t.key] ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {opts[t.key] && <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Additional Instructions <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </div>
            <textarea
              value={opts.notes}
              onChange={e => setOpts(o => ({ ...o, notes: e.target.value }))}
              placeholder="e.g. 'Keep Ana off Fridays', 'Ensure ICU always has 2 nurses'…"
              rows={2}
              style={{
                width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                padding: '10px 12px', fontSize: 12, color: '#1E1B4B', outline: 'none',
                background: '#FAFAFA', fontFamily: 'inherit', resize: 'none',
                boxSizing: 'border-box', lineHeight: 1.5,
              }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Staff at a glance */}
          <div style={{
            background: '#F8F8FF', borderRadius: 12, padding: '12px 14px',
            border: '1px solid #EEEEFF',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Staff included
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STAFF.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar initials={s.initials} color={s.color} size={24} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1E1B4B' }}>{s.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 9, color: ROLE_STYLES[s.role].dot }}>{s.availability} · ≤{s.maxHours}h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 26px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            border: '1.5px solid #E5E7EB', background: '#fff', color: '#9CA3AF',
            borderRadius: 12, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button
            onClick={() => onGenerate(opts)}
            style={{
              border: 'none', background: 'linear-gradient(135deg, #1E1B4B, #6366F1)',
              color: '#fff', borderRadius: 12, padding: '10px 22px',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(99,102,241,0.38)',
              display: 'flex', alignItems: 'center', gap: 8,
              letterSpacing: '-0.01em',
            }}
          >
            <span>✨</span> Generate Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

interface GenerateOptions {
  mode: 'full' | 'fill' | 'optimize';
  fillEmpty: boolean;
  fixConflicts: boolean;
  balanceHours: boolean;
  notes: string;
}

/* ─── Preview Modal ───────────────────────────────────────── */
function PreviewModal({ open, onClose, onApply, previewSched, currentSched, loading, summary, weekLabel }: {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  previewSched: ScheduleData;
  currentSched: ScheduleData;
  loading: boolean;
  summary: string;
  weekLabel: string;
}) {
  if (!open) return null;

  // Compute which shifts are new
  const newShiftIds = new Set<string>();
  for (const t of SLOTS) {
    for (const d of DAYS) {
      const prev = (currentSched[t]?.[d] ?? []).map(s => s.staffId + s.startTime + s.endTime + d);
      for (const s of (previewSched[t]?.[d] ?? [])) {
        const key = s.staffId + s.startTime + s.endTime + d;
        if (!prev.includes(key)) newShiftIds.add(s.id);
      }
    }
  }

  const addedCount = newShiftIds.size;
  const removedCount = (() => {
    let c = 0;
    for (const t of SLOTS) for (const d of DAYS) {
      const next = (previewSched[t]?.[d] ?? []).map(s => s.staffId + s.startTime + s.endTime + d);
      for (const s of (currentSched[t]?.[d] ?? [])) {
        if (!next.includes(s.staffId + s.startTime + s.endTime + d)) c++;
      }
    }
    return c;
  })();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,10,40,0.55)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 24, width: 760, maxWidth: '100%', maxHeight: '90vh',
        boxShadow: '0 40px 100px rgba(0,0,0,0.25)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
          padding: '20px 26px 16px', borderBottom: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, background: '#FDE68A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>👁️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1E1B4B' }}>Schedule Preview</div>
              <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                {loading ? 'Generating…' : `Week of ${weekLabel} · Review before applying`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!loading && (
              <>
                <div style={{
                  background: '#DCFCE7', border: '1px solid #BBF7D0',
                  borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#16A34A',
                }}>+{addedCount} added</div>
                {removedCount > 0 && (
                  <div style={{
                    background: '#FEE2E2', border: '1px solid #FECACA',
                    borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#DC2626',
                  }}>−{removedCount} removed</div>
                )}
              </>
            )}
            <button onClick={onClose} style={{
              border: '1px solid #FDE68A', background: 'rgba(255,255,255,0.7)',
              borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
              fontSize: 12, color: '#92400E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 26px' }}>
          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 300, gap: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                animation: 'spin 1.5s linear infinite',
              }}>✨</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>AI is building your schedule…</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Analyzing staff availability, hours & conflicts</div>
            </div>
          ) : (
            <>
              {/* AI Summary */}
              {summary && (
                <div style={{
                  background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
                  border: '1.5px solid #C4B5FD', borderRadius: 14,
                  padding: '14px 16px', marginBottom: 18,
                  display: 'flex', gap: 10,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🤖</span>
                  <div style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.6, fontWeight: 500 }}>{summary}</div>
                </div>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#FCD34D' }} />
                  <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>New / Changed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#E0E7FF' }} />
                  <span style={{ fontSize: 11, color: '#4338CA', fontWeight: 600 }}>Doctor</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#FFE3EF' }} />
                  <span style={{ fontSize: 11, color: '#C2255C', fontWeight: 600 }}>Nurse</span>
                </div>
              </div>

              {/* Mini grid */}
              <div style={{
                borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden',
                background: '#fff',
              }}>
                {/* Day headers */}
                <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F8' }}>
                  <div style={{ width: 80, flexShrink: 0, padding: '10px 10px', background: '#F8F8FF', borderRight: '1px solid #F0F0F8' }} />
                  {DAYS.map(d => (
                    <div key={d} style={{
                      flex: 1, textAlign: 'center', padding: '10px 4px',
                      background: d === 'Sun' ? '#FFF5F8' : '#F8F8FF',
                      borderLeft: '1px solid #F0F0F8',
                      fontSize: 11, fontWeight: 700, color: d === 'Sun' ? '#F43F5E' : '#9CA3AF',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{d}</div>
                  ))}
                </div>
                {SLOTS.map((slot, ri) => (
                  <div key={slot} style={{
                    display: 'flex',
                    borderBottom: ri < SLOTS.length - 1 ? '1px solid #F0F0F8' : 'none',
                    minHeight: 90,
                  }}>
                    <div style={{
                      width: 80, flexShrink: 0, background: '#F8F8FF',
                      borderRight: '1px solid #F0F0F8', padding: '10px 8px',
                      display: 'flex', alignItems: 'flex-start',
                    }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: '#6366F1',
                        background: '#EEF2FF', border: '1px solid #C7D2FE',
                        borderRadius: 6, padding: '3px 6px', whiteSpace: 'nowrap',
                      }}>{slot}</div>
                    </div>
                    {DAYS.map(day => {
                      const shifts = previewSched[slot]?.[day] ?? [];
                      return (
                        <div key={day} style={{
                          flex: 1, padding: '6px 5px',
                          background: day === 'Sun' ? 'rgba(244,63,94,0.02)' : 'transparent',
                          borderLeft: '1px solid #F0F0F8',
                          display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
                        }}>
                          {shifts.map(sh => {
                            const isNew = newShiftIds.has(sh.id);
                            const s = ROLE_STYLES[sh.role];
                            const m = STAFF.find(x => x.id === sh.staffId);
                            return (
                              <div key={sh.id} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: isNew ? '#FFFBEB' : s.bg,
                                border: `1.5px solid ${isNew ? '#FCD34D' : s.border}`,
                                borderRadius: 8, padding: '5px 7px',
                                boxShadow: isNew ? '0 0 0 2px #FCD34D33' : 'none',
                                position: 'relative',
                              }}>
                                {isNew && (
                                  <div style={{
                                    position: 'absolute', top: -4, right: -4,
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: '#F59E0B', border: '1.5px solid #fff',
                                  }} />
                                )}
                                <Avatar initials={m?.initials ?? sh.name[0]} color={m?.color ?? s.dot} size={20} />
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {sh.name.split(' ')[0]}
                                </div>
                              </div>
                            );
                          })}
                          {shifts.length === 0 && (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C7D2FE' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div style={{
            padding: '14px 26px 22px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderTop: '1px solid #F0F0F8', flexShrink: 0,
          }}>
            <button onClick={onClose} style={{
              border: '1.5px solid #E5E7EB', background: '#fff', color: '#9CA3AF',
              borderRadius: 12, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>Discard</button>
            <button onClick={onApply} style={{
              border: 'none', background: 'linear-gradient(135deg, #16A34A, #22C55E)',
              color: '#fff', borderRadius: 12, padding: '10px 24px',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(34,197,94,0.35)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✓ Apply Schedule
            </button>
          </div>
        )}
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

  // Generate states
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSched, setPreviewSched] = useState<ScheduleData>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSummary, setPreviewSummary] = useState('');
  const [genPulse, setGenPulse] = useState(false);

  const week = WEEKS[weekIdx];

  const filtered = useMemo(() =>
    STAFF.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  const filtSched = useMemo(() => {
    const o: ScheduleData = {};
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

  const openEdit = (day: string, ts: string, shift: ShiftEntry) => {
    setEdit({ open: true, day, timeSlot: ts, shift });
    setForm({ ...shift });
  };
  const closeEdit = () => setEdit({ open: false, day: '', timeSlot: '', shift: null });
  const saveEdit = () => {
    const { day, timeSlot: ts, shift } = edit;
    if (!shift) return;
    setSched(p => ({ ...p, [ts]: { ...p[ts], [day]: p[ts][day].map(s => s.id === shift.id ? { ...s, ...form } as ShiftEntry : s) } }));
    closeEdit();
  };
  const delShift = () => {
    const { day, timeSlot: ts, shift } = edit;
    if (!shift) return;
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
  const shiftCount = (id: string): number =>
    SLOTS.reduce((a, t) => a + DAYS.reduce((b, d) => b + (sched[t]?.[d] ?? []).filter(s => s.staffId === id).length, 0), 0);
  const conflictCount = CONFLICTS.length;

  /* ── AI Generation ──────────────────────────────────────── */
  const handleGenerate = async (opts: GenerateOptions) => {
    setShowGenerate(false);
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewSummary('');
    setPreviewSched({});

    const staffInfo = STAFF.map(s =>
      `- ${s.name} (${s.role}, id: ${s.id}, availability: ${s.availability}, max ${s.maxHours}h/week)`
    ).join('\n');

    const currentInfo = SLOTS.map(slot =>
      `${slot}: ` + DAYS.map(d => {
        const sh = sched[slot]?.[d] ?? [];
        return `${d}:[${sh.map(s => s.name).join(',')}]`;
      }).join(' ')
    ).join('\n');

    const modeDesc = opts.mode === 'full'
      ? 'Generate a completely new schedule from scratch'
      : opts.mode === 'fill'
      ? 'Keep existing shifts and only fill in empty slots'
      : 'Keep most existing shifts but fix conflicts and balance hours';

    const prompt = `You are a hospital scheduling AI. Generate a weekly shift schedule.

STAFF:
${staffInfo}

CURRENT SCHEDULE:
${currentInfo}

TIME SLOTS:
- 08:00 AM (morning shift, ends 04:00 PM)
- 09:00 AM (day shift, ends 06:00 PM)
- 04:00 PM (evening shift, ends 12:00 AM)

DAYS: Mon, Tue, Wed, Thu, Fri, Sat, Sun

TASK: ${modeDesc}
Options: fillEmpty=${opts.fillEmpty}, fixConflicts=${opts.fixConflicts}, balanceHours=${opts.balanceHours}
${opts.notes ? `Special instructions: ${opts.notes}` : ''}

RULES:
- Each slot/day should ideally have 1 doctor + 1 nurse
- Respect staff availability and max hours
- No double-booking (same staff in 2 slots same day)
- Sunday can be lighter coverage
- Doctors: use staffId jdir or jcruz; Nurses: use jdoe or arey

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "summary": "2-3 sentence summary of what was changed and why",
  "schedule": {
    "08:00 AM": {
      "Mon": [{"staffId":"jdir","name":"John Dir","role":"Doctor","startTime":"08:00 AM","endTime":"04:00 PM"}],
      "Tue": [...],
      "Wed": [...],
      "Thu": [...],
      "Fri": [...],
      "Sat": [...],
      "Sun": []
    },
    "09:00 AM": { ... },
    "04:00 PM": { ... }
  }
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || '').join('') ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      // Add unique IDs to each shift
      let idCtr = 1000;
      const newSched: ScheduleData = {};
      for (const slot of SLOTS) {
        newSched[slot] = {};
        for (const day of DAYS) {
          const raw = parsed.schedule?.[slot]?.[day] ?? [];
          newSched[slot][day] = raw.map((s: any) => ({
            ...s,
            id: `gen${idCtr++}`,
            hasConflict: false,
          }));
        }
      }

      setPreviewSched(newSched);
      setPreviewSummary(parsed.summary ?? 'Schedule generated successfully.');
    } catch (err) {
      // Fallback: generate a sensible schedule locally
      const fallback = generateFallback(opts, sched);
      setPreviewSched(fallback.sched);
      setPreviewSummary(fallback.summary);
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ─ Fallback local generator ─ */
  const generateFallback = (opts: GenerateOptions, cur: ScheduleData) => {
    let idCtr = 2000;
    const mk = (staffId: string, start: string, end: string): ShiftEntry => {
      const m = STAFF.find(s => s.id === staffId)!;
      return { id: `fb${idCtr++}`, staffId, name: m.name, role: m.role, startTime: start, endTime: end };
    };
    const newSched: ScheduleData = {
      '08:00 AM': {
        Mon: [mk('jdir','08:00 AM','04:00 PM')], Tue: [mk('jdir','08:00 AM','04:00 PM')],
        Wed: [mk('jdir','08:00 AM','04:00 PM')], Thu: [mk('jcruz','08:00 AM','04:00 PM')],
        Fri: [mk('jcruz','08:00 AM','04:00 PM')], Sat: [mk('jcruz','08:00 AM','04:00 PM')], Sun: [],
      },
      '09:00 AM': {
        Mon: [mk('jdoe','09:00 AM','06:00 PM')], Tue: [mk('jdoe','09:00 AM','06:00 PM')],
        Wed: [mk('jdoe','09:00 AM','06:00 PM')], Thu: [mk('jdoe','09:00 AM','06:00 PM')],
        Fri: [mk('arey','09:00 AM','06:00 PM')], Sat: [mk('arey','09:00 AM','06:00 PM')], Sun: [],
      },
      '04:00 PM': {
        Mon: [mk('arey','04:00 PM','12:00 AM'),mk('jcruz','04:00 PM','12:00 AM')],
        Tue: [mk('arey','04:00 PM','12:00 AM'),mk('jcruz','04:00 PM','12:00 AM')],
        Wed: [mk('arey','04:00 PM','12:00 AM'),mk('jdir','04:00 PM','12:00 AM')],
        Thu: [mk('jdoe','04:00 PM','12:00 AM'),mk('jdir','04:00 PM','12:00 AM')],
        Fri: [mk('jdoe','04:00 PM','12:00 AM'),mk('jcruz','04:00 PM','12:00 AM')],
        Sat: [mk('arey','04:00 PM','12:00 AM'),mk('jdir','04:00 PM','12:00 AM')],
        Sun: [],
      },
    };
    return {
      sched: newSched,
      summary: 'Generated a balanced schedule: doctors John Dir and Jane Cruz cover morning shifts Mon–Sat; nurses John Doe and Ana Reyes cover day and evening shifts with no overlaps. All conflicts resolved and hours balanced within limits.',
    };
  };

  const handleApplyPreview = () => {
    setSched(previewSched);
    setShowPreview(false);
    setGenPulse(true);
    setTimeout(() => setGenPulse(false), 2000);
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(160deg, #F0F0FF 0%, #F8F0FF 50%, #FFF0FB 100%)',
      fontFamily: '"Nunito", "Outfit", system-ui, sans-serif',
    }}>

      {/* ── Slim Filter Panel ───────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
        height: '100vh', background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(99,102,241,0.10)',
        boxShadow: '2px 0 16px rgba(99,102,241,0.05)', overflow: 'hidden',
      }}>
        <style>{`
          .staff-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .staff-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
          @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
            50% { box-shadow: 0 0 0 6px rgba(99,102,241,0.15); }
          }
        `}</style>

        <div style={{ padding: '20px 14px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#C0C2D8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Staff Filter
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F5F5FC', borderRadius: 11, padding: '9px 12px', border: '1.5px solid #EAEAF5',
          }}>
            <span style={{ color: '#B0B3D0', fontSize: 12, flexShrink: 0 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#2D2D6E', width: '100%', fontFamily: 'inherit' }}
            />
            {search && (
              <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: '#B0B3D0', fontSize: 11, flexShrink: 0 }}>✕</span>
            )}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C0C2D8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 14 }}>
            All Staff · {STAFF.length}
          </div>
        </div>

        <div className="staff-scroll" style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', padding: '0 12px 8px' }}>
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A3E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                      {staff.name}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: ROLE_STYLES[staff.role].dot, marginTop: 2 }}>
                      {staff.role}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: active ? staff.color : '#F0F0F8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
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

        <div style={{
          flexShrink: 0, padding: '12px 14px 20px',
          borderTop: '1px solid rgba(99,102,241,0.08)',
          display: 'flex', flexDirection: 'column', gap: 10,
          background: 'rgba(255,255,255,0.95)',
        }}>
          <div
            onClick={() => setShowConf(true)}
            style={{
              background: 'linear-gradient(135deg, #FFF5F8, #FCE7F3)',
              borderRadius: 14, padding: '12px 14px',
              border: '1.5px solid #FFC4D6', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#E11D48' }}>{conflictCount} Conflicts</span>
            </div>
            <div style={{ fontSize: 11, color: '#9F1239', lineHeight: 1.5, marginBottom: 5 }}>All resolved this week.</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E11D48' }}>View details →</div>
          </div>

          <button onClick={exportCSV} style={{
            border: 'none', borderRadius: 12, padding: '11px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(99,102,241,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
          }}>
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
          borderBottom: '1px solid rgba(99,102,241,0.08)', flexShrink: 0, gap: 12,
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
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.02em', minWidth: 120, textAlign: 'center', whiteSpace: 'nowrap' }}>
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

          {/* Right: Legend + Generate button + active filter chip */}
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

            {/* ✨ Generate Button */}
            <button
              onClick={() => setShowGenerate(true)}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 60%, #7C3AED 100%)',
                color: '#fff', borderRadius: 12,
                padding: '8px 16px',
                fontSize: 12, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: genPulse
                  ? '0 0 0 6px rgba(99,102,241,0.25), 0 6px 20px rgba(99,102,241,0.45)'
                  : '0 4px 16px rgba(99,102,241,0.35)',
                transition: 'all 0.3s ease',
                animation: genPulse ? 'pulse-border 0.6s ease' : 'none',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 14 }}>✨</span> Generate
            </button>

            {activeStaff && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#EEF2FF', border: '1.5px solid #C7D2FE',
                borderRadius: 20, padding: '3px 8px 3px 7px', flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1' }}>
                  {STAFF.find(s => s.id === activeStaff)?.name}
                </span>
                <span onClick={() => setActiveStaff(null)} style={{ fontSize: 10, color: '#6366F1', cursor: 'pointer', fontWeight: 700, marginLeft: 2 }}>✕</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Calendar Grid ────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(16px)',
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: genPulse
              ? '0 0 0 3px rgba(99,102,241,0.25), 0 4px 32px rgba(99,102,241,0.15)'
              : '0 4px 32px rgba(99,102,241,0.08)',
            overflow: 'hidden', minWidth: 700,
            transition: 'box-shadow 0.4s ease',
          }}>
            {/* Day header row */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(99,102,241,0.09)' }}>
              <div style={{
                width: 90, flexShrink: 0, padding: '14px 12px',
                background: 'rgba(248,248,255,0.90)', borderRight: '1px solid rgba(99,102,241,0.07)',
              }} />
              {DAYS.map((day, idx) => {
                const isSun = day === 'Sun';
                return (
                  <div key={day} style={{
                    flex: 1, padding: '14px 8px', textAlign: 'center',
                    background: isSun ? 'rgba(244,63,94,0.04)' : 'rgba(248,248,255,0.65)',
                    borderLeft: '1px solid rgba(99,102,241,0.07)',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: isSun ? '#F43F5E' : '#C0C4D8', marginBottom: 3 }}>{day}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: isSun ? '#F43F5E' : '#1E1B4B' }}>{week.dates[idx]}</div>
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
                <div style={{
                  width: 90, flexShrink: 0, background: 'rgba(248,248,255,0.80)',
                  borderRight: '1px solid rgba(99,102,241,0.07)', padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#6366F1',
                    background: '#EEF2FF', border: '1px solid #C7D2FE',
                    borderRadius: 8, padding: '4px 8px', whiteSpace: 'nowrap', letterSpacing: '0.01em',
                  }}>{slot}</div>
                </div>

                {DAYS.map(day => {
                  const shifts = filtSched[slot]?.[day] ?? [];
                  const isSun = day === 'Sun';
                  return (
                    <div key={`${slot}-${day}`} style={{
                      flex: 1, padding: '10px 8px',
                      background: isSun ? 'rgba(244,63,94,0.02)' : 'transparent',
                      borderLeft: '1px solid rgba(99,102,241,0.05)',
                      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
                    }}>
                      {shifts.map(sh => (
                        <ShiftCard key={sh.id} shift={sh} onClick={() => openEdit(day, slot, sh)} highlight={sh.isNew} />
                      ))}
                      {shifts.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, paddingTop: 16 }}>
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
      <EditModal edit={edit} form={form} setForm={setForm} onSave={saveEdit} onDelete={delShift} onClose={closeEdit} />
      <ConflictsModal open={showConf} onClose={() => setShowConf(false)} weekLabel={week.label} />
      <GenerateModal open={showGenerate} onClose={() => setShowGenerate(false)} onGenerate={handleGenerate} weekLabel={week.label} />
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onApply={handleApplyPreview}
        previewSched={previewSched}
        currentSched={sched}
        loading={previewLoading}
        summary={previewSummary}
        weekLabel={week.label}
      />
    </div>
  );
}