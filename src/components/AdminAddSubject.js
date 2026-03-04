import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import bpsuLogo from '../images/bpsu.png';
import {
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePrinter,
  HiOutlineX,
  HiCheckCircle,
  HiOutlineBookOpen,
} from "react-icons/hi";

/* ── helpers ── */
const YEARS = ["1st", "2nd", "3rd", "4th"];
const SEMS = ["1st", "2nd"];
const YEAR_COLORS = {
  "1st": { bg: "bg-red-600", ring: "ring-red-300", chip: "bg-red-50 text-red-700 border-red-100" },
  "2nd": { bg: "bg-rose-600", ring: "ring-rose-300", chip: "bg-rose-50 text-rose-700 border-rose-100" },
  "3rd": { bg: "bg-orange-600", ring: "ring-orange-300", chip: "bg-orange-50 text-orange-700 border-orange-100" },
  "4th": { bg: "bg-amber-600", ring: "ring-amber-300", chip: "bg-amber-50 text-amber-700 border-amber-100" },
};

const inputCls = "w-full px-3 py-2 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition";
const numCls = "w-full px-3 py-2 border border-slate-300 bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-center";
const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1";

/* ── Table component (shared for both semesters) ── */
const SubjectTable = ({ subjects, tableId }) => (
  <div id={tableId} className="overflow-x-auto">
    <table className="min-w-full text-xs">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Code</th>
          <th className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Course Title</th>
          <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Units (L/La/T)</th>
          <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Hrs/Wk (L/La/T)</th>
          <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Hrs/Sem (L/La/T)</th>
          <th className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Pre-Req</th>
          <th className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Co-Req</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {subjects.length > 0 ? subjects.map(s => (
          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 font-mono font-semibold text-red-700">{s.courseCode}</td>
            <td className="px-3 py-2 text-slate-800 font-medium max-w-xs">{s.courseTitle}</td>
            <td className="px-3 py-2 text-center text-slate-600">{s.units?.lec ?? "—"}</td>
            <td className="px-3 py-2 text-center text-slate-600">{s.units?.lab ?? "—"}</td>
            <td className="px-3 py-2 text-center font-semibold text-slate-800">{s.units?.total ?? "—"}</td>
            <td className="px-3 py-2 text-center text-slate-600">{s.hoursPerWeek?.lec ?? "—"}</td>
            <td className="px-3 py-2 text-center text-slate-600">{s.hoursPerWeek?.lab ?? "—"}</td>
            <td className="px-3 py-2 text-center font-semibold text-slate-800">{s.hoursPerWeek?.total ?? "—"}</td>
            <td className="px-3 py-2 text-center text-slate-600">{s.hoursPerSemester?.lec ?? "—"}</td>
            <td className="px-3 py-2 text-center text-slate-600">{s.hoursPerSemester?.lab ?? "—"}</td>
            <td className="px-3 py-2 text-center font-semibold text-slate-800">{s.hoursPerSemester?.total ?? "—"}</td>
            <td className="px-3 py-2 text-slate-500">{s.preRequisite || "—"}</td>
            <td className="px-3 py-2 text-slate-500">{s.coRequisite || "—"}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan={13} className="py-8 text-center text-slate-400 text-sm">
              No subjects added yet for this semester.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/* ── NumGroup: 3-col Lec/Lab/Total inputs ── */
const NumGroup = ({ label, value, onChange }) => (
  <div>
    <p className={labelCls}>{label}</p>
    <div className="grid grid-cols-3 gap-2">
      {["lec", "lab", "total"].map(k => (
        <div key={k}>
          <p className="text-[9px] text-center text-slate-400 mb-0.5 uppercase">{k}</p>
          <input
            type="number" min="0"
            value={value[k]}
            onChange={e => onChange({ ...value, [k]: e.target.value })}
            placeholder="0"
            className={numCls}
          />
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
const AdminAddDashboard = () => {
  const [activeYear, setActiveYear] = useState("1st");
  const [activeSem, setActiveSem] = useState(null);      // null = not viewing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalYear, setModalYear] = useState("1st");
  const [modalSem, setModalSem] = useState("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [units, setUnits] = useState({ lec: "", lab: "", total: "" });
  const [hoursPerWeek, setHoursPerWeek] = useState({ lec: "", lab: "", total: "" });
  const [hoursPerSemester, setHoursPerSemester] = useState({ lec: "", lab: "", total: "" });
  const [preRequisite, setPreRequisite] = useState("");
  const [coRequisite, setCoRequisite] = useState("");

  // Subjects state
  const [subjects, setSubjects] = useState(
    Object.fromEntries(YEARS.map(y => [y, { "1st": [], "2nd": [] }]))
  );
  const [loadedKeys, setLoadedKeys] = useState(new Set());

  /* fetch */
  const fetchSubjects = async (level, sem) => {
    const key = `${level}-${sem}`;
    if (loadedKeys.has(key)) return;
    const ref = collection(db, "subjects", `${level}Year`, sem === "1st" ? "firstSemester" : "secondSemester");
    const snap = await getDocs(ref);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setSubjects(prev => ({ ...prev, [level]: { ...prev[level], [sem]: data } }));
    setLoadedKeys(prev => new Set([...prev, key]));
  };

  /* view */
  const handleView = async (level, sem) => {
    await fetchSubjects(level, sem);
    setActiveSem(sem);
  };

  /* open modal */
  const openAddModal = (level) => {
    setModalYear(level);
    setModalSem("");
    resetForm();
    setIsModalOpen(true);
  };

  /* save subject */
  const handleSaveSubject = async () => {
    if (!courseCode || !courseTitle || !modalSem) {
      alert("Please fill in all required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const ref = collection(db, "subjects", `${modalYear}Year`, modalSem === "1st" ? "firstSemester" : "secondSemester");
      await addDoc(ref, {
        courseCode, courseTitle,
        units: { lec: Number(units.lec), lab: Number(units.lab), total: Number(units.total) },
        hoursPerWeek: { lec: Number(hoursPerWeek.lec), lab: Number(hoursPerWeek.lab), total: Number(hoursPerWeek.total) },
        hoursPerSemester: { lec: Number(hoursPerSemester.lec), lab: Number(hoursPerSemester.lab), total: Number(hoursPerSemester.total) },
        preRequisite, coRequisite,
      });
      // Invalidate cache so next view re-fetches
      setLoadedKeys(prev => { const n = new Set(prev); n.delete(`${modalYear}-${modalSem}`); return n; });
      setIsModalOpen(false);
      setIsSuccessOpen(true);
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to add subject. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCourseCode(""); setCourseTitle("");
    setUnits({ lec: "", lab: "", total: "" });
    setHoursPerWeek({ lec: "", lab: "", total: "" });
    setHoursPerSemester({ lec: "", lab: "", total: "" });
    setPreRequisite(""); setCoRequisite("");
  };

  /* print */
  const handlePrint = async () => {
    const tableId = `table-${activeYear}-${activeSem}`;
    const el = document.getElementById(tableId);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation, unit: "mm", format: paperSize.toLowerCase() });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(bpsuLogo, "PNG", 10, 10, 30, 20);
    pdf.setFontSize(8);
    pdf.text("BATAAN PENINSULA STATE UNIVERSITY", 45, 15);
    pdf.text("City of Balanga 2100 Bataan, PHILIPPINES", 45, 20);
    const ar = canvas.width / canvas.height;
    let w = pageW - 20, h = w / ar;
    if (h > pageH - 50) { h = pageH - 50; w = h * ar; }
    pdf.addImage(imgData, "PNG", 10, 42, w, h);
    pdf.save(`curriculum-${activeYear}Y-${activeSem}sem.pdf`);
    setIsPrintOpen(false);
  };

  const colors = YEAR_COLORS[activeYear];

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Curriculum Management</h1>
          <p className="text-sm text-slate-500 mt-1">Add subjects and view the curriculum for each year level.</p>
        </div>
        <button
          onClick={() => setIsPrintOpen(true)}
          disabled={!activeSem}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <HiOutlinePrinter /> Print Table
        </button>
      </div>

      {/* ── Year-Level Tabs ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {YEARS.map(y => {
          const c = YEAR_COLORS[y];
          const isActive = activeYear === y;
          return (
            <button
              key={y}
              onClick={() => { setActiveYear(y); setActiveSem(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150
                ${isActive
                  ? `${c.bg} text-white border-transparent shadow-sm`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
            >
              <HiOutlineAcademicCap className={isActive ? "text-white" : "text-slate-400"} />
              {y} Year
            </button>
          );
        })}
      </div>

      {/* ── Year Panel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">

        {/* Panel header */}
        <div className={`px-6 py-4 flex items-center justify-between ${colors.bg}`}>
          <div>
            <h2 className="font-bold text-white text-lg">{activeYear} Year</h2>
            <p className="text-white/70 text-xs mt-0.5">Select a semester to view subjects · Click "+" to add new</p>
          </div>
          <button
            onClick={() => openAddModal(activeYear)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <HiOutlinePlus /> Add Subject
          </button>
        </div>

        {/* Semester selector */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          {SEMS.map(sem => (
            <button
              key={sem}
              onClick={() => handleView(activeYear, sem)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                ${activeSem === sem
                  ? `${colors.bg} text-white border-transparent shadow-sm`
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
            >
              <HiOutlineEye className="text-base" />
              {sem === "1st" ? "1st Semester" : "2nd Semester"}
            </button>
          ))}
          {activeSem && (
            <button
              onClick={() => setActiveSem(null)}
              className="ml-auto text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-semibold"
            >
              <HiOutlineX /> Close
            </button>
          )}
        </div>

        {/* Subjects table */}
        {activeSem ? (
          <SubjectTable
            subjects={subjects[activeYear][activeSem]}
            tableId={`table-${activeYear}-${activeSem}`}
          />
        ) : (
          <div className="py-14 text-center">
            <HiOutlineBookOpen className="text-5xl text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Select a semester above to view subjects</p>
          </div>
        )}
      </div>


      {/* ══════════ ADD SUBJECT MODAL ══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Add Subject — {modalYear} Year</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the course details below</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
              {/* Semester picker */}
              {!modalSem ? (
                <div>
                  <p className={labelCls}>Select Semester</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: "1st", label: "1st Semester", emoji: "📖", desc: "Aug – Dec" },
                      { v: "2nd", label: "2nd Semester", emoji: "📗", desc: "Jan – May" },
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setModalSem(opt.v)}
                        className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 bg-white transition-all text-left shadow-sm"
                      >
                        <span className="text-2xl mt-0.5">{opt.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-400">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Semester badge */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${YEAR_COLORS[modalYear].chip}`}>
                      {modalSem} Semester
                    </span>
                    <button onClick={() => setModalSem("")} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      <HiOutlineX className="text-xs" /> Change
                    </button>
                  </div>

                  {/* Course info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Course Code *</label>
                      <input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="e.g. IE 101" className={inputCls} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelCls}>Course Title *</label>
                      <input type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="e.g. Engineering Mathematics" className={inputCls} />
                    </div>
                  </div>

                  {/* Numeric groups */}
                  <NumGroup label="Units (Lec / Lab / Total)" value={units} onChange={setUnits} />
                  <NumGroup label="Hours per Week (Lec / Lab / Total)" value={hoursPerWeek} onChange={setHoursPerWeek} />
                  <NumGroup label="Hours per Semester (Lec / Lab / Total)" value={hoursPerSemester} onChange={setHoursPerSemester} />

                  {/* Requisites */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Pre-Requisite</label>
                      <input type="text" value={preRequisite} onChange={e => setPreRequisite(e.target.value)} placeholder="None" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Co-Requisite</label>
                      <input type="text" value={coRequisite} onChange={e => setCoRequisite(e.target.value)} placeholder="None" className={inputCls} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              {modalSem && (
                <button
                  onClick={handleSaveSubject}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : "Save Subject"
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ PRINT OPTIONS MODAL ══════════ */}
      {isPrintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Print Options</h3>
              <button onClick={() => setIsPrintOpen(false)} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Paper size */}
              <div>
                <label className={labelCls}>Paper Size</label>
                <div className="relative">
                  <select value={paperSize} onChange={e => setPaperSize(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition pr-9">
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="letter">Letter</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              {/* Orientation */}
              <div>
                <label className={labelCls}>Orientation</label>
                <div className="relative">
                  <select value={orientation} onChange={e => setOrientation(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition pr-9">
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsPrintOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handlePrint} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <HiOutlinePrinter /> Print PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SUCCESS MODAL ══════════ */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCheckCircle className="text-3xl text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">Subject Added!</h3>
            <p className="text-sm text-slate-500 mb-6">The subject has been added to the curriculum successfully.</p>
            <button onClick={() => setIsSuccessOpen(false)} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">Done</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAddDashboard;
