import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Info, ShieldCheck, Sparkles } from "lucide-react";

/**
 * Mini Landing Page QR Buku Tamu UNPAS (Preview-ready)
 * - Mobile-first
 * - Ringkas (≤ 1 menit)
 * - Siap tagging (via query params)
 *
 * Cara pakai cepat:
 * 1) Tempelkan link page ini ke QR, contoh:
 *    https://domain-kamu/qr?school=SMA%20Pasundan%201&campaign=SchoolVisit&wave=G1
 * 2) Saat submit, data akan dikirim ke endpoint (lihat CONFIG.submission).
 *
 * Catatan: Ini mockup front-end. Kamu bisa:
 * - Hubungkan ke Google Apps Script / endpoint CRM
 * - Atau Google Form (via Apps Script) agar rapi dan bisa auto-tag
 */

const CONFIG = {
  brand: {
    org: "UNIVERSITAS PASUNDAN",
    title: "Buku Tamu Digital Kunjungan Sekolah",
    subtitle:
      "Isi singkat untuk dapat info jalur masuk, beasiswa, dan konsultasi prodi UNPAS. (± 1 menit)",
  },
  submission: {
    mode: "mock", // "mock" | "fetch"
    // Jika mode = "fetch", isi endpoint berikut:
    endpoint: "https://example.com/api/pmb/lead", // ganti
    method: "POST",
  },
  options: {
    kelas: ["XII", "XI"],
    rencana: ["Masuk 2026", "Masih mempertimbangkan", "Ingin info beasiswa dulu"],
    minatBidang: [
      {
        key: "soshum",
        title: "Sosial & Humaniora",
        desc: "Hukum, Komunikasi, HI, Administrasi, dll.",
      },
      {
        key: "bisnis",
        title: "Ekonomi & Bisnis",
        desc: "Manajemen, Akuntansi, Ekonomi, dll.",
      },
      {
        key: "teknologi",
        title: "Teknik & Teknologi",
        desc: "Informatika, Teknik, Rekayasa, dll.",
      },
      {
        key: "kesehatan",
        title: "Kesehatan",
        desc: "Kedokteran, Keperawatan, Farmasi, dll.",
      },
      {
        key: "pendidikan",
        title: "Pendidikan",
        desc: "FKIP (pendidik & calon guru).",
      },
      {
        key: "belum",
        title: "Belum tahu",
        desc: "Minta arahan prodi yang cocok.",
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

function Field({ label, hint, children, error }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-neutral-900">{label}</label>
        {hint ? (
          <span className="text-xs text-neutral-500">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Pill({ selected, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-4 transition",
        "hover:shadow-sm active:scale-[0.99]",
        selected
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-900"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className={cn("text-sm", selected ? "text-white/80" : "text-neutral-600")}>
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
    if (!form.izinFollowUp) e.izinFollowUp = "Izin follow-up wajib.";

    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      ...form,
      wa_normalized: normalizeWA(form.wa),
      tags: {
        status_funnel: "Lead-SchoolVisit",
        sekolah: form.sekolah,
        minat: form.minatBidang,
        kelas: form.kelas,
        ...tags,
      },
      meta: {
        submitted_at: new Date().toISOString(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
    };

    try {
      setIsSubmitting(true);

      if (CONFIG.submission.mode === "fetch") {
        const res = await fetch(CONFIG.submission.endpoint, {
          method: CONFIG.submission.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Submit gagal");
      } else {
        // Mock submit (preview)
        await new Promise((r) => setTimeout(r, 900));
        // eslint-disable-next-line no-console
        console.log("MOCK_SUBMIT_PAYLOAD", payload);
      }

      setDone(true);
    } catch (err) {
      // eslint-disable-next-line no-console
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
                  href={"#"}
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Ganti link ini ke WhatsApp resmi PMB UNPAS.");
                  }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Chat Admin PMB <ChevronRight className="h-4 w-4" />
                </a>
                <p className="mt-2 text-xs text-neutral-500">
                  Pastikan menggunakan nomor resmi PMB UNPAS.
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900"
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

            <div>
              <h1 className="text-xl font-semibold text-neutral-900">{CONFIG.brand.title}</h1>
              <p className="mt-1 text-sm text-neutral-600">{CONFIG.brand.subtitle}</p>
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
              <div className="h-2 w-full rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-neutral-900 transition-all"
                  style={{ width: `${progress}%` }}
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
                <Field label="Nama lengkap" error={errors.nama}>
                  <input
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
                  hint={tags.school ? "Auto dari QR" : "Wajib"}
                  error={errors.sekolah}
                >
                  <input
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

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Kelas">
                    <select
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

                  <Field label="No. WhatsApp aktif" hint="Untuk follow-up" error={errors.wa}>
                    <input
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
                      selected={form.minatBidang === o.key}
                      onClick={() => setField("minatBidang", o.key)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <Field label="Rencana masuk kuliah" hint="Untuk segmentasi">
                  <select
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
                            "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                            checked
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 bg-white text-neutral-900"
                          )}
                        >
                          <span>{k.label}</span>
                          <span className={cn("text-xs", checked ? "text-white/80" : "text-neutral-500")}>
                            {checked ? "Dipilih" : "Pilih"}
                          </span>
                        </button>
                      );
                    })}
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
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.izinFollowUp}
                          onChange={(e) => setField("izinFollowUp", e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-neutral-300"
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
                  "rounded-2xl border px-4 py-3 text-sm font-medium",
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
                    "inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white",
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
                    "inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white",
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
