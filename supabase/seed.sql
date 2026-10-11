-- ==============================================================================
-- Med SaaS Baseline Seed File
-- Documented Dev Password for all seeded users: Password123!
-- ==============================================================================

SET timezone = 'Africa/Cairo';

-- 1. Insert Clinics
INSERT INTO public.clinics (id, name, status, settings)
VALUES 
    (
        'c1000000-0000-0000-0000-000000000001',
        'عيادة النور لطب الأطفال',
        'active',
        '{
            "arrive_before_minutes": 15,
            "skip_alert_minutes": 60,
            "urgent_enabled": false,
            "urgent_fee_multiplier": 3,
            "consultation_prices": {"new": 350, "follow_up": 180, "quick_consult": 100},
            "enabled_modules": ["pediatrics"]
        }'::jsonb
    ),
    (
        'c2000000-0000-0000-0000-000000000002',
        'مركز الحياة للتغذية العلاجية',
        'active',
        '{
            "arrive_before_minutes": 15,
            "skip_alert_minutes": 60,
            "urgent_enabled": false,
            "urgent_fee_multiplier": 3,
            "consultation_prices": {"new": 400, "follow_up": 200, "quick_consult": 120},
            "enabled_modules": ["nutrition"]
        }'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users into auth.users
-- Uses pgcrypto crypt('Password123!', gen_salt('bf', 10))
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
)
VALUES
    -- Platform Admin
    (
        'a0000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'admin@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"علي - مدير المنصة"}',
        'authenticated',
        'authenticated'
    ),
    -- Clinic 1: Pediatrics Staff
    (
        'b1000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'owner.peds@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"د. تامر - مالك عيادة الأطفال"}',
        'authenticated',
        'authenticated'
    ),
    (
        'b1000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000000',
        'doctor.peds@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"د. سارة - أخصائي أطفال"}',
        'authenticated',
        'authenticated'
    ),
    (
        'b1000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000000',
        'reception.peds@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"مريم - استقبال الأطفال"}',
        'authenticated',
        'authenticated'
    ),
    -- Clinic 2: Nutrition Staff
    (
        'b2000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'owner.nutrition@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"د. هاني - مالك مركز التغذية"}',
        'authenticated',
        'authenticated'
    ),
    (
        'b2000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000000',
        'doctor.nutrition@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"د. نورهان - أخصائي تغذية"}',
        'authenticated',
        'authenticated'
    ),
    (
        'b2000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000000',
        'reception.nutrition@med.local',
        crypt('Password123!', gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"يوسف - استقبال التغذية"}',
        'authenticated',
        'authenticated'
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Profiles
INSERT INTO public.profiles (id, clinic_id, full_name, phone)
VALUES
    ('a0000000-0000-0000-0000-000000000001', NULL, 'علي - مدير المنصة', '+201000000001'),
    ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'د. تامر - مالك عيادة الأطفال', '+201000000002'),
    ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'د. سارة - أخصائي أطفال', '+201000000003'),
    ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'مريم - استقبال الأطفال', '+201000000004'),
    ('b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'د. هاني - مالك مركز التغذية', '+201000000005'),
    ('b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'د. نورهان - أخصائي تغذية', '+201000000006'),
    ('b2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 'يوسف - استقبال التغذية', '+201000000007')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Roles
INSERT INTO public.user_roles (user_id, clinic_id, role)
VALUES
    -- Platform Admin
    ('a0000000-0000-0000-0000-000000000001', NULL, 'platform_admin'),
    -- Clinic 1: Pediatrics
    ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'clinic_owner'),
    ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'doctor'),
    ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'receptionist'),
    -- Clinic 2: Nutrition
    ('b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'clinic_owner'),
    ('b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'doctor'),
    ('b2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 'receptionist')
ON CONFLICT DO NOTHING;
