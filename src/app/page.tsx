'use client';
// If you created a project WITHOUT the "app" router and you only have pages/,
// put this code in pages/index.tsx and change the default export name to `Home`.
// (Pages Router doesn't need 'use client', but keeping it won't hurt.)

import { useEffect, useMemo, useState } from 'react';

// ---------- Types ----------
type Source = 'Canvas' | 'Gradescope' | 'Piazza' | 'Other';
type Assignment = {
  id: string;
  title: string;
  course: string;
  source: Source;
  dueISO: string;   // 'YYYY-MM-DDTHH:mm' (local)
  link?: string;
};

// ---------- Utilities ----------
const uid = () => Math.random().toString(36).slice(2);
const todayISO = () => new Date().toISOString().slice(0, 16);

function daysLeft(dueISO: string) {
  const now = new Date();
  const due = new Date(dueISO);
  const ms = due.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function loadLocal(): Assignment[] {
  try {
    const raw = localStorage.getItem('assignments_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Assignment[];
    // Ensure format matches <input type="datetime-local">
    return parsed.map(a => ({ ...a, dueISO: a.dueISO.slice(0, 16) }));
  } catch {
    return [];
  }
}
function saveLocal(items: Assignment[]) {
  localStorage.setItem('assignments_v1', JSON.stringify(items));
}

// ---------- Mock seed (first run only) ----------
const SEED: Assignment[] = [
  {
    id: uid(),
    title: 'HW1: Probability Review',
    course: 'CIS 519',
    source: 'Canvas',
    dueISO: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().slice(0, 16),
    link: 'https://canvas.example/hw1',
  },
  {
    id: uid(),
    title: 'PA0: Setup + Git',
    course: 'CIS 121',
    source: 'Gradescope',
    dueISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString().slice(0, 16),
    link: 'https://gradescope.example/pa0',
  },
  {
    id: uid(),
    title: 'Reading Quiz 1',
    course: 'ESE 5420',
    source: 'Canvas',
    dueISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1.5).toISOString().slice(0, 16),
  },
];

// ---------- Styles ----------
const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  background: 'white',
};
const pill: React.CSSProperties = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
};

// ---------- Component ----------
export default function Page() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState<Source | 'All'>('All');
  const [onlyNext7, setOnlyNext7] = useState(true);

  // form state
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [src, setSrc] = useState<Source>('Canvas');
  const [due, setDue] = useState(todayISO());
  const [link, setLink] = useState('');

  useEffect(() => {
    const existing = loadLocal();
    if (existing.length) {
      setAssignments(existing);
    } else {
      setAssignments(SEED);
      saveLocal(SEED);
    }
  }, []);

  useEffect(() => {
    saveLocal(assignments);
  }, [assignments]);

  const filtered = useMemo(() => {
    let rows = [...assignments];
    if (q.trim()) {
      const t = q.toLowerCase();
      rows = rows.filter(r =>
        [r.title, r.course, r.source, r.link ?? ''].some(v => v.toLowerCase().includes(t)),
      );
    }
    if (source !== 'All') rows = rows.filter(r => r.source === source);
    if (onlyNext7) {
      const cap = Date.now() + 1000 * 60 * 60 * 24 * 7;
      rows = rows.filter(r => new Date(r.dueISO).getTime() <= cap);
    }
    // sort by due date ascending
    rows.sort((a, b) => new Date(a.dueISO).getTime() - new Date(b.dueISO).getTime());
    return rows;
  }, [assignments, q, source, onlyNext7]);

  function addAssignment() {
    if (!title.trim() || !course.trim()) return;
    const item: Assignment = {
      id: uid(),
      title: title.trim(),
      course: course.trim(),
      source: src,
      dueISO: due,
      link: link.trim() || undefined,
    };
    setAssignments(prev => [...prev, item]);
    setShowAdd(false);
    setTitle('');
    setCourse('');
    setSrc('Canvas');
    setDue(todayISO());
    setLink('');
  }

  function remove(id: string) {
    setAssignments(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>OneLook: Unified Deadlines</h1>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>
              What’s due soon, across your portals — in one glance.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Add
          </button>
        </header>

        <section style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search title, course, link…"
              style={{
                flex: 1,
                minWidth: 220,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                outline: 'none',
              }}
            />
            <select
              value={source}
              onChange={e => setSource(e.target.value as any)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
            >
              <option>All</option>
              <option>Canvas</option>
              <option>Gradescope</option>
              <option>Piazza</option>
              <option>Other</option>
            </select>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={onlyNext7} onChange={e => setOnlyNext7(e.target.checked)} />
              Show next 7 days
            </label>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>
              No items here yet. Click “Add” to create one, or paste your next week’s tasks.
            </div>
          ) : (
            filtered.map(a => {
              const dleft = daysLeft(a.dueISO);
              const urgency =
                dleft <= 1 ? '#fee2e2' : dleft <= 3 ? '#fff7ed' : '#ecfeff';
              const border =
                dleft <= 1 ? '#ef4444' : dleft <= 3 ? '#f59e0b' : '#06b6d4';
              return (
                <div key={a.id} style={{ ...card, borderColor: border, background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 16 }}>{a.title}</strong>
                        <span style={pill}>{a.course}</span>
                        <span style={pill}>{a.source}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: urgency, padding: '2px 8px', borderRadius: 999 }}>
                          {dleft <= 0 ? 'Due today' : `${dleft} day${dleft === 1 ? '' : 's'} left`}
                        </span>
                        <span style={{ color: '#6b7280' }}>
                          Due: {new Date(a.dueISO).toLocaleString()}
                        </span>
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                            Open link
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(a.id)}
                      title="Remove"
                      style={{
                        height: 36,
                        alignSelf: 'flex-start',
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: '#fafafa',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Add form */}
        {showAdd && (
          <div
            onClick={() => setShowAdd(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.15)',
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ ...card, width: '100%', maxWidth: 520, background: 'white' }}
            >
              <h3 style={{ marginTop: 0 }}>Add Assignment</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  placeholder="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <input
                  placeholder="Course (e.g., CIS 519)"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <select
                  value={src}
                  onChange={e => setSrc(e.target.value as Source)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
                >
                  <option>Canvas</option>
                  <option>Gradescope</option>
                  <option>Piazza</option>
                  <option>Other</option>
                </select>
                <input
                  type="datetime-local"
                  value={due}
                  onChange={e => setDue(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <input
                  placeholder="Link (optional)"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fafafa' }}
                >
                  Cancel
                </button>
                <button
                  onClick={addAssignment}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #111827',
                    background: '#111827',
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <footer style={{ color: '#6b7280', textAlign: 'center', marginTop: 24 }}>
          <small>Prototype — local storage only. No external APIs.</small>
        </footer>
      </div>
    </div>
  );
}
