const { createClient } = require("@supabase/supabase-js");

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const indicators = [
  "PSM",
  "PWP",
  "SERBA GRATIS",
  "SUEGGER",
  "CEBAN",
  "NEW MEMBER",
  "KONTRIBUSI MEMBER"
];

function response(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}

function isAdmin(event) {
  const key =
    event.headers?.["x-admin-key"] ||
    event.headers?.["X-Admin-Key"];

  return key === process.env.ADMIN_KEY;
}

exports.handler = async (event) => {
  try {

    /*
      ==================================================
      CEK KODE TOKO
      ==================================================
    */

    if (
      event.httpMethod === "GET" &&
      event.queryStringParameters?.action === "store-check"
    ) {
      const store = String(
        event.queryStringParameters?.store || ""
      )
        .trim()
        .toUpperCase();

      if (!store) {
        return response(400, {
          error: "Kode toko wajib diisi"
        });
      }

      const { data, error } = await db
        .from("fokus_stores")
        .select("store, active")
        .eq("store", store)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return response(403, {
          allowed: false,
          error: "Kode toko tidak terdaftar atau tidak aktif"
        });
      }

      return response(200, {
        allowed: true
      });
    }


    /*
      ==================================================
      AMBIL LAPORAN TOKO
      ==================================================
    */

    if (
      event.httpMethod === "GET" &&
      event.queryStringParameters?.action === "report"
    ) {
      const store = String(
        event.queryStringParameters?.store || ""
      )
        .trim()
        .toUpperCase();

      const period = String(
        event.queryStringParameters?.period || ""
      ).trim();

      if (!store || !period) {
        return response(400, {
          error: "Parameter tidak lengkap"
        });
      }

      const check = await db
        .from("fokus_stores")
        .select("store")
        .eq("store", store)
        .eq("active", true)
        .maybeSingle();

      if (!check.data) {
        return response(403, {
          error: "Kode toko tidak valid"
        });
      }

      const { data, error } = await db
        .from("fokus_metrics")
        .select(
          "indicator,target,actual"
        )
        .eq("store", store)
        .eq("period", period);

      if (error) {
        throw error;
      }

      return response(200, {
        data: data || []
      });
    }


    /*
      ==================================================
      SIMPAN LAPORAN
      ==================================================
    */

    if (event.httpMethod === "POST") {

      let body = JSON.parse(
        event.body || "[]"
      );

      if (!Array.isArray(body)) {
        body = [body];
      }

      if (!body.length) {
        return response(400, {
          error: "Tidak ada data"
        });
      }

      const store = String(
        body[0].store || ""
      )
        .trim()
        .toUpperCase();

      const period = String(
        body[0].period || ""
      ).trim();

      if (!store || !period) {
        return response(400, {
          error: "Data tidak lengkap"
        });
      }

      /*
        Pastikan semua data dalam request
        berasal dari toko dan periode yang sama.
      */

      const invalid = body.some((item) => {

        const itemStore = String(
          item.store || ""
        )
          .trim()
          .toUpperCase();

        const itemPeriod = String(
          item.period || ""
        ).trim();

        const indicator = String(
          item.indicator || ""
        )
          .trim()
          .toUpperCase();

        return (
          itemStore !== store ||
          itemPeriod !== period ||
          !indicators.includes(indicator)
        );
      });

      if (invalid) {
        return response(400, {
          error: "Data tidak valid"
        });
      }

      /*
        Pastikan kode toko memang terdaftar.
      */

      const check = await db
        .from("fokus_stores")
        .select("store")
        .eq("store", store)
        .eq("active", true)
        .maybeSingle();

      if (!check.data) {
        return response(403, {
          error: "Kode toko tidak valid"
        });
      }

      const rows = body.map((item) => ({
        store: store,
        period: period,
        indicator: String(
          item.indicator
        )
          .trim()
          .toUpperCase(),
        target: Number(
          item.target || 0
        ),
        actual: Number(
          item.actual || 0
        ),
        updated_at:
          new Date().toISOString()
      }));

      const { error } = await db
        .from("fokus_metrics")
        .upsert(
          rows,
          {
            onConflict:
              "store,period,indicator"
          }
        );

      if (error) {
        throw error;
      }

      return response(200, {
        message:
          "Laporan berhasil disimpan"
      });
    }


    /*
      ==================================================
      CEK ADMIN
      ==================================================
    */

    if (
      event.httpMethod === "GET" &&
      event.queryStringParameters?.action ===
        "admin-check"
    ) {

      if (!isAdmin(event)) {
        return response(401, {
          error: "ADMIN_KEY tidak valid"
        });
      }

      return response(200, {
        ok: true
      });
    }


    /*
      ==================================================
      DATA ADMIN
      ==================================================
    */

    if (
      event.httpMethod === "GET" &&
      event.queryStringParameters?.action ===
        "admin-data"
    ) {

      if (!isAdmin(event)) {
        return response(401, {
          error: "ADMIN_KEY tidak valid"
        });
      }

      const { data, error } = await db
        .from("fokus_metrics")
        .select(
          "store,period,indicator,target,actual"
        )
        .order("store")
        .order("period");

      if (error) {
        throw error;
      }

      return response(200, {
        data: data || []
      });
    }


    /*
      ==================================================
      ENDPOINT TIDAK DITEMUKAN
      ==================================================
    */

    return response(404, {
      error: "Endpoint tidak ditemukan"
    });

  } catch (error) {

    console.error(error);

    return response(500, {
      error:
        error.message ||
        "Server error"
    });
  }
};
