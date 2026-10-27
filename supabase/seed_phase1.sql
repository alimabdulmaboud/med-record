-- Med: Phase 1 Deterministic Fake Seed Data (Realistic Egyptian Family)
-- One Adult (Manager): أحمد مصطفى إبراهيم
-- Child 1: سارة أحمد مصطفى (5 years)
-- Child 2: ياسين أحمد مصطفى (14 months)

DO $$
DECLARE
    v_user_id UUID := '11111111-1111-1111-1111-111111111111';
    v_family_id UUID := 'f0000000-0000-0000-0000-000000000001';
    v_member_id UUID := 'm0000000-0000-0000-0000-000000000001';
    v_person_adult_id UUID := 'p0000000-0000-0000-0000-000000000001';
    v_person_child1_id UUID := 'p0000000-0000-0000-0000-000000000002';
    v_person_child2_id UUID := 'p0000000-0000-0000-0000-000000000003';
BEGIN
    -- 1. Family
    INSERT INTO public.families (id, name, created_at, updated_at)
    VALUES (v_family_id, 'عائلة أحمد مصطفى', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Family Member (Manager)
    INSERT INTO public.family_members (id, family_id, user_id, role, created_at, updated_at)
    VALUES (v_member_id, v_family_id, v_user_id, 'manager', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 3. Adult (Ahmed - Manager)
    INSERT INTO public.people (
        id, family_id, name, birth_date, sex, blood_type,
        allergies, chronic_conditions, notes, phone_number, linked_user_id, created_at, updated_at
    )
    VALUES (
        v_person_adult_id,
        v_family_id,
        'أحمد مصطفى إبراهيم',
        '1988-06-15',
        'male',
        'A+',
        ARRAY['بنسلين (Penicillin)'],
        ARRAY['ارتفاع ضغط الدم (Hypertension)'],
        'متابعة دورية لضغط الدم مع طبيب الباطنة',
        '+201012345678',
        v_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Emergency Contact for Ahmed
    INSERT INTO public.emergency_contacts (person_id, name, relationship, phone, is_primary)
    VALUES (v_person_adult_id, 'منى الشاذلي', 'الزوجة', '+201098765432', TRUE)
    ON CONFLICT DO NOTHING;

    -- 4. Child 1 (Sara - 5 years)
    INSERT INTO public.people (
        id, family_id, name, birth_date, sex, blood_type,
        allergies, chronic_conditions, notes, created_at, updated_at
    )
    VALUES (
        v_person_child1_id,
        v_family_id,
        'سارة أحمد مصطفى',
        '2021-04-10',
        'female',
        'A+',
        ARRAY['الفول السوداني (Peanuts)'],
        ARRAY[]::TEXT[],
        'حساسية مفرطة من الفول السوداني ومشتقاته',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Emergency Contact for Sara
    INSERT INTO public.emergency_contacts (person_id, name, relationship, phone, is_primary)
    VALUES (v_person_child1_id, 'أحمد مصطفى', 'الأب', '+201012345678', TRUE)
    ON CONFLICT DO NOTHING;

    -- 5. Child 2 (Yassin - 14 months)
    INSERT INTO public.people (
        id, family_id, name, birth_date, sex, blood_type,
        allergies, chronic_conditions, notes, created_at, updated_at
    )
    VALUES (
        v_person_child2_id,
        v_family_id,
        'ياسين أحمد مصطفى',
        '2025-08-20',
        'male',
        'O+',
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        'متابعة تطور النمو وجدول التطعيمات الإلزامية',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Emergency Contact for Yassin
    INSERT INTO public.emergency_contacts (person_id, name, relationship, phone, is_primary)
    VALUES (v_person_child2_id, 'أحمد مصطفى', 'الأب', '+201012345678', TRUE)
    ON CONFLICT DO NOTHING;

    -- 6. Consent for Ahmed
    INSERT INTO public.consents (user_id, type, version, accepted_at)
    VALUES (v_user_id, 'terms_and_disclaimer', '1.0', NOW())
    ON CONFLICT (user_id, type) DO NOTHING;

    -- 7. Audit Log Entry
    INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, family_id, person_id, metadata, created_at)
    VALUES (v_user_id, 'person_created', 'person', v_person_adult_id::text, v_family_id, v_person_adult_id, '{"seed": true}'::jsonb, NOW())
    ON CONFLICT DO NOTHING;
END $$;
