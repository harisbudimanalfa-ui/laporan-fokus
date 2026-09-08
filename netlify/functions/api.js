// LAPORAN FOKUS v4
// Supabase: kode_toko + naf_users

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };

  // OPTIONS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  // Hanya POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Method tidak diizinkan."
      })
    };
  }

  // Supabase configuration
  const url = process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Konfigurasi Supabase di Netlify belum lengkap."
      })
    };
  }

  // =====================================================
  // BACA BODY
  // =====================================================

  let body = {};

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Data login tidak valid."
      })
    };
  }

  // =====================================================
  // ACTION
  // Mendukung:
  // body.action
  // atau ?action=login
  // =====================================================

  const action =
    body.action ||
    (event.queryStringParameters || {}).action ||
    "";

  if (action !== "login") {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Endpoint tidak ditemukan."
      })
    };
  }

  // =====================================================
  // DATA LOGIN
  // =====================================================

  const store = String(body.store || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const nik = String(body.nik || "").trim();

  const password = String(body.password || "");

  if (!store) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Kode toko wajib diisi."
      })
    };
  }

  if (!nik || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "NIK dan password wajib diisi."
      })
    };
  }

  const base = url.replace(/\/$/, "");

  try {

    // =====================================================
    // 1. CEK KODE TOKO
    // Tabel: kode_toko
    // Kolom: kode, nama_toko, aktif
    // =====================================================

    const storeEndpoint =
      `${base}/rest/v1/kode_toko` +
      `?select=id,kode,nama_toko,aktif` +
      `&kode=eq.${encodeURIComponent(store)}` +
      `&aktif=eq.true` +
      `&limit=1`;

    const storeResponse = await fetch(storeEndpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    const storeRows = await storeResponse.json();

    if (!storeResponse.ok) {
      throw new Error(
        storeRows?.message ||
        "Gagal membaca tabel kode_toko."
      );
    }

    // Kode toko tidak ditemukan
    if (
      !Array.isArray(storeRows) ||
      storeRows.length === 0
    ) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          ok: false,
          message: "Kode toko tidak terdaftar."
        })
      };
    }

    const toko = storeRows[0];

    // =====================================================
    // 2. CEK USER
    // Tabel: naf_users
    // =====================================================

    const userEndpoint =
      `${base}/rest/v1/naf_users` +
      `?select=*` +
      `&store=eq.${encodeURIComponent(store)}` +
      `&nik=eq.${encodeURIComponent(nik)}` +
      `&limit=1`;

    const userResponse = await fetch(userEndpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    const userRows = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(
        userRows?.message ||
        "Gagal membaca tabel naf_users."
      );
    }

    // User tidak ditemukan
    if (
      !Array.isArray(userRows) ||
      userRows.length === 0
    ) {
      return {
        statusCode: 401
