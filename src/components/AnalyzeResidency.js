import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import {
    HiOutlineAcademicCap,
    HiOutlineUser,
    HiOutlineBookOpen,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineChevronRight,
    HiOutlineX,
    HiOutlineCalendar,
    HiOutlineClipboardList,
} from 'react-icons/hi';

/* ── year-level config ── */
const YEAR_CONFIG = [
    { label: '1st Year', short: 'Y1', color: 'bg-indigo-500' },
    { label: '2nd Year', short: 'Y2', color: 'bg-violet-500' },
    { label: '3rd Year', short: 'Y3', color: 'bg-purple-500' },
    { label: '4th Year', short: 'Y4', color: 'bg-fuchsia-500' },
];

const YEAR_ORDER = ['1st year', '2nd year', '3rd year', '4th year'];

function getRemainingYears(yearLevel) {
    const idx = YEAR_ORDER.findIndex(
        (y) => y.toLowerCase() === (yearLevel || '').toLowerCase()
    );
    if (idx === -1) return null;
    return YEAR_ORDER.length - 1 - idx; // e.g. 3rd year → 1 remaining
}

function getProgressPct(yearLevel) {
    const idx = YEAR_ORDER.findIndex(
        (y) => y.toLowerCase() === (yearLevel || '').toLowerCase()
    );
    if (idx === -1) return 0;
    // 1st=25%, 2nd=50%, 3rd=75%, 4th=100%
    return ((idx + 1) / YEAR_ORDER.length) * 100;
}

