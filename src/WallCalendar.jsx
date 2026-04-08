import { useState, useMemo, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// One photo per month — swap these with your own if you want
const HERO_IMAGES = [
  "https://picsum.photos/seed/snowy-mountain-jan/900/400",
  "https://picsum.photos/seed/frozen-river-feb/900/400",
  "https://picsum.photos/seed/spring-blossoms/900/400",
  "https://picsum.photos/seed/tulip-field-april/900/400",
  "https://picsum.photos/seed/green-meadow-may/900/400",
  "https://picsum.photos/seed/ocean-sunset-june/900/400",
  "https://picsum.photos/seed/beach-summer-july/900/400",
  "https://picsum.photos/seed/harvest-august/900/400",
  "https://picsum.photos/seed/autumn-forest-sep/900/400",
  "https://picsum.photos/seed/fall-leaves-oct/900/400",
  "https://picsum.photos/seed/misty-woods-nov/900/400",
  "https://picsum.photos/seed/winter-cabin-dec/900/400",
];

// 5 color options for event tags
const TAG_COLORS = [
  { bg:"#FFE4D8", text:"#A84315", border:"#F4A470", darkBg:"#5C2310", darkText:"#FFA07A" },
  { bg:"#DBEAFE", text:"#1E40AF", border:"#93C5FD", darkBg:"#1E3A5F", darkText:"#93C5FD" },
  { bg:"#DCFCE7", text:"#166534", border:"#86EFAC", darkBg:"#14532D", darkText:"#86EFAC" },
  { bg:"#EDE9FE", text:"#6D28D9", border:"#C4B5FD", darkBg:"#3B1F6B", darkText:"#C4B5FD" },
  { bg:"#FCE7F3", text:"#9D174D", border:"#F9A8D4", darkBg:"#5C0F2D", darkText:"#F9A8D4" },
];

// Each month gets its own accent color — makes the header feel fresh every month
const MONTH_ACCENTS = [
  { color:"#60A5FA", glow:"rgba(96,165,250,0.25)"  }, // Jan — icy blue
  { color:"#A78BFA", glow:"rgba(167,139,250,0.25)" }, // Feb — soft violet
  { color:"#34D399", glow:"rgba(52,211,153,0.25)"  }, // Mar — spring green
  { color:"#F472B6", glow:"rgba(244,114,182,0.25)" }, // Apr — blossom pink
  { color:"#4ADE80", glow:"rgba(74,222,128,0.25)"  }, // May — bright green
  { color:"#FBBF24", glow:"rgba(251,191,36,0.25)"  }, // Jun — sunny yellow
  { color:"#FB923C", glow:"rgba(251,146,60,0.25)"  }, // Jul — warm orange
  { color:"#F97316", glow:"rgba(249,115,22,0.25)"  }, // Aug — harvest orange
  { color:"#F87171", glow:"rgba(248,113,113,0.25)" }, // Sep — autumn red
  { color:"#EF4444", glow:"rgba(239,68,68,0.25)"   }, // Oct — bold red
  { color:"#94A3B8", glow:"rgba(148,163,184,0.25)" }, // Nov — slate grey
  { color:"#38BDF8", glow:"rgba(56,189,248,0.25)"  }, // Dec — winter sky
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const daysInMonth    = (m, y) => new Date(y, m + 1, 0).getDate();
const firstDayOffset = (m, y) => new Date(y, m, 1).getDay();
const isSameDay      = (a, b) => a && b && a.toDateString() === b.toDateString();
const isBetween      = (d, s, e) => {
  const t = d.getTime(), lo = Math.min(s.getTime(), e.getTime()), hi = Math.max(s.getTime(), e.getTime());
  return t > lo && t < hi;
};
const shortDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
const isWeekendCol = (cellIdx) => cellIdx % 7 === 0 || cellIdx % 7 === 6;

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function WallCalendar() {
  const today = new Date();

  // Navigation
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  // Dark / light mode
  const [isDark, setIsDark] = useState(false);

  // Date range picking — user clicks start then end
  const [pickStart,   setPickStart]   = useState(null);
  const [pickEnd,     setPickEnd]     = useState(null);
  const [awaitingEnd, setAwaitingEnd] = useState(false);
  const [hoverDay,    setHoverDay]    = useState(null);

  // Tag panel state
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [tagLabel,     setTagLabel]     = useState("");
  const [tagColorIdx,  setTagColorIdx]  = useState(0);
  const tagInputRef = useRef(null);

  // Saved events list
  const [events, setEvents] = useState([]);

  // Bullet notes — stored per "year-month" key so each month is separate
  const [allNotes,    setAllNotes]    = useState({});
  const [newNoteText, setNewNoteText] = useState("");
  const noteKey      = `${viewYear}-${viewMonth}`;
  const bulletList   = allNotes[noteKey] || [];

  // Hero image fade-in
  const [imgLoaded, setImgLoaded] = useState(false);

  // Slight fade when navigating months
  const [fading, setFading] = useState(false);

  // Focus tag input when panel opens
  useEffect(() => {
    if (showTagPanel && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagPanel]);

  // Reset image on month change
  useEffect(() => { setImgLoaded(false); }, [viewMonth]);

  // ── Theme color tokens — all colors in ONE place ──────────────────────────
  const accent = MONTH_ACCENTS[viewMonth].color;
  const glow   = MONTH_ACCENTS[viewMonth].glow;

  const T = {
    bg:           isDark ? "#1A1612" : "#FDFAF5",
    surface:      isDark ? "#252018" : "#FFFFFF",
    surfaceHover: isDark ? "#2E2820" : "#F5EFE4",
    border:       isDark ? "#3D3628" : "#E0D8C8",
    borderFaint:  isDark ? "#2D2820" : "#F0E8D8",
    text:         isDark ? "#F0EAD8" : "#3A3028",
    textMuted:    isDark ? "#9A8E78" : "#A8998A",
    textFaint:    isDark ? "#504838" : "#C0B8A8",
    binding:      isDark ? "#2A2318" : "#DDD5C5",
    bindingHole:  isDark ? "#1A1612" : "#F9F5EE",
    notesBg:      isDark ? "#1E1A14" : "#FFFDF8",
    tagPanelBg:   isDark ? "#201C16" : "#FFF8F2",
    tagPanelBorder: isDark ? "#3D3428" : "#F0DECB",
    outerBg:      isDark ? "#0E0C08" : "#EDE5D8",
  };

  // ── Navigation helpers ────────────────────────────────────────────────────

  const navigate = (dir) => {
    setFading(true);
    setTimeout(() => {
      if (dir === "prev") {
        setViewMonth(m => m === 0 ? (setViewYear(y => y - 1), 11) : m - 1);
      } else {
        setViewMonth(m => m === 11 ? (setViewYear(y => y + 1), 0) : m + 1);
      }
      setFading(false);
    }, 150);
  };

  const jumpToToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  // ── Date click handler ────────────────────────────────────────────────────

  const handleDayClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);
    if (!awaitingEnd) {
      // First click = start date
      setPickStart(clicked); setPickEnd(null);
      setAwaitingEnd(true); setShowTagPanel(false);
    } else {
      // Second click = end date → open tag panel
      setPickEnd(clicked); setAwaitingEnd(false); setShowTagPanel(true);
    }
  };

  const saveEvent = () => {
    if (!pickStart || !pickEnd) return;
    const [s, e] = pickStart <= pickEnd ? [pickStart, pickEnd] : [pickEnd, pickStart];
    setEvents(prev => [...prev, {
      id: Date.now(), start: s, end: e,
      label: tagLabel.trim() || "Event",
      color: tagColorIdx,
    }]);
    setPickStart(null); setPickEnd(null);
    setTagLabel(""); setTagColorIdx(0); setShowTagPanel(false);
  };

  const cancelSelection = () => {
    setPickStart(null); setPickEnd(null);
    setAwaitingEnd(false); setShowTagPanel(false); setTagLabel("");
  };

  const deleteEvent = (id) => setEvents(prev => prev.filter(ev => ev.id !== id));

  // ── Notes (bullet points) ─────────────────────────────────────────────────

  const addNote = () => {
    const txt = newNoteText.trim();
    if (!txt) return;
    setAllNotes(prev => ({ ...prev, [noteKey]: [...(prev[noteKey] || []), txt] }));
    setNewNoteText("");
  };

  const deleteNote = (idx) => {
    setAllNotes(prev => ({ ...prev, [noteKey]: (prev[noteKey] || []).filter((_, i) => i !== idx) }));
  };

  const editNote = (idx, newText) => {
    setAllNotes(prev => ({
      ...prev,
      [noteKey]: (prev[noteKey] || []).map((b, i) => i === idx ? newText : b),
    }));
  };

  // ── Calendar grid ─────────────────────────────────────────────────────────

  const cells = useMemo(() => {
    const blanks = Array(firstDayOffset(viewMonth, viewYear)).fill(null);
    const days   = Array.from({ length: daysInMonth(viewMonth, viewYear) }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [viewMonth, viewYear]);

  const getDayState = (day, cellIdx) => {
    if (!day) return { type: "blank" };
    const d = new Date(viewYear, viewMonth, day);

    for (const ev of events) {
      if (isSameDay(d, ev.start)) return { type: "evStart", ci: ev.color };
      if (isSameDay(d, ev.end))   return { type: "evEnd",   ci: ev.color };
      if (isBetween(d, ev.start, ev.end)) return { type: "evMid", ci: ev.color };
    }

    const preEnd = awaitingEnd ? hoverDay : pickEnd;
    if (isSameDay(d, pickStart))              return { type: "selStart" };
    if (isSameDay(d, preEnd))                 return { type: "selEnd" };
    if (pickStart && preEnd && isBetween(d, pickStart, preEnd)) return { type: "selMid" };

    if (isSameDay(d, today))   return { type: "today" };
    if (isWeekendCol(cellIdx)) return { type: "weekend" };
    return { type: "normal" };
  };

  const getDayStyle = (state) => {
    const base = {
      textAlign: "center", padding: "8px 3px", fontSize: 13,
      cursor: "pointer", borderRadius: 8,
      transition: "background 0.12s, transform 0.1s",
      fontFamily: "system-ui, sans-serif", userSelect: "none",
    };
    if (state.type === "blank") return { padding: "8px 3px" };
    if (state.type === "today") return { ...base, fontWeight:"700", color: accent, border:`2px solid ${accent}`, background: glow };
    if (state.type === "weekend") return { ...base, color: isDark ? "#E87B5A" : "#B07050" };
    if (state.type === "selStart" || state.type === "selEnd") return { ...base, background: accent, color:"#fff", fontWeight:"700" };
    if (state.type === "selMid") return { ...base, background: glow, color: accent, borderRadius: 3 };

    const c = state.ci !== undefined ? TAG_COLORS[state.ci] : null;
    if (state.type === "evStart" || state.type === "evEnd") return {
      ...base, fontWeight:"700",
      background: isDark ? c.darkBg : c.bg,
      color: isDark ? c.darkText : c.text,
    };
    if (state.type === "evMid") return {
      ...base, borderRadius: 3,
      background: isDark ? c.darkBg : c.bg,
      color: isDark ? c.darkText : c.text,
    };
    return { ...base, color: T.text };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes popIn {
          0%   { transform:scale(0.85); opacity:0; }
          100% { transform:scale(1);    opacity:1; }
        }

        /* Responsive layout */
        .cal-wrapper {
          max-width: 1040px;
          margin: 0 auto;
          padding: 16px;
          box-sizing: border-box;
          font-family: Georgia, serif;
        }
        .cal-card {
          display: flex;
          flex-direction: column;
          border-radius: 0 0 16px 16px;
          overflow: hidden;
        }
        /* On desktop: image left, calendar right */
        @media (min-width: 820px) {
          .cal-card { flex-direction: row !important; min-height: 600px; }
          .hero-panel { width: 340px !important; min-height: unset !important; border-radius: 0 !important; }
          .cal-panel  { border-radius: 0 !important; }
        }
        /* On mobile: stacked vertically */
        @media (max-width: 819px) {
          .hero-panel { height: 210px !important; width: 100% !important; }
        }

        .day-hover:hover {
          background: ${T.surfaceHover} !important;
          transform: scale(1.1) !important;
        }
        .nav-btn:hover { background: ${T.surfaceHover} !important; }
        .bullet-row:hover .del-btn { opacity: 1 !important; }
        .event-chip:hover { opacity: 0.85; }

        /* Custom scrollbar in dark mode */
        .cal-panel::-webkit-scrollbar { width: 4px; }
        .cal-panel::-webkit-scrollbar-track { background: transparent; }
        .cal-panel::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
      `}</style>

      <div className="cal-wrapper" style={{ background: T.outerBg, minHeight: "100vh" }}>

        {/* ── Top bar: label + dark/light toggle ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 4px", marginBottom:12,
        }}>
          <span style={{
            fontSize:12, letterSpacing:2.5, textTransform:"uppercase",
            color: T.textMuted, fontFamily:"system-ui",
          }}>
            Wall Calendar
          </span>

          {/* Theme toggle switch */}
          <div
            onClick={() => setIsDark(d => !d)}
            style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none" }}
          >
            <span style={{ fontSize:15 }}>{isDark ? "🌙" : "☀️"}</span>
            {/* The track */}
            <div style={{
              width:44, height:24, borderRadius:12,
              background: isDark ? accent : "#C8BBAA",
              position:"relative", transition:"background 0.3s",
            }}>
              {/* The thumb */}
              <div style={{
                width:18, height:18, borderRadius:"50%",
                background:"white",
                position:"absolute", top:3,
                left: isDark ? 23 : 3,
                transition:"left 0.3s",
                boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </div>
            <span style={{ fontSize:11, color: T.textMuted, fontFamily:"system-ui" }}>
              {isDark ? "Dark" : "Light"}
            </span>
          </div>
        </div>

        {/* ── Spiral binding strip at the top ── */}
        <div style={{
          height:22, background: T.binding,
          borderRadius:"12px 12px 0 0",
          display:"flex", alignItems:"center",
          justifyContent:"center", gap:9, padding:"0 20px",
        }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              width:13, height:13, borderRadius:"50%", flexShrink:0,
              background: T.bindingHole,
              border:`2px solid ${isDark ? "#4A4030" : "#A8998A"}`,
            }} />
          ))}
        </div>

        {/* ── Main card ── */}
        <div
          className="cal-card"
          style={{
            background: T.surface,
            border:`1px solid ${T.border}`,
            boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.5)" : "0 8px 40px rgba(80,50,20,0.12)",
            opacity: fading ? 0.5 : 1,
            transition:"opacity 0.15s",
          }}
        >

          {/* ── Left/Top: Hero Image Panel ── */}
          <div
            className="hero-panel"
            style={{
              position:"relative", overflow:"hidden", flexShrink:0,
              background: isDark ? "#1A1410" : "#EDE5D5",
            }}
          >
            <img
              key={`img-${viewMonth}-${viewYear}`}
              src={HERO_IMAGES[viewMonth]}
              alt={`${MONTHS[viewMonth]} scenery`}
              style={{
                width:"100%", height:"100%", objectFit:"cover", display:"block",
                opacity: imgLoaded ? 1 : 0,
                transition:"opacity 0.6s ease",
              }}
              onLoad={() => setImgLoaded(true)}
            />

            {/* Month + Year overlay — highlighted with accent glow */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              padding:"50px 22px 22px",
              background:"linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)",
            }}>
              {/* Year label */}
              <div style={{
                fontSize:11, letterSpacing:3, fontFamily:"system-ui",
                color: accent, textTransform:"uppercase", marginBottom:5,
              }}>
                {viewYear}
              </div>

              {/* Month name — big, bold, glowing with the month's accent color */}
              <div style={{
                fontSize:38, fontWeight:"900", letterSpacing:4,
                textTransform:"uppercase", lineHeight:1,
                color: accent,
                textShadow:`0 0 28px ${accent}, 0 0 8px ${glow}, 0 2px 10px rgba(0,0,0,0.7)`,
                fontFamily:"Georgia, serif",
                animation:"fadeIn 0.5s ease",
              }}>
                {MONTHS[viewMonth]}
              </div>
            </div>
          </div>

          {/* ── Right/Bottom: Calendar Panel ── */}
          <div
            className="cal-panel"
            style={{
              flex:1, padding:"22px 20px 26px",
              background: T.bg, overflowY:"auto",
            }}
          >

            {/* Month navigation row */}
            <div style={{
              display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:14,
            }}>
              <button
                className="nav-btn"
                onClick={() => navigate("prev")}
                style={{
                  background:"none", border:`1px solid ${T.border}`, borderRadius:8,
                  padding:"5px 14px", cursor:"pointer", fontSize:20, color: T.textMuted,
                  transition:"background 0.15s", lineHeight:1,
                }}
              >‹</button>

              {/* Month + year display — styled with accent color */}
              <div style={{ textAlign:"center" }}>
                <div style={{
                  fontSize:22, fontWeight:"900", letterSpacing:2,
                  fontFamily:"Georgia, serif",
                  color: accent,
                  textShadow:`0 0 20px ${glow}`,
                  animation:"fadeIn 0.4s ease",
                }}>
                  {MONTHS[viewMonth].toUpperCase()}
                </div>
                <div style={{
                  fontSize:11, color: T.textMuted,
                  fontFamily:"system-ui", letterSpacing:2, marginTop:1,
                }}>
                  {viewYear}
                </div>
              </div>

              <button
                className="nav-btn"
                onClick={() => navigate("next")}
                style={{
                  background:"none", border:`1px solid ${T.border}`, borderRadius:8,
                  padding:"5px 14px", cursor:"pointer", fontSize:20, color: T.textMuted,
                  transition:"background 0.15s", lineHeight:1,
                }}
              >›</button>
            </div>

            {/* Jump to today */}
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <button
                onClick={jumpToToday}
                style={{
                  background:"none", border:`1px solid ${T.border}`, borderRadius:20,
                  padding:"3px 14px", cursor:"pointer", fontSize:11,
                  color: T.textMuted, fontFamily:"system-ui", letterSpacing:0.5,
                }}
              >
                ↩ Jump to Today
              </button>
            </div>

            {/* Hint during end-date selection */}
            {awaitingEnd && (
              <p style={{
                textAlign:"center", fontSize:12, color: accent,
                marginBottom:10, fontFamily:"system-ui",
                animation:"slideDown 0.2s ease",
              }}>
                📅 Start set — click an end date to complete the range
              </p>
            )}

            {/* ── Calendar Grid ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2 }}>
              {/* Weekday headers — weekends use accent color */}
              {WEEKDAYS.map((d, i) => (
                <div key={d} style={{
                  textAlign:"center", fontSize:10, fontWeight:"700",
                  letterSpacing:0.6, textTransform:"uppercase",
                  paddingBottom:8, fontFamily:"system-ui",
                  color: (i === 0 || i === 6) ? accent : T.textMuted,
                }}>
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {cells.map((day, i) => {
                const state = getDayState(day, i);
                const style = getDayStyle(state);
                return (
                  <div
                    key={i}
                    className={day ? "day-hover" : ""}
                    style={style}
                    onClick={() => day && handleDayClick(day)}
                    onMouseEnter={() => {
                      if (day && awaitingEnd) setHoverDay(new Date(viewYear, viewMonth, day));
                    }}
                    onMouseLeave={() => { if (awaitingEnd) setHoverDay(null); }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* ── Tag panel — slides in after range picked ── */}
            {showTagPanel && pickStart && pickEnd && (
              <div style={{
                marginTop:14, padding:"14px 16px",
                background: T.tagPanelBg, border:`1px solid ${T.tagPanelBorder}`,
                borderRadius:10, animation:"slideDown 0.25s ease",
              }}>
                <p style={{ margin:"0 0 8px", fontSize:12, color: T.textMuted, fontFamily:"system-ui" }}>
                  🗓 {shortDate(pickStart <= pickEnd ? pickStart : pickEnd)}
                  {" → "}
                  {shortDate(pickStart <= pickEnd ? pickEnd : pickStart)}
                </p>

                <input
                  ref={tagInputRef}
                  value={tagLabel}
                  onChange={e => setTagLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveEvent()}
                  placeholder="Name this event (e.g. Vacation, Sprint…)"
                  style={{
                    width:"100%", padding:"8px 10px", boxSizing:"border-box",
                    border:`1px solid ${T.border}`, borderRadius:7, fontSize:13,
                    fontFamily:"system-ui", background: T.surface, color: T.text,
                    outline:"none", marginBottom:10,
                  }}
                />

                {/* Color picker */}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                  <span style={{ fontSize:11, color: T.textMuted, fontFamily:"system-ui" }}>Color:</span>
                  {TAG_COLORS.map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => setTagColorIdx(idx)}
                      style={{
                        width:20, height:20, borderRadius:"50%", cursor:"pointer",
                        background: c.text,
                        border: tagColorIdx === idx ? `3px solid ${T.text}` : "3px solid transparent",
                        transform: tagColorIdx === idx ? "scale(1.22)" : "scale(1)",
                        transition:"transform 0.1s, border 0.1s",
                      }}
                    />
                  ))}
                </div>

                <div style={{ display:"flex", gap:8 }}>
                  <button
                    onClick={saveEvent}
                    style={{
                      padding:"7px 18px", background: accent, color:"#fff",
                      border:"none", borderRadius:7, cursor:"pointer",
                      fontSize:13, fontFamily:"system-ui", fontWeight:"700",
                    }}
                  >Save Event</button>
                  <button
                    onClick={cancelSelection}
                    style={{
                      padding:"7px 13px", background:"none",
                      border:`1px solid ${T.border}`,
                      borderRadius:7, cursor:"pointer",
                      fontSize:13, fontFamily:"system-ui", color: T.textMuted,
                    }}
                  >Cancel</button>
                </div>
              </div>
            )}

            {/* ── Saved events chips ── */}
            {events.length > 0 && (
              <div style={{ marginTop:14 }}>
                <p style={{
                  fontSize:10, letterSpacing:1.2, textTransform:"uppercase",
                  color: T.textMuted, marginBottom:7, fontFamily:"system-ui",
                }}>Saved Events</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {events.map(ev => {
                    const c = TAG_COLORS[ev.color];
                    return (
                      <div
                        key={ev.id}
                        className="event-chip"
                        style={{
                          display:"inline-flex", alignItems:"center", gap:5,
                          background: isDark ? c.darkBg : c.bg,
                          color: isDark ? c.darkText : c.text,
                          border:`1px solid ${isDark ? c.darkText+"44" : c.border}`,
                          borderRadius:20, padding:"4px 10px",
                          fontSize:11, fontFamily:"system-ui",
                          animation:"popIn 0.2s ease", transition:"opacity 0.15s",
                        }}
                      >
                        <span style={{ fontWeight:"700" }}>{ev.label}</span>
                        <span style={{ opacity:0.65 }}>{shortDate(ev.start)} – {shortDate(ev.end)}</span>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          style={{
                            background:"none", border:"none", cursor:"pointer",
                            color:"inherit", fontSize:14, lineHeight:1, padding:0, opacity:0.6,
                          }}
                        >×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Notes section (bullet points) ── */}
            <div style={{ marginTop:22, paddingTop:18, borderTop:`1px dashed ${T.border}` }}>
              <p style={{
                fontSize:10, letterSpacing:1.5, textTransform:"uppercase",
                color: T.textMuted, marginBottom:12, fontFamily:"system-ui",
              }}>
                📌 Notes for {MONTHS[viewMonth]}
              </p>

              {/* Bullet list */}
              {bulletList.length === 0 && (
                <p style={{
                  fontSize:13, color: T.textFaint,
                  fontFamily:"system-ui", fontStyle:"italic", margin:"0 0 10px",
                }}>
                  No notes yet — add one below ↓
                </p>
              )}
              {bulletList.map((text, idx) => (
                <BulletItem
                  key={idx}
                  text={text}
                  accent={accent}
                  T={T}
                  onDelete={() => deleteNote(idx)}
                  onEdit={(newText) => editNote(idx, newText)}
                />
              ))}

              {/* Add new note */}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <input
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Type a note and press Enter…"
                  style={{
                    flex:1, padding:"8px 11px",
                    border:`1px solid ${T.border}`, borderRadius:7,
                    fontSize:13, fontFamily:"system-ui",
                    background: T.notesBg, color: T.text, outline:"none",
                  }}
                />
                <button
                  onClick={addNote}
                  style={{
                    padding:"8px 15px", background: accent,
                    color:"#fff", border:"none",
                    borderRadius:7, cursor:"pointer",
                    fontSize:17, fontWeight:"700", lineHeight:1,
                  }}
                >+</button>
              </div>
              <p style={{ fontSize:10, color: T.textFaint, margin:"5px 0 0", fontFamily:"system-ui" }}>
                Double-click a note to edit it in place
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BULLET ITEM  — a tiny component that handles its own edit mode
// ─────────────────────────────────────────────────────────────────────────────

function BulletItem({ text, accent, T, onDelete, onEdit }) {
  // editing = true when the user double-clicks the text
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(text);
  const inputRef = useRef(null);

  // Auto-focus the input when we enter edit mode
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const clean = draft.trim();
    if (clean) onEdit(clean);
    else onDelete(); // empty note = delete it
    setEditing(false);
  };

  return (
    <div
      className="bullet-row"
      style={{
        display:"flex", alignItems:"flex-start", gap:9,
        padding:"6px 0", borderBottom:`1px solid ${T.borderFaint}`,
        animation:"slideDown 0.2s ease",
      }}
    >
      {/* Accent-colored bullet dot */}
      <div style={{
        width:7, height:7, borderRadius:"50%",
        background: accent, flexShrink:0, marginTop:6,
      }} />

      {/* Editable text or input */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          style={{
            flex:1, border:`1px solid ${accent}`, borderRadius:5,
            padding:"2px 7px", fontSize:13,
            fontFamily:"system-ui", background: T.surface, color: T.text, outline:"none",
          }}
        />
      ) : (
        <span
          onDoubleClick={() => { setDraft(text); setEditing(true); }}
          style={{
            flex:1, fontSize:13, color: T.text,
            fontFamily:"system-ui", lineHeight:1.7, cursor:"text",
          }}
        >
          {text}
        </span>
      )}

      {/* Delete button — only visible on hover (see CSS above) */}
      <button
        className="del-btn"
        onClick={onDelete}
        style={{
          background:"none", border:"none", cursor:"pointer",
          color: T.textFaint, fontSize:15, lineHeight:1,
          padding:0, opacity:0, transition:"opacity 0.15s", flexShrink:0,
        }}
      >×</button>
    </div>
  );
}
