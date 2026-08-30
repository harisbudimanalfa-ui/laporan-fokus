LAPORAN FOKUS v2

PERUBAHAN:
- User login hanya Kode Toko.
- Kode toko harus terdaftar dan aktif di tabel fokus_stores.
- User dapat input dan menyimpan laporan tanpa ADMIN_KEY.
- API POST hanya menerima data untuk satu kode toko dalam satu request.
- User tidak diberikan endpoint admin.
- Admin tetap menggunakan ADMIN_KEY melalui menu Admin.
- Tidak ada upload file laporan.

SETUP:
1. Jalankan supabase.sql di Supabase SQL Editor.
2. Tambahkan kode toko awal, misalnya:
   insert into public.fokus_stores(store) values ('T001');
3. Di Netlify Environment Variables isi:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ADMIN_KEY
4. Hubungkan repository ke Netlify.
5. Build command kosong, publish directory ".".

CATATAN:
Login Kode Toko saja bukan autentikasi kuat. Siapa pun yang mengetahui kode toko dapat masuk ke toko tersebut. API tetap memvalidasi kode toko aktif dan tidak mempercayai kode toko yang tidak terdaftar.