/* ── stat card ── */
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4`}>
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
            <Icon className="text-xl text-white" />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const AnalyzeResidency = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) { setLoading(false); return; }
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) setUserData(snap.data());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        });
        return unsub;
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Loading residency data...</p>
                </div>
            </div>
        );
    }

    const yearLevel = userData?.yearLevel || '';
    const firstName = userData?.firstName || 'Student';
    const lastName = userData?.lastName || '';
    const program = userData?.program || 'N/A';
    const studentId = userData?.studentId || '—';
    const profilePic = userData?.profilePicture || '';
    const remainingYears = getRemainingYears(yearLevel);
    const progressPct = getProgressPct(yearLevel);
    const currentYearIdx = YEAR_ORDER.findIndex(
        (y) => y.toLowerCase() === yearLevel.toLowerCase()
    );

    const getInitials = () =>
        ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'ST';

    return (
        <div className="max-w-4xl mx-auto">

            {/* ── Page Header ── */}
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-slate-800">Analyze Residency</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Track your academic progress and remaining time to graduation.
                </p>
            </div>

            {/* ── Profile + Progress Hero Card ── */}
            <div
                className="rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #6d28d9 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {profilePic ? (
                            <img src={profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20 shadow-xl" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-300 to-indigo-400 flex items-center justify-center ring-4 ring-white/20 shadow-xl">
                                <span className="text-2xl font-bold text-white">{getInitials()}</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xl font-bold text-white leading-tight">{firstName} {lastName}</p>
                        <p className="text-violet-200 text-sm mt-0.5">{program}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                <HiOutlineAcademicCap className="text-sm" /> {yearLevel || 'Year not set'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                <HiOutlineClipboardList className="text-sm" /> ID: {studentId}
                            </span>
                        </div>
                    </div>

                    {/* View detail button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        View Residency Details
                        <HiOutlineChevronRight />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="relative mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-violet-200 uppercase tracking-widest">Academic Progress</p>
                        <p className="text-xs font-bold text-white">{Math.round(progressPct)}% Complete</p>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-300 to-fuchsia-400 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <StatCard
                    icon={HiOutlineCalendar}
                    label="Current Year"
                    value={yearLevel || '—'}
                    sub="Active academic year"
                    accent="bg-violet-500"
                />
                <StatCard
                    icon={HiOutlineClock}
                    label="Years Remaining"
                    value={remainingYears !== null ? `${remainingYears} Year${remainingYears !== 1 ? 's' : ''}` : '—'}
                    sub={remainingYears === 0 ? '🎓 Final year!' : 'Until graduation'}
                    accent={remainingYears === 0 ? 'bg-teal-500' : 'bg-indigo-500'}
                />
                <StatCard
                    icon={HiOutlineBookOpen}
                    label="Program"
                    value={program !== 'N/A' ? program : '—'}
                    sub="Enrolled curriculum"
                    accent="bg-fuchsia-500"
                />
            </div>

            {/* ── Year Timeline ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                    <HiOutlineAcademicCap className="text-violet-500 text-base" />
                    Academic Year Timeline
                </h3>

                <div className="relative">
                    {/* Connector line */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200" style={{ marginLeft: '2.25rem', marginRight: '2.25rem' }} />

                    <div className="flex items-start justify-between relative z-10">
                        {YEAR_CONFIG.map((yr, idx) => {
                            const isDone = idx < currentYearIdx;
                            const isCurrent = idx === currentYearIdx;
                            const isPending = idx > currentYearIdx;

                            return (
                                <div key={idx} className="flex flex-col items-center flex-1">
                                    {/* Circle */}
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm mb-3 transition-all
                      ${isDone ? 'bg-teal-500 text-white ring-4 ring-teal-100' : ''}
                      ${isCurrent ? `${yr.color} text-white ring-4 ring-violet-100 scale-110` : ''}
                      ${isPending ? 'bg-slate-100 text-slate-400 border-2 border-slate-200' : ''}
                    `}
                                    >
                                        {isDone ? <HiOutlineCheckCircle className="text-lg" /> : yr.short}
                                    </div>

                                    {/* Label */}
                                    <p className={`text-xs font-semibold text-center ${isCurrent ? 'text-violet-700' : isDone ? 'text-teal-600' : 'text-slate-400'}`}>
                                        {yr.label}
                                    </p>

                                    {/* Badge */}
                                    {isCurrent && (
                                        <span className="mt-1 inline-block bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Current
                                        </span>
                                    )}
                                    {isDone && (
                                        <span className="mt-1 inline-block bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Done
                                        </span>
                                    )}
                                    {isPending && (
                                        <span className="mt-1 inline-block bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Upcoming
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {remainingYears === 0 && (
                    <div className="mt-6 flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                        <span className="text-2xl">🎓</span>
                        <div>
                            <p className="text-sm font-semibold text-teal-800">Congratulations! You're in your final year.</p>
                            <p className="text-xs text-teal-600 mt-0.5">Keep going — graduation is just around the corner!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ════════ RESIDENCY DETAIL MODAL ════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                        {/* Modal header */}
                        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg">Residency Details</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <HiOutlineX className="text-xl" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-7 py-6">
                            {/* Profile row */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-16 h-16 rounded-full object-cover ring-4 ring-violet-100 flex-shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0 ring-4 ring-violet-100">
                                        <span className="text-xl font-bold text-white">{getInitials()}</span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-slate-800 text-base">{firstName} {lastName}</p>
                                    <p className="text-sm text-slate-500">{program}</p>
                                    <span className="inline-flex items-center gap-1 mt-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-100">
                                        <HiOutlineAcademicCap className="text-sm" /> {yearLevel || 'Year not set'}
                                    </span>
                                </div>
                            </div>

                            {/* Detail rows */}
                            {[
                                { label: 'Student ID', value: studentId, icon: HiOutlineClipboardList },
                                { label: 'Program', value: program, icon: HiOutlineBookOpen },
                                { label: 'Year Level', value: yearLevel || '—', icon: HiOutlineCalendar },
                                {
                                    label: 'Years Remaining',
                                    value: remainingYears !== null ? `${remainingYears} year${remainingYears !== 1 ? 's' : ''} until graduation` : '—',
                                    icon: HiOutlineClock,
                                    highlight: remainingYears === 0,
                                },
                            ].map((row) => {
                                const Icon = row.icon;
                                return (
                                    <div key={row.label} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <Icon className="text-slate-500 text-base" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-400 font-medium">{row.label}</p>
                                            <p className={`text-sm font-semibold mt-0.5 ${row.highlight ? 'text-teal-600' : 'text-slate-800'}`}>
                                                {row.value}
                                                {row.highlight && ' 🎓'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Progress in modal */}
                            <div className="mt-5">
                                <div className="flex justify-between mb-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</p>
                                    <p className="text-xs font-bold text-violet-600">{Math.round(progressPct)}%</p>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-7 pb-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AnalyzeResidency;
