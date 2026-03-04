import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  HiOutlineUserGroup,
  HiOutlineDownload,
  HiSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiExclamationCircle
} from 'react-icons/hi';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const UploadStudentMasterlist = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [irregularCount, setIrregularCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "users");
        const q = query(studentsRef, where("role", "==", "Student"));
        const querySnapshot = await getDocs(q);

        const fetchedStudents = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const updatedStudents = await Promise.all(
          fetchedStudents.map(async (student) => {
            let yearsRemaining = 0;
            if (student.irregularityReason === "Shifter") {
              yearsRemaining = 6;
            } else if (student.irregularityReason === "Failed Subjects") {
              yearsRemaining = 5;
            }

            if (student.yearsRemaining !== yearsRemaining) {
              const studentDocRef = doc(db, "users", student.id);
              await updateDoc(studentDocRef, { yearsRemaining });
            }

            return { ...student, yearsRemaining };
          })
        );

        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Update filtered list when search or filter changes
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = students.filter((student) => {
      const matchesSearch =
        (student.studentId?.toLowerCase() || "").includes(lowerSearch) ||
        (student.firstName?.toLowerCase() || "").includes(lowerSearch) ||
        (student.lastName?.toLowerCase() || "").includes(lowerSearch);

      const matchesFilter =
        filter === "all" || student.irregularityReason === filter;

      return matchesSearch && matchesFilter;
    });

    setFilteredStudents(filtered);

    // update irregular count
    if (filter === "all") {
      setIrregularCount(students.filter(s => s.irregularityReason).length);
    } else {
      setIrregularCount(filtered.filter(s => s.irregularityReason).length);
    }
  }, [searchTerm, filter, students]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest(".filter-dropdown")) return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex items-center justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Analyze Residency
          </h1>
          <p className="text-slate-500 mt-1 max-w-lg text-sm md:text-base">
            Review and track student classifications, manage irregular student data, and generate export reports.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <HiOutlineUserGroup className="text-lg" />
            {showTable ? "Hide Students" : "View Students"}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <HiOutlineDownload className="text-lg" />
            Export Data
          </button>
        </div>
      </div>

      {/* ─── Table Section ─── */}
      {showTable && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">

          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">

            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Student Database</h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                Irregular: {irregularCount}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all w-full md:w-64"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative filter-dropdown">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <HiOutlineFilter className="text-slate-400 text-lg" />
                  <span className="max-w-[100px] truncate">
                    {filter === 'all' ? 'All Roles' : filter}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 overflow-hidden animate-fade-in-up">
                    {['all', 'Shifter', 'Failed Subjects'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setFilter(cat); setDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filter === cat ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {cat === 'all' ? 'Show All' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mb-4" />
                Loading student records...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <HiOutlineUserGroup className="text-4xl text-slate-300 mx-auto mb-3" />
                <p>No students found matching your search.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-5 py-4 w-14 text-center">Profile</th>
                    <th className="px-5 py-4">Student Info</th>
                    <th className="px-5 py-4 hidden md:table-cell">Contact & Address</th>
                    <th className="px-5 py-4 text-center">Academic Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">

                      {/* Avatar */}
                      <td className="px-5 py-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden mx-auto border border-slate-200">
                          {student.profilePicture ? (
                            <img src={student.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-teal-100 text-teal-700 font-bold text-sm">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Info */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 text-sm">
                          {student.firstName} {student.middleName ? student.middleName[0] + '.' : ''} {student.lastName}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{student.studentId}</span>
                          • {student.email}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="text-slate-700 text-sm">{student.contactNumber || '—'}</div>
                        <div className="text-slate-500 text-xs truncate max-w-[200px]" title={student.address}>
                          {student.address || '—'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        {student.irregularityReason ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-amber-200">
                              {student.irregularityReason}
                            </span>
                            <span className="text-slate-400 text-[10px] mt-1 capitalize font-medium">
                              {student.yearsRemaining} year(s) rem.
                            </span>
                          </div>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                            Regular
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Table Footer */}
            {filteredStudents.length > 0 && (
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {filteredStudents.length} records</span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── Coming Soon Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto text-center outline-none"
        overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 transition-opacity"
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <HiOutlineX className="text-xl" />
        </button>

        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <HiExclamationCircle className="text-3xl text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Feature Coming Soon</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          We're working on the export functionality. You'll soon be able to download the complete residency analysis as a CSV or Excel file.
        </p>

        <button
          onClick={() => setIsModalOpen(false)}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          Got it
        </button>
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default UploadStudentMasterlist;
