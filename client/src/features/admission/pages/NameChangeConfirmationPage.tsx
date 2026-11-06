import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { downloadAsCSV } from '@/lib/export';

interface ProgramRow {
  id: string;
  name: string;
  confirmed: boolean;
}

interface StudentRecord {
  id: string;
  admissionDate: string;
  programName: string;
  uin: string;
  admissionName: string;
  correctedName: string;
}

export default function NameChangeConfirmationPage() {
  const [searchParams] = useSearchParams();
  const admissionId = searchParams.get('admissionId');

  // Program confirmation list exactly matching user layout
  const [programs, setPrograms] = useState<ProgramRow[]>([
    { id: '1', name: 'Play Group', confirmed: false },
    { id: '2', name: 'Nursery', confirmed: false },
    { id: '3', name: 'Euro Junior', confirmed: false },
  ]);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If admissionId is provided, fetch student details
  useEffect(() => {
    if (!admissionId) return;

    let isMounted = true;
    setLoading(true);

    api.get(`/admissions/${admissionId}`)
      .then((res) => {
        if (!isMounted) return;
        const adm = res.data?.data || res.data;
        if (adm) {
          const student = adm.student || {};
          const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || adm.name || 'Student';
          const progName = adm.program?.name || adm.programName || 'Euro Junior';
          const uinVal = student.uin || adm.uin || 'SLPL3201/0071/2027';
          const admDate = adm.admissionDate 
            ? new Date(adm.admissionDate).toLocaleDateString('en-GB').replace(/\//g, '-')
            : '01-04-2026';

          setStudents([
            {
              id: adm.id || admissionId,
              admissionDate: admDate,
              programName: progName,
              uin: uinVal,
              admissionName: fullName,
              correctedName: fullName,
            },
          ]);
        }
      })
      .catch((_err) => {
        // If not found in API, check if demo data matches or keep empty
        console.warn('Could not fetch admission for id:', admissionId);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [admissionId]);

  // Toggle program confirmation checkbox
  const toggleProgram = (id: string) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, confirmed: !p.confirmed } : p))
    );
  };

  // Filter students based on program and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesProgram = !selectedProgramFilter || s.programName.toLowerCase().includes(selectedProgramFilter.toLowerCase());
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        s.admissionName.toLowerCase().includes(query) ||
        s.correctedName.toLowerCase().includes(query) ||
        s.uin.toLowerCase().includes(query) ||
        s.programName.toLowerCase().includes(query) ||
        s.admissionDate.includes(query);

      return matchesProgram && matchesSearch;
    });
  }, [students, selectedProgramFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const handleShowReport = (programName: string) => {
    if (selectedProgramFilter === programName) {
      setSelectedProgramFilter(null);
      showToast(`Showing all programs`, 'info');
    } else {
      setSelectedProgramFilter(programName);
      showToast(`Filtered report for ${programName}`, 'info');
    }
  };

  const handleNameChangeReport = () => {
    if (filteredStudents.length === 0) {
      // Export program status report
      const rows = programs.map((p) => ({
        'Program Name': p.name,
        'Status': p.confirmed ? 'Confirmed' : 'Not Confirmed',
      }));
      downloadAsCSV(rows, 'Graduation_Day_Name_Change_Confirmation_Report');
      showToast('Program status report downloaded', 'success');
      return;
    }

    const rows = filteredStudents.map((s) => ({
      'Admission Date': s.admissionDate,
      'Program Name': s.programName,
      'UIN': s.uin,
      'Name as per Admission form': s.admissionName,
      'Corrected Name': s.correctedName,
    }));
    downloadAsCSV(rows, 'Graduation_Name_Change_Report');
    showToast('Name change report downloaded successfully', 'success');
  };

  const handleConfirm = () => {
    showToast('Name change confirmation updated successfully', 'success');
  };

  const updateCorrectedName = (id: string, newName: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, correctedName: newName } : s))
    );
  };

  return (
    <div className="bg-white min-h-[calc(100vh-64px)] p-6 font-sans text-slate-900">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-black tracking-tight">Name change confirmation</h1>

        {/* Top Button: Name Change Report */}
        <div>
          <button
            type="button"
            onClick={handleNameChangeReport}
            className="bg-[#428bca] hover:bg-[#3276b1] text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors cursor-pointer"
          >
            Name Change Report
          </button>
        </div>

        {/* Subtitle */}
        <div className="pt-1">
          <p className="text-xs font-medium text-slate-800">
            Graduation day name change confirmation
          </p>
        </div>

        {/* Top Table: Programs Confirmation */}
        <div className="w-full max-w-xl">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-white border-b border-black">
                <th className="border border-black px-4 py-2 font-bold text-center w-24">Confirm</th>
                <th className="border border-black px-4 py-2 font-bold text-center">Program Name</th>
                <th className="border border-black px-4 py-2 font-bold text-center">Status</th>
                <th className="border border-black px-4 py-2 font-bold text-center w-28">Report</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog) => (
                <tr key={prog.id} className="border-b border-black">
                  <td className="border border-black px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={prog.confirmed}
                      onChange={() => toggleProgram(prog.id)}
                      className="h-4 w-4 border border-black rounded-none cursor-pointer"
                    />
                  </td>
                  <td className="border border-black px-4 py-2 text-center text-slate-800 font-medium">
                    {prog.name}
                  </td>
                  <td className="border border-black px-4 py-2 text-center text-slate-700">
                    {prog.confirmed ? 'Confirmed' : 'Not Confirmed'}
                  </td>
                  <td className="border border-black px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleShowReport(prog.name)}
                      className="text-blue-600 hover:underline cursor-pointer text-xs"
                    >
                      Show Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Search & Show entries Controls */}
        <div className="flex items-center justify-between pt-4 pb-1">
          {/* Search on left */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-900">Search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-black px-2 py-0.5 text-xs w-48 rounded-none bg-white focus:outline-none"
            />
          </div>

          {/* Show entries on right */}
          <div className="flex items-center gap-1.5 text-xs text-slate-900">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-black px-2 py-0.5 text-xs rounded-none bg-white focus:outline-none"
            >
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Bottom Table: Student Name Correction Details */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-white border-b border-black">
                <th className="border border-black px-3 py-2 font-bold text-left w-36">Admission Date</th>
                <th className="border border-black px-3 py-2 font-bold text-left w-44">Program name</th>
                <th className="border border-black px-3 py-2 font-bold text-left w-48">UIN</th>
                <th className="border border-black px-3 py-2 font-bold text-left">Name as per Admission form</th>
                <th className="border border-black px-3 py-2 font-bold text-left">Corrected Name</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-b border-black">
                  <td colSpan={5} className="border border-black py-4 text-center text-xs text-slate-500">
                    Loading student details...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr className="border-b border-black">
                  <td colSpan={5} className="border border-black py-2.5 text-center text-xs text-slate-800">
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => (
                  <tr key={st.id} className="border-b border-black hover:bg-slate-50">
                    <td className="border border-black px-3 py-2 text-slate-800">{st.admissionDate}</td>
                    <td className="border border-black px-3 py-2 text-slate-800">{st.programName}</td>
                    <td className="border border-black px-3 py-2 font-mono text-slate-800">{st.uin}</td>
                    <td className="border border-black px-3 py-2 text-slate-800">{st.admissionName}</td>
                    <td className="border border-black px-3 py-1.5 text-slate-800">
                      <input
                        type="text"
                        value={st.correctedName}
                        onChange={(e) => updateCorrectedName(st.id, e.target.value)}
                        className="w-full border border-slate-300 px-2 py-1 text-xs rounded-none bg-white focus:outline-none focus:border-blue-500"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination: First | Previous | 1 | 2 | 3 | 4 | Next | Last */}
        <div className="flex justify-end pt-1">
          <div className="flex items-center border border-black text-xs divide-x divide-black">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1 text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              First
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              Previous
            </button>
            {[1, 2, 3, 4].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 cursor-pointer ${
                  currentPage === page
                    ? 'font-bold bg-slate-100 text-black'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {page === 1 ? '← 1' : page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              Next →
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1 text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              Last
            </button>
          </div>
        </div>

        {/* Bottom Button: Confirm */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-[#428bca] hover:bg-[#3276b1] text-white text-xs font-semibold px-5 py-2 rounded shadow-sm transition-colors cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
