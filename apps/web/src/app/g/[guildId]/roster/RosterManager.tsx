"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, Clock, ShieldCheck, Download, Users, RefreshCw } from "lucide-react";
import type { AcademicRoster } from "@classync/core";

interface Props {
  guildId: string;
  guildName: string;
  initialAuthEnabled: boolean;
  initialRoster: AcademicRoster[];
  initialClasses: string[];
}

export function RosterManager({
  guildId,
  guildName,
  initialAuthEnabled,
  initialRoster,
  initialClasses,
}: Props) {
  const [authEnabled, setAuthEnabled] = useState(initialAuthEnabled);
  const [roster, setRoster] = useState<AcademicRoster[]>(initialRoster);
  const [classes, setClasses] = useState<string[]>(initialClasses);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TA">("STUDENT");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleToggleAuth() {
    const nextVal = !authEnabled;
    try {
      const res = await fetch("/api/roster", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, authEnabled: nextVal }),
      });
      if (res.ok) {
        setAuthEnabled(nextVal);
        setMessage({
          type: "success",
          text: `Fitur Verifikasi NPM berhasil ${nextVal ? "diaktifkan" : "dinonaktifkan"}. Jalankan /setup di Discord untuk menerapkan channel & role.`,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengubah status verifikasi." });
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, role: "STUDENT" | "TA") {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("guildId", guildId);
    formData.append("file", file);
    formData.append("defaultRole", role);

    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Berhasil import ${data.total} data (${data.added} baru, ${data.updated} diperbarui) diparsing via ${data.parsedBy === "openrouter" ? "LLM OpenRouter" : "Heuristic"}!`,
        });
        // Refresh roster
        const ref = await fetch(`/api/roster?guildId=${guildId}`);
        const refData = await ref.json();
        if (refData.roster) {
          setRoster(refData.roster);
          setClasses(refData.distinctClasses || []);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Gagal memproses file Excel." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan saat mengunggah file." });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function downloadTemplate() {
    const csvContent =
      "NPM,Nama,Kelas,Role\n" +
      "2206123451,Budi Santoso,Kelas A,Mahasiswa\n" +
      "2206123452,Siti Rahmawati,Kelas A,Mahasiswa\n" +
      "2206123453,Ahmad Fauzi,Kelas B,Mahasiswa\n" +
      "2106098765,Kevin Pratama,,TA\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template_roster_${guildName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = roster.filter((item) => {
    if (item.role !== activeTab) return false;
    if (statusFilter === "VERIFIED" && !item.verifiedAt) return false;
    if (statusFilter === "UNVERIFIED" && item.verifiedAt) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.npm.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.className && item.className.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const studentCount = roster.filter((r) => r.role === "STUDENT").length;
  const taCount = roster.filter((r) => r.role === "TA").length;
  const verifiedCount = roster.filter((r) => r.verifiedAt !== null).length;

  return (
    <div className="space-y-8">
      {/* Alert message */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-700 text-emerald-300"
              : "bg-red-950/40 border-red-700 text-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Top Banner: Verification Gate & Discord Setup */}
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900 to-gray-850 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="text-lg font-bold text-white">Gerbang Autentikasi Mahasiswa (NPM Verification)</h2>
          </div>
          <p className="text-sm text-gray-400">
            Jika diaktifkan, bot Discord akan membuat channel <code className="text-indigo-300">#verifikasi</code> dan role <code className="text-indigo-300">@Verified</code>. Mahasiswa hanya dapat mengakses materi & ruang diskusi setelah mencocokkan NPM mereka dengan data di bawah.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={handleToggleAuth}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center gap-2 ${
              authEnabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
            }`}
          >
            {authEnabled ? "✅ Verifikasi Aktif" : "⚪ Verifikasi Non-aktif"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Total Mahasiswa</p>
          <p className="text-2xl font-bold mt-1 text-white">{studentCount}</p>
          <p className="text-xs text-gray-500 mt-1">{classes.length} kelas terdeteksi</p>
        </div>
        <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Asisten Dosen (TA)</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">{taCount}</p>
          <p className="text-xs text-gray-500 mt-1">Dapat mengelola bot & dashboard</p>
        </div>
        <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Terverifikasi</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{verifiedCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {roster.length > 0 ? Math.round((verifiedCount / roster.length) * 100) : 0}% terhubung Discord
          </p>
        </div>
        <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Kelas / Rombel</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{classes.length}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{classes.join(", ") || "Belum ada"}</p>
        </div>
      </div>

      {/* Upload Actions Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-dashed border-gray-700 hover:border-indigo-500/60 bg-gray-900/50 rounded-2xl p-5 transition flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <FileSpreadsheet className="size-4" />
              <span>Import Data Mahasiswa (Excel / CSV)</span>
            </div>
            <p className="text-xs text-gray-400">
              Upload daftar mahasiswa dengan kolom: <b>NPM</b>, <b>Nama</b>, dan <b>Kelas</b> (misal: Kelas A, Kelas B). Parsing dibantu otomatis oleh OpenRouter LLM.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition">
              <Upload className="size-3.5" />
              <span>{uploading ? "Memproses..." : "Pilih File Excel Mahasiswa"}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, "STUDENT")}
              />
            </label>
            <button
              onClick={downloadTemplate}
              className="px-3 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="size-3.5" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        <div className="border border-dashed border-gray-700 hover:border-blue-500/60 bg-gray-900/50 rounded-2xl p-5 transition flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Users className="size-4" />
              <span>Import Data Asisten Dosen / TA (Excel / CSV)</span>
            </div>
            <p className="text-xs text-gray-400">
              Upload daftar TA dengan kolom: <b>NPM</b> dan <b>Nama</b>. Saat TA melakukan verifikasi di Discord, mereka akan otomatis diberi role <b>@Teaching Assistant</b>.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition">
              <Upload className="size-3.5" />
              <span>{uploading ? "Memproses..." : "Pilih File Excel Asdos"}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, "TA")}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="border border-gray-800 bg-gray-900 rounded-2xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("STUDENT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "STUDENT"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              Mahasiswa ({studentCount})
            </button>
            <button
              onClick={() => setActiveTab("TA")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "TA"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              Asdos / TA ({taCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama, NPM, atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "VERIFIED" | "UNVERIFIED")}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="UNVERIFIED">Belum Verifikasi</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-850 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-5 py-3">NPM</th>
                <th className="px-5 py-3">Nama Lengkap</th>
                <th className="px-5 py-3">Kelas / Rombel</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status Verifikasi</th>
                <th className="px-5 py-3">Discord ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    Belum ada data {activeTab === "STUDENT" ? "mahasiswa" : "asdos"} yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-850/50 transition">
                    <td className="px-5 py-3 font-mono font-medium text-white">{item.npm}</td>
                    <td className="px-5 py-3 font-semibold text-gray-100">{item.name}</td>
                    <td className="px-5 py-3">
                      {item.className ? (
                        <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50 font-medium">
                          {item.className}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          item.role === "TA"
                            ? "bg-blue-900/40 text-blue-300 border border-blue-700/50"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {item.role === "TA" ? "Teaching Assistant" : "Mahasiswa"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {item.verifiedAt ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3.5" />
                          <span>Terverifikasi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                          <Clock className="size-3.5" />
                          <span>Belum</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-400">
                      {item.discordUserId ? (
                        <span className="text-gray-300">{item.discordUserId}</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
