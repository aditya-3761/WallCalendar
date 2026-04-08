import { useState, useMemo, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// One landscape photo per month — swap these URLs with your own if you like
const HERO_IMAGES = [
  "https://picsum.photos/seed/snowy-mountain/900/320",     // Jan
  "https://picsum.photos/seed/frozen-river/900/320",       // Feb
  "https://picsum.photos/seed/spring-blossom/900/320",     // Mar
  "https://picsum.photos/seed/tulip-fields/900/320",       // Apr
  "https://picsum.photos/seed/green-meadow/900/320",       // May
  "https://picsum.photos/seed/ocean-sunset/900/320",       // Jun
  "https://picsum.photos/seed/beach-summer/900/320",       // Jul
  "https://picsum.photos/seed/golden-harvest/900/320",     // Aug
  "https://picsum.photos/seed/autumn-forest/900/320",      // Sep
  "https://picsum.photos/seed/fall-leaves-path/900/320",   // Oct
  "https://picsum.photos/seed/misty-woods/900/320",        // Nov
  "https://picsum.photos/seed/winter-cabin/900/320",       // Dec
];

// Tag color options — bg, text, border
const TAG_COLORS = [
  { bg: "#FFE4D8", text: "#A84315", border: "#F4A470" }, // coral
  { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" }, // blue
  { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" }, // green
  { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" }, // purple
  { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" }, // pink
];

// ─── Small Helpers ────────────────────────────────────────────────────────────

const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
const firstDayOffset = (m, y) => new Date(y, m, 1).getDay();

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.toDateString() === b.toDateString();
};

const isBetween = (date, start, end) => {
  if (!start || !end) return false;
  const t = date.getTime();
  const lo = Math.min(start.getTime(), end.getTime());
  const hi = Math.max(start.getTime(), end.getTime());
  return t > lo && t < hi;
};

const formatDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;

const isWeekend = (dayIndex) => dayIndex % 7 === 0 || dayIndex % 7 === 6;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WallCalendar() {
  const today = new Date();

  // Navigation state
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Range selection state — user clicks start then end
  const [pickStart, setPickStart] = useState(null);
  const [pickEnd, setPickEnd] = useState(null);
  const [awaitingEnd, setAwaitingEnd] = useState(false); // true after first click
  const [hoverDay, setHoverDay] = useState(null); // for live preview while picking

  // Saved events (tagged date ranges)
  const [events, setEvents] = useState([]);

  // Tag panel (shown inline after range is selected)
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [tagLabel, setTagLabel] = useState("");
  const [tagColor, setTagColor] = useState(0);
  const tagInputRef = useRef(null);

  // Notes — stored per month so each month has its own memo
  const [allNotes, setAllNotes] = useState({});
  const notesKey = `${viewYear}-${viewMonth}`;
  const currentNotes = allNotes[notesKey] || "";

  // Image fade-in effect when month changes
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
  }, [viewMonth]);

  // Auto-focus the tag input when the panel appears
  useEffect(() => {
    if (showTagPanel && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagPanel]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goToToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  // ── Date Selection ──────────────────────────────────────────────────────────

  const handleDayClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);

    if (!awaitingEnd) {
      // First click — set start date
      setPickStart(clicked);
      setPickEnd(null);
      setAwaitingEnd(true);
      setShowTagPanel(false);
    } else {
      // Second click — set end date and show the tag panel
      setPickEnd(clicked);
      setAwaitingEnd(false);
      setShowTagPanel(true);
    }
  };

  const saveEvent = () => {
    if (!pickStart || !pickEnd) return;

    // Make sure start is always before end
    const [s, e] = pickStart <= pickEnd
      ? [pickStart, pickEnd]
      : [pickEnd, pickStart];

    setEvents(prev => [
      ...prev,
      { id: Date.now(), start: s, end: e, label: tagLabel.trim() || "Event", color: tagColor },
    ]);

    // Reset everything
    setPickStart(null);
    setPickEnd(null);
    setTagLabel("");
    setTagColor(0);
    setShowTagPanel(false);
  };

  const cancelSelection = () => {
    setPickStart(null);
    setPickEnd(null);
    setAwaitingEnd(false);
    setShowTagPanel(false);
    setTagLabel("");
  };

  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id));

  // ── Calendar Grid ───────────────────────────────────────────────────────────

  // Build array of cells — nulls for the blank spots before day 1
  const cells = useMemo(() => {
    const blanks = Array(firstDayOffset(viewMonth, viewYear)).fill(null);
    const days = Array.from({ length: daysInMonth(viewMonth, viewYear) }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [viewMonth, viewYear]);

  // Decide how to visually style each day cell
  const getDayState = (day, cellIndex) => {
    if (!day) return { type: "blank" };

    const d = new Date(viewYear, viewMonth, day);

    // Check if this day is inside any saved event
    for (const ev of events) {
      if (isSameDay(d, ev.start)) return { type: "eventStart", colorIdx: ev.color };
      if (isSameDay(d, ev.end))   return { type: "eventEnd",   colorIdx: ev.color };
      if (isBetween(d, ev.start, ev.end)) return { type: "eventMid", colorIdx: ev.color };
    }

    // Live selection preview
    const previewEnd = awaitingEnd ? hoverDay : pickEnd;

    if (isSameDay(d, pickStart)) return { type: "selStart" };
    if (isSameDay(d, previewEnd)) return { type: "selEnd" };
    if (pickStart && previewEnd && isBetween(d, pickStart, previewEnd)) return { type: "selMid" };

    if (isSameDay(d, today)) return { type: "today" };
    if (isWeekend(cellIndex)) return { type: "weekend" };

    return { type: "normal" };
  };

  // ── Styles (inline objects keep the file self-contained) ───────────────────

  const accent = "#C4622D";
  const accentLight = "#FFE4D8";

  const styles = {
    // Outer shell
    wrapper: {
      maxWidth: 660,
      margin: "0 auto",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#FDFAF5",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 4px 32px rgba(80,50,20,0.13)",
    },

    // Spiral binding at the top
    binding: {
      height: 22,
      background: "#DDD5C5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "0 24px",
    },
    bindingHole: {
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: "#F9F5EE",
      border: "2px solid #A8998A",
      flexShrink: 0,
    },

    // Hero image section
    heroWrap: {
      position: "relative",
      height: 240,
      overflow: "hidden",
      background: "#EDE5D5",
    },
    heroImg: (loaded) => ({
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      opacity: loaded ? 1 : 0,
      transition: "opacity 0.5s ease",
    }),
    heroBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      padding: "10px 20px",
      background: "rgba(20,12,4,0.55)",
      backdropFilter: "blur(4px)",
      color: "white",
      textAlign: "right",
    },

    // Main body
    body: {
      padding: "20px 22px 26px",
    },

    // Month navigation row
    navRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    navBtn: {
      background: "none",
      border: `1px solid #D5CCBA`,
      borderRadius: 6,
      padding: "5px 14px",
      cursor: "pointer",
      fontSize: 18,
      color: "#7A6A5A",
      lineHeight: 1,
      transition: "background 0.15s",
    },
    todayBtn: {
      background: "none",
      border: `1px solid #D5CCBA`,
      borderRadius: 6,
      padding: "4px 10px",
      cursor: "pointer",
      fontSize: 11,
      color: "#7A6A5A",
      letterSpacing: 0.5,
    },

    // Calendar grid
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 3,
    },
    dayHeader: {
      textAlign: "center",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: "#A8998A",
      paddingBottom: 6,
      fontFamily: "system-ui, sans-serif",
    },

    // Tag panel (inline below grid)
    tagPanel: {
      marginTop: 16,
      padding: "16px",
      background: "#FFF8F2",
      border: `1px solid #F0DECB`,
      borderRadius: 10,
      animation: "slideDown 0.2s ease",
    },
    tagInput: {
      width: "100%",
      padding: "8px 11px",
      border: "1px solid #D8CFC0",
      borderRadius: 7,
      fontSize: 14,
      fontFamily: "system-ui, sans-serif",
      outline: "none",
      background: "white",
      boxSizing: "border-box",
      marginBottom: 10,
      color: "#3A3028",
    },
    colorDot: (c, selected) => ({
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: TAG_COLORS[c].text,
      cursor: "pointer",
      border: selected ? "3px solid #3A3028" : "3px solid transparent",
      transition: "border 0.1s, transform 0.1s",
      transform: selected ? "scale(1.15)" : "scale(1)",
    }),
    saveBtn: {
      padding: "7px 18px",
      background: accent,
      color: "white",
      border: "none",
      borderRadius: 7,
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "system-ui, sans-serif",
      fontWeight: "600",
    },
    cancelBtn: {
      padding: "7px 14px",
      background: "none",
      color: "#888",
      border: "1px solid #D8CFC0",
      borderRadius: 7,
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "system-ui, sans-serif",
    },

    // Notes section
    notesWrap: {
      marginTop: 22,
      paddingTop: 18,
      borderTop: "1px dashed #D8CFC0",
    },
    notesLabel: {
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#A8998A",
      marginBottom: 8,
      fontFamily: "system-ui, sans-serif",
    },
    notesArea: {
      width: "100%",
      minHeight: 90,
      padding: "10px 12px",
      border: "1px solid #D8CFC0",
      borderRadius: 8,
      fontFamily: "'Georgia', serif",
      fontSize: 14,
      color: "#3A3028",
      background: "#FFFDF8",
      resize: "vertical",
      outline: "none",
      lineHeight: 1.6,
      boxSizing: "border-box",
    },
  };

  // ── Compute day cell style based on its state ───────────────────────────────

  const getDayCellStyle = (state) => {
    const base = {
      textAlign: "center",
      padding: "7px 3px",
      fontSize: 13,
      cursor: "pointer",
      borderRadius: 7,
      transition: "background 0.12s, color 0.12s",
      fontFamily: "system-ui, sans-serif",
      userSelect: "none",
    };

    switch (state.type) {
      case "blank":
        return { ...base, cursor: "default" };

      case "today":
        return { ...base, fontWeight: "700", color: accent, border: `1.5px solid ${accent}` };

      case "weekend":
        return { ...base, color: "#B07050" };

      case "selStart":
      case "selEnd":
        return { ...base, background: accent, color: "white", fontWeight: "700", borderRadius: 7 };

      case "selMid":
        return { ...base, background: accentLight, color: "#8B3A15", borderRadius: 2 };

      case "eventStart":
      case "eventEnd":
        return {
          ...base,
          background: TAG_COLORS[state.colorIdx].text,
          color: "white",
          fontWeight: "700",
        };

      case "eventMid":
        return {
          ...base,
          background: TAG_COLORS[state.colorIdx].bg,
          color: TAG_COLORS[state.colorIdx].text,
          borderRadius: 2,
        };

      default:
        return { ...base, color: "#3A3028" };
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Keyframe for the tag panel slide-in */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .day-cell:hover { background: #F0E8D8 !important; }
      `}</style>

      <div style={styles.wrapper}>

        {/* ── Spiral Binding ── */}
        <div style={styles.binding}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={styles.bindingHole} />
          ))}
        </div>

        {/* ── Hero Image ── */}
        <div style={styles.heroWrap}>
          <img
            key={viewMonth} // remount on month change to trigger fade
            src={HERO_IMAGES[viewMonth]}
            alt={`${MONTHS[viewMonth]} scenery`}
            style={styles.heroImg(imgLoaded)}
            onLoad={() => setImgLoaded(true)}
          />
          <div style={styles.heroBadge}>
            <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 1, fontFamily: "system-ui, sans-serif" }}>
              {viewYear}
            </div>
            <div style={{ fontSize: 26, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase" }}>
              {MONTHS[viewMonth]}
            </div>
          </div>
        </div>

        {/* ── Calendar Body ── */}
        <div style={styles.body}>

          {/* Month Navigation */}
          <div style={styles.navRow}>
            <button style={styles.navBtn} onClick={goToPrev}>‹</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: "bold", color: "#3A3028" }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button style={styles.todayBtn} onClick={goToToday}>Today</button>
            </div>
            <button style={styles.navBtn} onClick={goToNext}>›</button>
          </div>

          {/* Hint while user is picking end date */}
          {awaitingEnd && (
            <p style={{
              textAlign: "center",
              fontSize: 12,
              color: accent,
              marginBottom: 10,
              fontFamily: "system-ui, sans-serif",
            }}>
              Start date set — click another day to complete the range
            </p>
          )}

          {/* Day Grid */}
          <div style={styles.grid}>
            {/* Weekday headers */}
            {WEEKDAYS.map(d => (
              <div key={d} style={styles.dayHeader}>{d}</div>
            ))}

            {/* Day cells */}
            {cells.map((day, i) => {
              const state = getDayState(day, i);
              const cellStyle = getDayCellStyle(state);
              const canHover = day && state.type === "normal" || state.type === "weekend" || state.type === "today";

              return (
                <div
                  key={i}
                  className={canHover ? "day-cell" : ""}
                  style={cellStyle}
                  onClick={() => day && handleDayClick(day)}
                  onMouseEnter={() => {
                    if (day && awaitingEnd) {
                      setHoverDay(new Date(viewYear, viewMonth, day));
                    }
                  }}
                  onMouseLeave={() => {
                    if (awaitingEnd) setHoverDay(null);
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* ── Tag Panel (appears after a range is selected) ── */}
          {showTagPanel && pickStart && pickEnd && (
            <div style={styles.tagPanel}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#A8998A", fontFamily: "system-ui, sans-serif" }}>
                {formatDate(pickStart <= pickEnd ? pickStart : pickEnd)} →{" "}
                {formatDate(pickStart <= pickEnd ? pickEnd : pickStart)}
              </p>
              <input
                ref={tagInputRef}
                value={tagLabel}
                onChange={e => setTagLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveEvent()}
                placeholder="Name this event (e.g. Vacation, Sprint, Holiday…)"
                style={styles.tagInput}
              />

              {/* Color picker */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "#A8998A", fontFamily: "system-ui, sans-serif", marginRight: 2 }}>
                  Color:
                </span>
                {TAG_COLORS.map((_, idx) => (
                  <div
                    key={idx}
                    style={styles.colorDot(idx, tagColor === idx)}
                    onClick={() => setTagColor(idx)}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.saveBtn} onClick={saveEvent}>Save Event</button>
                <button style={styles.cancelBtn} onClick={cancelSelection}>Cancel</button>
              </div>
            </div>
          )}

          {/* ── Saved Events List ── */}
          {events.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ ...styles.notesLabel, marginBottom: 8 }}>Saved Events</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {events.map(ev => {
                  const c = TAG_COLORS[ev.color];
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      <span style={{ fontWeight: "600" }}>{ev.label}</span>
                      <span style={{ opacity: 0.65 }}>
                        {formatDate(ev.start)} – {formatDate(ev.end)}
                      </span>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: c.text,
                          fontWeight: "bold",
                          padding: "0 0 0 2px",
                          fontSize: 14,
                          lineHeight: 1,
                          opacity: 0.7,
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Notes Section ── */}
          <div style={styles.notesWrap}>
            <p style={styles.notesLabel}>
              Notes for {MONTHS[viewMonth]}
            </p>
            <textarea
              value={currentNotes}
              onChange={e =>
                setAllNotes(prev => ({ ...prev, [notesKey]: e.target.value }))
              }
              placeholder={`What's happening in ${MONTHS[viewMonth]}? Jot it down here…`}
              style={styles.notesArea}
            />
            <p style={{
              fontSize: 11,
              color: "#C0B8A8",
              margin: "5px 0 0",
              fontFamily: "system-ui, sans-serif",
            }}>
              Notes are saved per month automatically.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
