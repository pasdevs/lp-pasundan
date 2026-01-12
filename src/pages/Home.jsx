import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Info, ShieldCheck, Sparkles, MessageCircle } from "lucide-react";
import Swal from "sweetalert2";

const apiUrl = import.meta.env.VITE_API_LEAD_URL

const CONFIG = {
  brand: {
    org: "UNIVERSITAS PASUNDAN",
    title: "Buku Tamu Digital Kunjungan Sekolah",
    subtitle:
      "Isi singkat untuk dapat info jalur masuk, beasiswa, dan konsultasi prodi UNPAS. (± 1 menit)",
  },
  submission: {
    mode: "fetch",
    endpoint: apiUrl,
    method: "POST",
  },
  options: {
    kelas: ["XII", "XI"],
    rencana: ["Masuk 2026", "Masih mempertimbangkan", "Ingin info beasiswa dulu"],
    minatBidang: [
      {
        key: "FH",
        title: "Fakultas Hukum",
        desc: "Ilmu Hukum",
        bg: "bg-[#D32F2F]",
        text: "text-white",
        descColor: "text-white",
      },
      {
        key: "FISIP",
        title: "Fakultas Ilmu Sosial dan Ilmu Politik",
        desc: "Administrasi Publik, Ilmu Kesejahteraan Sosial, Ilmu Hubungan Internasional, Ilmu Administrasi Bisnis, Ilmu Komunikasi.",
        bg: "bg-[#003366]",
        text: "text-white",
        descColor: "text-white",
      },
      {
        key: "FT",
        title: "Fakultas Teknik",
        desc: "Teknik Industri, Teknologi Pangan, Teknik Mesin, Teknik Informatika, Teknik Lingkungan, Perencanaan Wilayah dan Kota.",
        bg: "bg-[#FF652F]",
        text: "text-white",
        descColor: "text-white",
      },
      {
        key: "FEB",
        title: "Fakultas Ekonomi dan Bisnis",
        desc: "Manajemen, Akuntansi, Ekonomi Pembangunan, Bisnis Digital.",
        bg: "bg-[#FFEB3B]",
        text: "text-black",
        descColor: "text-black",
      },
      {
        key: "FKIP",
        title: "Fakultas Keguruan dan Ilmu Pendidikan",
        desc: "Pendidikan Pancasila dan Kewarganegaraan, Pendidikan Ekonomi, Pendidikan Bahasa dan Sastra Indonesia, Pendidikan Biologi, Pendidikan Matematika, Pendidikan Guru Sekolah Dasar.",
        bg: "bg-[#028A0F]",
        text: "text-white",
        descColor: "text-white",
      },
      {
        key: "FISS",
        title: "Fakultas Ilmu Seni dan Sastra",
        desc: "Desain Komunikasi Visual, Fotografi, Seni Musik, Sastra Inggris.",
        bg: "bg-[#43296C]",
        text: "text-white",
        descColor: "text-white",
      },
      {
        key: "FK",
        title: "Fakultas Kedokteran",
        desc: "Kedokteran",
        bg: "bg-[#005005]",
        text: "text-white",
        descColor: "text-white",
      },
      {
        key: "belum_tahu",
        title: "Belum tahu",
        desc: "Minta arahan prodi yang cocok.",
        bg: "bg-neutral-700",
        text: "text-white",
        descColor: "text-white",
      },
    ],
    ketertarikan: [
      { key: "pmdk", label: "Jalur tanpa tes (PMDK)" },
      { key: "usm", label: "Jalur tes cepat" },
      { key: "beasiswa", label: "Beasiswa / potongan" },
      { key: "voucher", label: "Potongan biaya pendaftaran" },
      { key: "konsultasi", label: "Konsultasi via WhatsApp" },
    ],
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function parseQuery(search) {
  const params = new URLSearchParams(search);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function onlyDigits(s) {
  return (s || "").replace(/\D+/g, "");
}

function isValidWA(s) {
  const d = onlyDigits(s);
  // Indonesia: biasanya 08xxxxxxxxxx atau 628xxxxxxxxxx
  if (d.startsWith("08") && d.length >= 10 && d.length <= 13) return true;
  if (d.startsWith("628") && d.length >= 11 && d.length <= 14) return true;
  return false;
}

function normalizeWA(s) {
  const d = onlyDigits(s);
  if (d.startsWith("08")) return "62" + d.slice(1);
  return d;
}

function Field({ label, hint, children, error, id }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-neutral-900">{label}</label>
        {hint ? (
          <span className="text-xs text-neutral-500">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Pill({ selected, title, desc, bg, text, descColor, onClick, }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-4 transition cursor-pointer",
        "hover:shadow-sm active:scale-[0.99]",
        selected
          ? cn("border-transparent", bg, text)
          : "border-neutral-200 bg-white text-neutral-900"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className={cn("text-sm", selected ? descColor : "text-neutral-600")}>
            {desc}
          </div>
        </div>
        <ChevronRight className={cn("h-5 w-5", selected ? "text-white" : "text-neutral-400")} />
      </div>
    </button>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
      {children}
    </span>
  );
}

function StepDot({ active }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        active ? "bg-neutral-900" : "bg-neutral-300"
      )}
    />
  );
}

export default function MiniLandingPageQRBukuTamuUNPAS() {
  const qp = useMemo(() => {
    if (typeof window === "undefined") return {};
    return parseQuery(window.location.search);
  }, []);

  // Auto-tag dari QR link
  const tags = useMemo(() => {
    const school = qp.school || qp.sekolah || "";
    const campaign = qp.campaign || "SchoolVisit";
    const wave = qp.wave || "";
    const source = qp.source || qp.src || "QR";

    return {
      school,
      campaign,
      wave,
      source,
      utm_source: qp.utm_source || source,
      utm_campaign: qp.utm_campaign || campaign,
      utm_medium: qp.utm_medium || "offline",
      ref: qp.ref || "",
    };
  }, [qp]);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    sekolah: tags.school || "",
    kelas: "XII",
    wa: "",
    minatBidang: "",
    rencana: "Masuk 2026",
    ketertarikan: [],
    izinFollowUp: true,
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: "Data singkat" },
    { id: 2, title: "Minat kamu" },
    { id: 3, title: "Preferensi" },
  ];

  const progress = (step / steps.length) * 100;

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function toggleKetertarikan(key) {
    setForm((p) => {
      const exists = p.ketertarikan.includes(key);
      const next = exists
        ? p.ketertarikan.filter((x) => x !== key)
        : [...p.ketertarikan, key];
      return { ...p, ketertarikan: next };
    });

    // ✅ Clear error saat user mulai memilih
    setErrors((p) => ({ ...p, ketertarikan: undefined }))
  }

  function validateCurrentStep() {
    const e = {};
    if (step === 1) {
      if (!form.nama.trim()) e.nama = "Nama wajib diisi.";
      if (!form.sekolah.trim()) e.sekolah = "Nama sekolah wajib diisi.";
      if (!isValidWA(form.wa)) e.wa = "Nomor WA tidak valid (contoh: 08xxxx atau 628xxxx).";
    }
    if (step === 2) {
      if (!form.minatBidang) e.minatBidang = "Pilih salah satu minat bidang.";
    }
    if (step === 3) {
      if (!form.izinFollowUp) e.izinFollowUp = "Agar bisa ditindaklanjuti, izinkan kami menghubungi via WhatsApp.";
      if (!form.ketertarikan.length) e.ketertarikan = "Pilih minimal satu.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    // Validasi semua step sebelum submit
    const savedStep = step;
    for (let s = 1; s <= 3; s++) {
      setStep(s);
      // eslint-disable-next-line no-await-in-loop
      const ok = await new Promise((resolve) => {
        setTimeout(() => resolve(true), 0);
      });
      if (!ok) return;
    }
    setStep(savedStep);

    // Validasi final
    const e = {};
    if (!form.nama.trim()) e.nama = "Nama wajib diisi.";
    if (!form.sekolah.trim()) e.sekolah = "Nama sekolah wajib diisi.";
    if (!isValidWA(form.wa)) e.wa = "Nomor WA tidak valid.";
    if (!form.minatBidang) e.minatBidang = "Pilih minat bidang.";
    if (!form.ketertarikan.length) e.ketertarikan = "Pilih minimal satu.";
    if (!form.izinFollowUp) e.izinFollowUp = "Izin follow-up wajib.";

    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      nama: form.nama,
      sekolah: form.sekolah,
      kelas: form.kelas,
      wa: form.wa,
      wa_normalized: normalizeWA(form.wa),
      minatBidang: form.minatBidang, // <- ISI KEY: "FH", "FT", "belum_tahu"
      rencana: form.rencana,
      ketertarikan: form.ketertarikan, // array
    };
    // console.log("PAYLOAD KIRIM:", payload);

    try {
      setIsSubmitting(true);

      const res = await fetch(CONFIG.submission.endpoint, {
        method: CONFIG.submission.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.success !== true) {
        throw new Error(json.message || "Gagal kirim ke server");
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: json.message || "Data berhasil dikirim",
        confirmButtonText: "OK",
        confirmButtonColor: "#7F6B5D",
      });

      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Maaf, submit gagal. Coba ulangi ya.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStep((p) => Math.min(3, p + 1));
  }

  function prevStep() {
    setStep((p) => Math.max(1, p - 1));
  }

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-md px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-7 w-7" />
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Terima kasih!</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Data kamu sudah tercatat. Tim resmi PMB UNPAS akan follow-up via WhatsApp.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <div className="font-medium">Ringkasan</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-neutral-200">
                    <div className="text-neutral-500">Nama</div>
                    <div className="font-medium text-neutral-900">{form.nama || "-"}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-neutral-200">
                    <div className="text-neutral-500">Minat</div>
                    <div className="font-medium text-neutral-900">{CONFIG.options.minatBidang.find((x) => x.key === form.minatBidang)?.title || "-"}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-neutral-200">
                    <div className="text-neutral-500">Sekolah</div>
                    <div className="font-medium text-neutral-900">{form.sekolah || "-"}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-neutral-200">
                    <div className="text-neutral-500">Kelas</div>
                    <div className="font-medium text-neutral-900">{form.kelas || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                  <Sparkles className="h-4 w-4" />
                  Mau konsultasi sekarang?
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  Kalau kamu mau, tim kami bisa bantu rekomendasi prodi & jalur masuk yang paling cocok.
                </p>
                <a
                  href="https://wa.me/62811960193"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat Admin PMB</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
                {/* <p className="mt-2 text-xs text-neutral-500">
                  Pastikan menggunakan nomor resmi PMB UNPAS.
                </p> */}
              </div>

              <button
                type="button"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 cursor-pointer"
                onClick={() => {
                  setDone(false);
                  setStep(1);
                  setForm((p) => ({
                    ...p,
                    nama: "",
                    wa: "",
                    minatBidang: "",
                    ketertarikan: [],
                  }));
                }}
              >
                Isi untuk teman lain
              </button>
            </div>
          </motion.div>

          <div className="mt-6 text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} {CONFIG.brand.org}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-md px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge>
                <ShieldCheck className="h-4 w-4" /> Resmi UNPAS
              </Badge>
              <Badge>
                <Info className="h-4 w-4" /> ± 1 menit
              </Badge>
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              {/* Logo UNPAS */}
              <img
                src="/lp-pasundan/logo_unpas.png"
                alt="Logo UNPAS"
                className="h-16 w-auto"
              />

              {/* Judul */}
              <h1 className="text-xl font-semibold text-neutral-900">
                {CONFIG.brand.title}
              </h1>

              {/* Subjudul */}
              <p className="text-sm text-neutral-600">
                {CONFIG.brand.subtitle}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div>
                  Langkah {step} dari {steps.length}
                </div>
                <div className="flex items-center gap-2">
                  {steps.map((s) => (
                    <StepDot key={s.id} active={s.id === step} />
                  ))}
                </div>
              </div>
              {/* <div className="h-2 w-full rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-neutral-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div> */}

              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #2563EB 0%, #22C55E 100%)"
                  }}
                />
              </div>
            </div>

            {/* Auto-tag preview */}
            {/* <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-medium text-neutral-700">Tag otomatis (dari QR)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>Lead-SchoolVisit</Badge>
                {tags.school ? <Badge>Sekolah: {tags.school}</Badge> : <Badge>Sekolah: (manual)</Badge>}
                <Badge>Sumber: {tags.source}</Badge>
                <Badge>Campaign: {tags.campaign}</Badge>
                {tags.wave ? <Badge>Wave: {tags.wave}</Badge> : null}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Admin cukup ganti parameter QR per sekolah agar data otomatis rapi.
              </p>
            </div> */}

          </div>

          {/* Form */}
          <div className="mt-6 space-y-6">
            {step === 1 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <Field label="Nama lengkap" error={errors.nama} id="nama">
                  <input
                    id="nama"
                    name="nama"
                    value={form.nama}
                    onChange={(e) => setField("nama", e.target.value)}
                    placeholder="Contoh: Aulia Putri"
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                      errors.nama ? "border-red-300" : "border-neutral-200 focus:border-neutral-900"
                    )}
                  />
                </Field>

                <Field
                  label="Asal sekolah"
                  // hint={tags.school ? "Auto dari QR" : "Wajib"}
                  error={errors.sekolah}
                  id="sekolah"
                >
                  <input
                    id="sekolah"
                    name="sekolah"
                    value={form.sekolah}
                    onChange={(e) => setField("sekolah", e.target.value)}
                    placeholder="Contoh: SMA Pasundan 1"
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                      errors.sekolah ? "border-red-300" : "border-neutral-200 focus:border-neutral-900",
                      tags.school ? "bg-neutral-50" : "bg-white"
                    )}
                    readOnly={Boolean(tags.school)}
                  />
                </Field>

                <div className="space-y-5">
                  <Field label="Kelas" id="kelas">
                    <select
                      id="kelas"
                      name="kelas"
                      value={form.kelas}
                      onChange={(e) => setField("kelas", e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-900"
                    >
                      {CONFIG.options.kelas.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="No. WhatsApp aktif" error={errors.wa} id="wa">
                    <input
                      type="number"
                      id="wa"
                      name="wa"
                      value={form.wa}
                      onChange={(e) => setField("wa", e.target.value)}
                      inputMode="numeric"
                      placeholder="08xxxx / 628xxxx"
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                        errors.wa ? "border-red-300" : "border-neutral-200 focus:border-neutral-900"
                      )}
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      Tip: pakai nomor yang terhubung WhatsApp (contoh: 08xxxxxxxxxx).
                    </p>
                  </Field>
                </div>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-neutral-900">Minat bidang studi</div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Pilih satu yang paling kamu minati sekarang. Detail prodi akan dibantu saat follow-up.
                  </p>
                  {errors.minatBidang ? (
                    <p className="mt-2 text-xs text-red-600">{errors.minatBidang}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  {CONFIG.options.minatBidang.map((o) => (
                    <Pill
                      key={o.key}
                      title={o.title}
                      desc={o.desc}
                      bg={o.bg}
                      text={o.text}
                      descColor={o.descColor}
                      selected={form.minatBidang === o.key}
                      onClick={() => setField("minatBidang", o.key)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <Field label="Rencana masuk kuliah" id="rencana">
                  <select
                    id="rencana"
                    name="rencana"
                    value={form.rencana}
                    onChange={(e) => setField("rencana", e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-900"
                  >
                    {CONFIG.options.rencana.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-neutral-900">Yang kamu cari dari UNPAS</div>
                  <p className="text-sm text-neutral-600">Boleh pilih lebih dari satu.</p>
                  <div className="grid gap-2">
                    {CONFIG.options.ketertarikan.map((k) => {
                      const checked = form.ketertarikan.includes(k.key);
                      return (
                        <button
                          key={k.key}
                          type="button"
                          onClick={() => toggleKetertarikan(k.key)}
                          className={cn(
                            "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition cursor-pointer",
                            checked
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-neutral-200 bg-white text-neutral-900"
                          )}
                        >
                          <span>{k.label}</span>
                          <span className={cn("text-xs", checked ? "text-white" : "text-neutral-500")}>
                            {checked ? "Dipilih" : "Pilih"}
                          </span>
                        </button>
                      );
                    })}
                    {errors.ketertarikan ? (
                      <p className="mt-2 text-xs text-red-600">{errors.ketertarikan}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-neutral-900">Izin follow-up via WhatsApp</div>
                      <p className="text-sm text-neutral-600">
                        Data hanya digunakan untuk informasi resmi PMB UNPAS dan tidak dibagikan ke pihak lain.
                      </p>
                      <label htmlFor="izinFollowUp" className="flex items-start gap-3 text-sm">
                        <input
                          id="izinFollowUp"
                          name="izinFollowUp"
                          type="checkbox"
                          checked={form.izinFollowUp}
                          onChange={(e) => setField("izinFollowUp", e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-neutral-300 cursor-pointer"
                        />
                        <span>
                          Saya bersedia dihubungi oleh tim resmi PMB UNPAS melalui WhatsApp.
                        </span>
                      </label>
                      {errors.izinFollowUp ? (
                        <p className="text-xs text-red-600">{errors.izinFollowUp}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1 || isSubmitting}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium cursor-pointer",
                  step === 1 || isSubmitting
                    ? "border-neutral-200 bg-neutral-100 text-neutral-400"
                    : "border-neutral-200 bg-white text-neutral-900"
                )}
              >
                Kembali
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl bg-[#7F6B5D] hover:bg-[#6F5C50] px-5 py-3 text-sm font-semibold text-white cursor-pointer",
                    isSubmitting ? "opacity-70" : ""
                  )}
                >
                  Lanjut <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={isSubmitting}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl bg-[#7F6B5D] hover:bg-[#6F5C50] px-5 py-3 text-sm font-semibold text-white cursor-pointer",
                    isSubmitting ? "opacity-70" : ""
                  )}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="text-center text-xs text-neutral-500">
              Dengan mengisi, kamu akan menerima informasi resmi PMB UNPAS sesuai minat kamu.
            </p>
          </div>
        </motion.div>

        <div className="mt-6 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} {CONFIG.brand.org}
        </div>
      </div>
    </div>
  );
}
