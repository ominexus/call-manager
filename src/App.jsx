import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// ── ISO Week 계산 ────────────────────────────────────────────────────────
const getISOWeek = (d = new Date()) => {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const y1 = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const wn = Math.ceil((((utc - y1) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(wn).padStart(2, "0")}`;
};
const THIS_WEEK = getISOWeek();

// ── Supabase REST 클라이언트 ─────────────────────────────────────────────
const h = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const db = async (method, path, body) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  if (!r.ok) {
    let msg = txt;
    try { msg = JSON.parse(txt).message || txt; } catch {}
    throw new Error(msg);
  }
  return txt ? JSON.parse(txt) : [];
};

// ── 공통 스타일 ──────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "9px 13px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, boxSizing: "border-box",
  outline: "none", fontFamily: "inherit",
};
const btnStyle = (v = "primary") => ({
  padding: "8px 18px", border: "none", borderRadius: 8,
  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  background: v === "primary" ? "#0284c7" : v === "danger" ? "#ef4444" : v === "success" ? "#16a34a" : "#f1f5f9",
  color: v === "ghost" ? "#64748b" : "#fff",
  whiteSpace: "nowrap",
});

// ── 공통 컴포넌트 ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, fontFamily: "inherit",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 32,
        width: "90%", maxWidth: 500, maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Badge({ answered }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      background: answered ? "#dcfce7" : "#fee2e2",
      color: answered ? "#16a34a" : "#dc2626",
    }}>
      {answered ? "✓ 수신" : "✗ 미수신"}
    </span>
  );
}

function EmptyRow({ cols, text = "등록된 데이터가 없습니다." }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
        {text}
      </td>
    </tr>
  );
}

// ── 대시보드 ──────────────────────────────────────────────────────────────
function Dashboard({ data, week }) {
  const { callers, receivers, maps, logs } = data;
  const weekLogs = logs.filter(l => l.called_date && getISOWeek(new Date(l.called_date)) === week);
  const answered = weekLogs.filter(l => l.is_answered).length;
  const total = maps.length;
  const done = weekLogs.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const StatCard = ({ icon, label, value, color }) => (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flex: 1, minWidth: 0,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{label}</div>
    </div>
  );

  const thStyle = { textAlign: "left", padding: "10px 16px", color: "#64748b", fontWeight: 600, fontSize: 13 };
  const tdStyle = { padding: "12px 16px", fontSize: 14 };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>대시보드</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard icon="👤" label="전화하는 사람" value={callers.length} color="#0284c7" />
        <StatCard icon="📋" label="전화받는 사람" value={receivers.length} color="#7c3aed" />
        <StatCard icon="🔗" label="이번주 배정" value={total} color="#ea580c" />
        <StatCard icon="📞" label="이번주 통화완료" value={`${done}/${total}`} color="#16a34a" />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>이번주 진행률 ({week})</span>
          <span style={{ fontWeight: 700, color: "#0284c7" }}>{pct}%</span>
        </div>
        <div style={{ background: "#e2e8f0", borderRadius: 99, height: 10 }}>
          <div style={{ background: "#0284c7", borderRadius: 99, height: 10, width: `${pct}%`, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 13, color: "#64748b" }}>
          <span>✓ 수신: <strong>{answered}건</strong></span>
          <span>✗ 미수신: <strong>{done - answered}건</strong></span>
          <span>🔲 미완료: <strong>{total - done}건</strong></span>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#374151", fontSize: 15 }}>
          최근 통화 기록
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["날짜", "전화한 사람", "받은 사람", "학년/반", "수신", "내용"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekLogs.length === 0
                ? <EmptyRow cols={6} text="이번 주 통화 기록이 없습니다." />
                : weekLogs.slice(0, 10).map(l => (
                  <tr key={l.id} style={{ borderTop: "1px solid #f8fafc" }}>
                    <td style={tdStyle}>{l.called_date}</td>
                    <td style={tdStyle}>{l.callers?.name || "-"}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{l.receivers?.name || "-"}</td>
                    <td style={{ ...tdStyle, color: "#64748b" }}>
                      {l.receivers ? `${l.receivers.grade}학년 ${l.receivers.class}반` : "-"}
                    </td>
                    <td style={tdStyle}><Badge answered={l.is_answered} /></td>
                    <td style={{ ...tdStyle, color: "#64748b", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.content || "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 전화하는 사람 ──────────────────────────────────────────────────────────
function CallersPage({ callers, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ grade: "", name: "" });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ grade: "", name: "" }); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ grade: String(c.grade), name: c.name }); setModal(true); };

  const save = async () => {
    if (!form.grade || !form.name.trim()) return alert("학년과 이름을 입력하세요.");
    setSaving(true);
    try {
      const payload = { grade: Number(form.grade), name: form.name.trim() };
      if (editing) await db("PATCH", `callers?id=eq.${editing.id}`, payload);
      else await db("POST", "callers", payload);
      setModal(false);
      onRefresh();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try { await db("DELETE", `callers?id=eq.${id}`); onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const thStyle = { textAlign: "left", padding: "12px 20px", color: "#64748b", fontWeight: 600, fontSize: 13 };
  const tdStyle = { padding: "14px 20px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>전화하는 사람</h2>
        <button onClick={openAdd} style={btnStyle("primary")}>+ 추가</button>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={thStyle}>학년</th>
              <th style={thStyle}>이름</th>
              <th style={{ ...thStyle, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {callers.length === 0
              ? <EmptyRow cols={3} />
              : callers.map(c => (
                <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>{c.grade}학년</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => openEdit(c)} style={{ ...btnStyle("ghost"), marginRight: 8 }}>수정</button>
                    <button onClick={() => del(c.id)} style={btnStyle("danger")}>삭제</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? "수정" : "전화하는 사람 추가"} onClose={() => setModal(false)}>
          <Field label="학년 *">
            <input style={inputStyle} type="number" min="1" value={form.grade}
              onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="1" />
          </Field>
          <Field label="이름 *">
            <input style={inputStyle} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setModal(false)} style={btnStyle("ghost")}>취소</button>
            <button onClick={save} disabled={saving} style={btnStyle("primary")}>{saving ? "저장 중..." : "저장"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 전화받는 사람 ──────────────────────────────────────────────────────────
function ReceiversPage({ receivers, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ grade: "", class: "", name: "", phone: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [filterGrade, setFilterGrade] = useState("");

  const openAdd = () => { setEditing(null); setForm({ grade: "", class: "", name: "", phone: "", note: "" }); setModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ grade: String(r.grade), class: String(r.class), name: r.name, phone: r.phone, note: r.note || "" });
    setModal(true);
  };

  const save = async () => {
    if (!form.grade || !form.class || !form.name.trim() || !form.phone.trim())
      return alert("학년, 반, 이름, 전화번호는 필수입니다.");
    setSaving(true);
    try {
      const payload = { grade: Number(form.grade), class: Number(form.class), name: form.name.trim(), phone: form.phone.trim(), note: form.note || null };
      if (editing) await db("PATCH", `receivers?id=eq.${editing.id}`, payload);
      else await db("POST", "receivers", payload);
      setModal(false);
      onRefresh();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try { await db("DELETE", `receivers?id=eq.${id}`); onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const grades = [...new Set(receivers.map(r => r.grade))].sort((a, b) => a - b);
  const filtered = filterGrade ? receivers.filter(r => r.grade === Number(filterGrade)) : receivers;

  const thStyle = { textAlign: "left", padding: "12px 20px", color: "#64748b", fontWeight: 600, fontSize: 13 };
  const tdStyle = { padding: "13px 20px", fontSize: 14 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>전화받는 사람</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            style={{ ...inputStyle, width: "auto", padding: "8px 12px" }}>
            <option value="">전체 학년</option>
            {grades.map(g => <option key={g} value={g}>{g}학년</option>)}
          </select>
          <button onClick={openAdd} style={btnStyle("primary")}>+ 추가</button>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["학년", "반", "이름", "전화번호", "특이사항", ""].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i === 5 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <EmptyRow cols={6} />
                : filtered.map(r => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{r.grade}학년</td>
                    <td style={tdStyle}>{r.class}반</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                    <td style={tdStyle}>{r.phone}</td>
                    <td style={{ ...tdStyle, color: r.note ? "#ef4444" : "#94a3b8", maxWidth: 200 }}>{r.note || "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button onClick={() => openEdit(r)} style={{ ...btnStyle("ghost"), marginRight: 8 }}>수정</button>
                      <button onClick={() => del(r.id)} style={btnStyle("danger")}>삭제</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title={editing ? "수정" : "전화받는 사람 추가"} onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="학년 *">
              <input style={inputStyle} type="number" min="1" value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="1" />
            </Field>
            <Field label="반 *">
              <input style={inputStyle} type="number" min="1" value={form.class}
                onChange={e => setForm({ ...form, class: e.target.value })} placeholder="3" />
            </Field>
          </div>
          <Field label="이름 *">
            <input style={inputStyle} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
          </Field>
          <Field label="전화번호 *">
            <input style={inputStyle} value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="010-1234-5678" />
          </Field>
          <Field label="특이사항">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} placeholder="선택 입력" />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setModal(false)} style={btnStyle("ghost")}>취소</button>
            <button onClick={save} disabled={saving} style={btnStyle("primary")}>{saving ? "저장 중..." : "저장"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 주간 배정 ──────────────────────────────────────────────────────────────
function MapsPage({ data, week, onRefresh }) {
  const { callers, receivers, maps } = data;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ caller_id: "", receiver_id: "" });
  const [saving, setSaving] = useState(false);
  const [filterCaller, setFilterCaller] = useState("");

  const save = async () => {
    if (!form.caller_id || !form.receiver_id) return alert("담당자와 대상자를 모두 선택하세요.");
    setSaving(true);
    try {
      await db("POST", "caller_receiver_map", { ...form, week_label: week });
      setModal(false);
      setForm({ caller_id: "", receiver_id: "" });
      onRefresh();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("배정을 삭제하시겠습니까?")) return;
    try { await db("DELETE", `caller_receiver_map?id=eq.${id}`); onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const filtered = filterCaller ? maps.filter(m => m.caller_id === filterCaller) : maps;
  const groups = {};
  filtered.forEach(m => {
    const key = m.caller_id;
    if (!groups[key]) groups[key] = { caller: m.callers, items: [] };
    groups[key].items.push(m);
  });

  const tdStyle = { padding: "12px 20px", fontSize: 14 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>주간 배정</h2>
          <span style={{ fontSize: 13, color: "#64748b" }}>현재 주: {week}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filterCaller} onChange={e => setFilterCaller(e.target.value)}
            style={{ ...inputStyle, width: "auto", padding: "8px 12px" }}>
            <option value="">전체 담당자</option>
            {callers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setModal(true)} style={btnStyle("primary")}>+ 배정 추가</button>
        </div>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#94a3b8", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", fontSize: 14 }}>
          이번 주 배정 내역이 없습니다.
        </div>
      ) : Object.entries(groups).map(([, group]) => (
        <div key={group.caller?.id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "#f0f9ff", borderBottom: "1px solid #bae6fd", fontWeight: 700, color: "#0369a1", fontSize: 15 }}>
            👤 {group.caller?.grade}학년 {group.caller?.name}
            <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8, color: "#0284c7" }}>({group.items.length}명 배정)</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {group.items.map(m => (
                <tr key={m.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>{m.receivers?.grade}학년 {m.receivers?.class}반</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{m.receivers?.name}</td>
                  <td style={tdStyle}>{m.receivers?.phone}</td>
                  <td style={{ ...tdStyle, color: m.receivers?.note ? "#ef4444" : "#94a3b8", fontSize: 13 }}>{m.receivers?.note || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => del(m.id)} style={btnStyle("danger")}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {modal && (
        <Modal title="배정 추가" onClose={() => setModal(false)}>
          <Field label="전화하는 사람 (담당자)">
            <select style={inputStyle} value={form.caller_id} onChange={e => setForm({ ...form, caller_id: e.target.value })}>
              <option value="">선택하세요</option>
              {callers.map(c => <option key={c.id} value={c.id}>{c.grade}학년 {c.name}</option>)}
            </select>
          </Field>
          <Field label="전화받는 사람 (대상자)">
            <select style={inputStyle} value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })}>
              <option value="">선택하세요</option>
              {receivers.map(r => <option key={r.id} value={r.id}>{r.grade}학년 {r.class}반 {r.name}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setModal(false)} style={btnStyle("ghost")}>취소</button>
            <button onClick={save} disabled={saving} style={btnStyle("primary")}>{saving ? "저장 중..." : "저장"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 통화 기록 입력 ─────────────────────────────────────────────────────────
function LogsPage({ data, week, onRefresh }) {
  const { callers, maps, logs } = data;
  const [selectedCaller, setSelectedCaller] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ called_date: new Date().toISOString().slice(0, 10), is_answered: true, content: "" });
  const [saving, setSaving] = useState(false);

  const myMaps = maps.filter(m => m.caller_id === selectedCaller);

  const getLog = (receiverId) =>
    logs.find(l =>
      l.receiver_id === receiverId &&
      l.caller_id === selectedCaller &&
      l.called_date && getISOWeek(new Date(l.called_date)) === week
    );

  const openModal = (mapItem) => {
    const existing = getLog(mapItem.receiver_id);
    setModal(mapItem);
    setForm({
      called_date: existing?.called_date || new Date().toISOString().slice(0, 10),
      is_answered: existing?.is_answered ?? true,
      content: existing?.content || "",
    });
  };

  const save = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const existing = getLog(modal.receiver_id);
      const payload = {
        caller_id: selectedCaller,
        receiver_id: modal.receiver_id,
        called_date: form.called_date,
        is_answered: form.is_answered,
        content: form.content || null,
      };
      if (existing) await db("PATCH", `call_logs?id=eq.${existing.id}`, payload);
      else await db("POST", "call_logs", payload);
      setModal(null);
      onRefresh();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const deleteLog = async (receiverId) => {
    const existing = getLog(receiverId);
    if (!existing || !confirm("통화 기록을 삭제하시겠습니까?")) return;
    try { await db("DELETE", `call_logs?id=eq.${existing.id}`); onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const doneCount = myMaps.filter(m => getLog(m.receiver_id)).length;
  const thStyle = { textAlign: "left", padding: "11px 20px", color: "#64748b", fontWeight: 600, fontSize: 13 };
  const tdStyle = { padding: "13px 20px", fontSize: 14 };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>통화 기록 입력</h2>
        <span style={{ fontSize: 13, color: "#64748b" }}>{week}</span>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "18px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>전화하는 사람 선택</label>
        <select value={selectedCaller} onChange={e => setSelectedCaller(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 180 }}>
          <option value="">담당자를 선택하세요</option>
          {callers.map(c => <option key={c.id} value={c.id}>{c.grade}학년 {c.name}</option>)}
        </select>
        {selectedCaller && myMaps.length > 0 && (
          <span style={{ fontSize: 13, color: "#0284c7", fontWeight: 600 }}>
            {myMaps.length}명 배정 · {doneCount}명 완료
          </span>
        )}
      </div>

      {!selectedCaller ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#94a3b8", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", fontSize: 14 }}>
          담당자를 선택하면 이번 주 배정 목록이 표시됩니다.
        </div>
      ) : myMaps.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#94a3b8", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", fontSize: 14 }}>
          이번 주 배정된 대상자가 없습니다.
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", background: "#f0f9ff", borderBottom: "1px solid #bae6fd", display: "flex", alignItems: "center", gap: 8 }}>
            {myMaps.map(m => {
              const log = getLog(m.receiver_id);
              return (
                <div key={m.id} style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: log ? (log.is_answered ? "#16a34a" : "#ef4444") : "#e2e8f0",
                }} title={m.receivers?.name} />
              );
            })}
            <span style={{ fontSize: 12, color: "#0284c7", fontWeight: 600, marginLeft: 4 }}>
              {doneCount}/{myMaps.length} 완료
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  {["학년", "반", "이름", "전화번호", "특이사항", "상태", ""].map((h, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: i === 6 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myMaps.map(m => {
                  const log = getLog(m.receiver_id);
                  const r = m.receivers;
                  return (
                    <tr key={m.id} style={{
                      borderTop: "1px solid #f1f5f9",
                      background: log ? (log.is_answered ? "#f0fdf4" : "#fff7f7") : "#fff",
                    }}>
                      <td style={tdStyle}>{r?.grade}학년</td>
                      <td style={tdStyle}>{r?.class}반</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{r?.name}</td>
                      <td style={tdStyle}>{r?.phone}</td>
                      <td style={{ ...tdStyle, color: r?.note ? "#ef4444" : "#94a3b8", fontSize: 13 }}>
                        {r?.note ? `⚠️ ${r.note}` : "-"}
                      </td>
                      <td style={tdStyle}>
                        {log ? <Badge answered={log.is_answered} /> : <span style={{ fontSize: 12, color: "#94a3b8" }}>미완료</span>}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button onClick={() => openModal(m)} style={{ ...btnStyle("primary"), marginRight: 8, padding: "6px 14px" }}>
                          {log ? "수정" : "기록"}
                        </button>
                        {log && (
                          <button onClick={() => deleteLog(m.receiver_id)} style={{ ...btnStyle("danger"), padding: "6px 14px" }}>삭제</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={`통화 기록 - ${modal.receivers?.name}`} onClose={() => setModal(null)}>
          <div style={{ padding: "12px 16px", background: "#f0f9ff", borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
            <strong style={{ fontSize: 15 }}>{modal.receivers?.grade}학년 {modal.receivers?.class}반 {modal.receivers?.name}</strong>
            <span style={{ color: "#0284c7", marginLeft: 10 }}>{modal.receivers?.phone}</span>
            {modal.receivers?.note && (
              <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>⚠️ {modal.receivers.note}</div>
            )}
          </div>
          <Field label="전화한 날짜 *">
            <input style={inputStyle} type="date" value={form.called_date}
              onChange={e => setForm({ ...form, called_date: e.target.value })} />
          </Field>
          <Field label="수신 여부 *">
            <div style={{ display: "flex", gap: 20 }}>
              {[{ v: true, label: "✓ 수신" }, { v: false, label: "✗ 미수신" }].map(({ v, label }) => (
                <label key={String(v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                  <input type="radio" name="answered" checked={form.is_answered === v}
                    onChange={() => setForm({ ...form, is_answered: v })} />
                  <span style={{ color: v ? "#16a34a" : "#ef4444" }}>{label}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="통화 내용">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
              value={form.content} placeholder="통화 내용 입력 (선택)"
              onChange={e => setForm({ ...form, content: e.target.value })} />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={btnStyle("ghost")}>취소</button>
            <button onClick={save} disabled={saving} style={btnStyle("success")}>{saving ? "저장 중..." : "저장"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ callers: [], receivers: [], maps: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [callers, receivers, maps, logs] = await Promise.all([
        db("GET", "callers?select=*&order=grade.asc,name.asc"),
        db("GET", "receivers?select=*&order=grade.asc,class.asc,name.asc"),
        db("GET", `caller_receiver_map?select=*,callers(*),receivers(*)&week_label=eq.${THIS_WEEK}`),
        db("GET", "call_logs?select=*,callers(*),receivers(*)&order=recorded_at.desc&limit=500"),
      ]);
      setData({ callers, receivers, maps, logs });
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const nav = [
    { id: "dashboard", icon: "📊", label: "대시보드" },
    { id: "callers",   icon: "👤", label: "전화하는 사람" },
    { id: "receivers", icon: "📋", label: "전화받는 사람" },
    { id: "maps",      icon: "🔗", label: "주간 배정" },
    { id: "logs",      icon: "📞", label: "통화 기록" },
  ];

  const pages = {
    dashboard: <Dashboard data={data} week={THIS_WEEK} />,
    callers:   <CallersPage callers={data.callers} onRefresh={load} />,
    receivers: <ReceiversPage receivers={data.receivers} onRefresh={load} />,
    maps:      <MapsPage data={data} week={THIS_WEEK} onRefresh={load} />,
    logs:      <LogsPage data={data} week={THIS_WEEK} onRefresh={load} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif" }}>
      <div style={{ width: 224, background: "#0c4a6e", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #075985" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>📞</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>통화 관리</div>
          <div style={{ color: "#7dd3fc", fontSize: 12, marginTop: 2 }}>주간 통화 기록 시스템</div>
        </div>
        <nav style={{ padding: "10px 0", flex: 1 }}>
          {nav.map(n => (
            <div key={n.id} onClick={() => setPage(n.id)} style={{
              padding: "12px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 14, fontWeight: page === n.id ? 600 : 400,
              color: page === n.id ? "#fff" : "#93c5fd",
              background: page === n.id ? "#075985" : "transparent",
              borderLeft: `3px solid ${page === n.id ? "#38bdf8" : "transparent"}`,
              transition: "all 0.12s",
            }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #075985" }}>
          <div style={{ fontSize: 11, color: "#7dd3fc", marginBottom: 2 }}>현재 주</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 10 }}>{THIS_WEEK}</div>
          <button onClick={load} style={{ background: "#075985", border: "none", color: "#7dd3fc", padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit", width: "100%" }}>
            🔄 새로고침
          </button>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f0f9ff", padding: 32, overflowY: "auto", minWidth: 0 }}>
        {loading && (
          <div style={{ marginBottom: 16, padding: "10px 16px", background: "#e0f2fe", borderRadius: 8, fontSize: 13, color: "#0284c7" }}>
            ⏳ 로딩 중...
          </div>
        )}
        {err && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
            ⚠️ DB 연결 오류: {err}<br />
            <span style={{ fontSize: 12, color: "#ef4444" }}>src/config.js 의 SUPABASE_URL 과 SUPABASE_ANON_KEY 를 확인하세요.</span>
          </div>
        )}
        {pages[page]}
      </div>
    </div>
  );
}
