-- SQL untuk insert user baru
-- Pastikan extension pgcrypto aktif jika menggunakan gen_random_uuid(), atau biarkan default jika sudah diset di tabel.
-- Jika tabel 'users' ada di schema 'public':

INSERT INTO public.users (email, password, name, role, avatar)
VALUES (
    'admin@example.com',
    'password123', -- Password plain text (ideally should be hashed if strictly using this table, but example showed plain check)
    'Admin User',
    'admin',
    'https://ui-avatars.com/api/?name=Admin+User'
);

-- Contoh user biasa
INSERT INTO public.users (email, password, name, role, avatar)
VALUES (
    'user@example.com',
    'user123',
    'Regular User',
    'user',
    'https://ui-avatars.com/api/?name=Regular+User'
);
