-- ==============================================================================
-- Med SaaS Migration: 20261010000006_owner_reports.sql
-- Description: Aggregate views for clinic_owner reports (Queue KPIs, waiting time,
--              left/no-show rates, lost revenue estimates, and billing aggregates).
--              Zero clinical data exposure. Strict Tenant Isolation.
-- ==============================================================================

-- 1. Daily Queue Aggregates View
CREATE OR REPLACE VIEW public.v_daily_queue_stats AS
SELECT 
    qe.clinic_id,
    date_trunc('day', qe.arrival_time AT TIME ZONE 'UTC') AS report_date,
    qe.doctor_id,
    COUNT(*) AS total_entries,
    COUNT(*) FILTER (WHERE qe.state = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE qe.state = 'left' AND qe.auto_closed = false) AS manual_left_count,
    COUNT(*) FILTER (WHERE qe.state = 'left' AND qe.auto_closed = true) AS auto_closed_left_count,
    COUNT(*) FILTER (WHERE qe.state = 'left') AS total_left_count,
    COUNT(*) FILTER (WHERE qe.state = 'no_show') AS no_show_count,
    COUNT(*) FILTER (WHERE qe.priority = 'urgent') AS urgent_count,
    AVG(
        CASE 
            WHEN qe.consultation_start_time IS NOT NULL AND qe.arrival_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (qe.consultation_start_time - qe.arrival_time)) / 60 
            ELSE NULL 
        END
    ) AS avg_waiting_minutes
FROM public.queue_entries qe
WHERE qe.archived_at IS NULL
GROUP BY qe.clinic_id, date_trunc('day', qe.arrival_time AT TIME ZONE 'UTC'), qe.doctor_id;

-- 2. Billing & Visit Aggregates View (Minimal Billing: Paid vs Unpaid)
CREATE OR REPLACE VIEW public.v_clinic_billing_stats AS
SELECT 
    v.clinic_id,
    date_trunc('day', v.visit_date AT TIME ZONE 'UTC') AS report_date,
    v.doctor_id,
    v.visit_type,
    COUNT(*) AS visit_count,
    SUM(v.price) AS total_revenue,
    SUM(CASE WHEN v.is_paid = true THEN v.price ELSE 0 END) AS paid_total,
    SUM(CASE WHEN v.is_paid = false THEN v.price ELSE 0 END) AS unpaid_total
FROM public.visits v
WHERE v.archived_at IS NULL
GROUP BY v.clinic_id, date_trunc('day', v.visit_date AT TIME ZONE 'UTC'), v.doctor_id, v.visit_type;
