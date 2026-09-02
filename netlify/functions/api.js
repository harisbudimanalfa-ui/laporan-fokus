// LAPORAN FOKUS v3 - server-side Supabase lookup.
// Set SUPABASE_URL and SUPABASE_SECRET_KEY in Netlify environment variables.
exports.handler = async (event) => {
  const headers = { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode:204, headers, body:'' };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode:500, headers, body:JSON.stringify({ok:false,message:'Konfigurasi Supabase di Netlify belum lengkap.'}) };
  const action = (event.queryStringParameters||{}).action || '';
  if (action !== 'login') return { statusCode:404, headers, body:JSON.stringify({ok:false,message:'Endpoint tidak ditemukan.'}) };
  let body={}; try{body=JSON.parse(event.body||'{}')}catch{}
  const store=String(body.store||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!store) return {statusCode:400,headers,body:JSON.stringify({ok:false,message:'Kode toko wajib diisi.'})};
  const endpoint = `${url.replace(/\/$/,'')}/rest/v1/kode_toko?select=*&kode_toko=eq.${encodeURIComponent(store)}&limit=1`;
  try{
    const r=await fetch(endpoint,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
    const rows=await r.json();
    if(!r.ok) throw new Error(rows?.message||'Gagal membaca tabel kode_toko.');
    if(!Array.isArray(rows)||!rows.length) return {statusCode:401,headers,body:JSON.stringify({ok:false,message:'Kode toko tidak terdaftar.'})};
    const row=rows[0];
    if(row.active===false || row.aktif===false || row.status==='inactive') return {statusCode:403,headers,body:JSON.stringify({ok:false,message:'Kode toko tidak aktif.'})};
    return {statusCode:200,headers,body:JSON.stringify({ok:true,store,nik:row.nik||row.user_id||'',countdownMinutes:Number(row.countdown_minutes||row.countdownMinutes||60)})};
  }catch(e){return {statusCode:500,headers,body:JSON.stringify({ok:false,message:e.message||'Terjadi kesalahan server.'})};}
};
