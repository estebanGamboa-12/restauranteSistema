-- Track refunds evolution/status on reservations.

alter table public.reservations
  add column if not exists refund_id text,
  add column if not exists refund_status text,
  add column if not exists refunded_at timestamptz;

do $$
begin
  begin
    alter table public.reservations
      add constraint reservations_refund_status_check
      check (refund_status in ('requested','processed','failed'));
  exception when duplicate_object then
    -- ignore
  end;
end $$;

