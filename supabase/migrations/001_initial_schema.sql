create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('admin', 'partner', 'accountant', 'warehouse')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  contact_person text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  customer_group text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text,
  size text,
  unit text not null default 'box',
  pieces_per_box numeric not null default 0 check (pieces_per_box >= 0),
  sqm_per_box numeric not null default 0 check (sqm_per_box >= 0),
  import_price numeric not null default 0 check (import_price >= 0),
  sale_price numeric not null default 0 check (sale_price >= 0),
  supplier_id uuid references public.suppliers(id),
  image_url text,
  min_stock numeric not null default 0 check (min_stock >= 0),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  supplier_id uuid references public.suppliers(id),
  order_date date not null default current_date,
  total_amount numeric not null default 0 check (total_amount >= 0),
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  debt_amount numeric not null default 0 check (debt_amount >= 0),
  payment_method text,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'canceled')),
  note text,
  attachment_url text,
  created_by uuid references public.profiles(id),
  canceled_by uuid references public.profiles(id),
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_orders_paid_not_greater_than_total check (paid_amount <= total_amount)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  line_total numeric generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references public.customers(id),
  order_date date not null default current_date,
  customer_phone text,
  delivery_address text,
  subtotal_amount numeric not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  shipping_fee numeric not null default 0 check (shipping_fee >= 0),
  total_amount numeric not null default 0 check (total_amount >= 0),
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  debt_amount numeric not null default 0 check (debt_amount >= 0),
  payment_method text,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'delivering', 'delivered', 'returned')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'delivering', 'completed', 'canceled', 'returned')),
  note text,
  attachment_url text,
  created_by uuid references public.profiles(id),
  canceled_by uuid references public.profiles(id),
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_orders_paid_not_greater_than_total check (paid_amount <= total_amount)
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  cost_price numeric not null default 0 check (cost_price >= 0),
  line_total numeric generated always as ((quantity * unit_price) - discount_amount) stored,
  created_at timestamptz not null default now(),
  constraint sales_order_items_non_negative_line_total check (((quantity * unit_price) - discount_amount) >= 0)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_date date not null default current_date,
  quantity numeric not null,
  movement_type text not null check (
    movement_type in ('purchase', 'sale', 'purchase_cancel', 'sale_cancel', 'return', 'adjustment')
  ),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint stock_movements_quantity_not_zero check (quantity <> 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_date date not null default current_date,
  direction text not null check (direction in ('in', 'out')),
  party_type text not null default 'other' check (party_type in ('customer', 'supplier', 'other')),
  customer_id uuid references public.customers(id),
  supplier_id uuid references public.suppliers(id),
  reference_type text,
  reference_id uuid,
  amount numeric not null check (amount > 0),
  method text,
  note text,
  attachment_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint payments_party_matches_direction check (
    (party_type = 'customer' and direction = 'in')
    or (party_type = 'supplier' and direction = 'out')
    or party_type = 'other'
  )
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null check (amount > 0),
  expense_date date not null default current_date,
  payment_method text,
  note text,
  attachment_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.closing_periods (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('day', 'month')),
  period_start date not null,
  period_end date not null,
  locked_by uuid references public.profiles(id),
  locked_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  constraint closing_periods_valid_range check (period_end >= period_start),
  constraint closing_periods_unique_period unique (period_type, period_start, period_end)
);

create index if not exists suppliers_name_idx on public.suppliers using gin (to_tsvector('simple', coalesce(name, '')));
create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists products_code_idx on public.products(code);
create index if not exists products_supplier_id_idx on public.products(supplier_id);
create index if not exists purchase_orders_supplier_date_idx on public.purchase_orders(supplier_id, order_date desc);
create index if not exists sales_orders_customer_date_idx on public.sales_orders(customer_id, order_date desc);
create index if not exists stock_movements_product_date_idx on public.stock_movements(product_id, movement_date desc);
create index if not exists payments_customer_date_idx on public.payments(customer_id, payment_date desc);
create index if not exists payments_supplier_date_idx on public.payments(supplier_id, payment_date desc);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'suppliers',
    'customers',
    'products',
    'purchase_orders',
    'sales_orders',
    'expenses'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', target_table, target_table);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      target_table,
      target_table
    );
  end loop;
end $$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select is_active
      from public.profiles
      where id = auth.uid()
      limit 1
    ),
    false
  )
$$;

create or replace function public.has_app_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = any(allowed_roles)
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_is_active() to authenticated;
grant execute on function public.has_app_role(text[]) to authenticated;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    row_id = new.id;
  else
    row_id = old.id;
  end if;

  insert into public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    note
  )
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    'auto_audit'
  );

  return coalesce(new, old);
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'suppliers',
    'customers',
    'products',
    'purchase_orders',
    'purchase_order_items',
    'sales_orders',
    'sales_order_items',
    'stock_movements',
    'payments',
    'expenses',
    'closing_periods'
  ]
  loop
    execute format('drop trigger if exists audit_%I_changes on public.%I', target_table, target_table);
    execute format(
      'create trigger audit_%I_changes after insert or update on public.%I for each row execute function public.audit_row_change()',
      target_table,
      target_table
    );
  end loop;
end $$;

create or replace view public.inventory_view
with (security_invoker = true)
as
select
  p.id as product_id,
  p.code,
  p.name,
  p.category,
  p.size,
  p.unit,
  p.pieces_per_box,
  p.sqm_per_box,
  p.import_price,
  p.sale_price,
  p.min_stock,
  coalesce(sum(sm.quantity), 0) as current_stock,
  coalesce(sum(sm.quantity), 0) * p.pieces_per_box as current_pieces,
  coalesce(sum(sm.quantity), 0) * p.sqm_per_box as current_sqm,
  coalesce(sum(sm.quantity), 0) * p.import_price as stock_value,
  case
    when coalesce(sum(sm.quantity), 0) <= 0 then 'out_of_stock'
    when coalesce(sum(sm.quantity), 0) <= p.min_stock then 'low_stock'
    else 'in_stock'
  end as stock_status
from public.products p
left join public.stock_movements sm on sm.product_id = p.id
where p.is_active = true
group by p.id;

create or replace view public.customer_debts_view
with (security_invoker = true)
as
select
  c.id as customer_id,
  c.name,
  c.phone,
  c.address,
  coalesce(sum(so.total_amount) filter (where so.status <> 'canceled'), 0) as total_bought,
  coalesce(sum(so.paid_amount) filter (where so.status <> 'canceled'), 0) as total_paid,
  coalesce(sum(so.debt_amount) filter (where so.status <> 'canceled'), 0) as total_debt
from public.customers c
left join public.sales_orders so on so.customer_id = c.id
group by c.id;

create or replace view public.supplier_debts_view
with (security_invoker = true)
as
select
  s.id as supplier_id,
  s.name,
  s.phone,
  s.contact_person,
  coalesce(sum(po.total_amount) filter (where po.status <> 'canceled'), 0) as total_imported,
  coalesce(sum(po.paid_amount) filter (where po.status <> 'canceled'), 0) as total_paid,
  coalesce(sum(po.debt_amount) filter (where po.status <> 'canceled'), 0) as total_debt
from public.suppliers s
left join public.purchase_orders po on po.supplier_id = s.id
group by s.id;

alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_logs enable row level security;
alter table public.closing_periods enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.has_app_role(array['admin']));

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
on public.profiles
for insert
to authenticated
with check (public.has_app_role(array['admin']));

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles
for update
to authenticated
using (public.has_app_role(array['admin']))
with check (public.has_app_role(array['admin']));

drop policy if exists "products_read" on public.products;
create policy "products_read"
on public.products
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant', 'warehouse']));

drop policy if exists "products_write_admin_accountant" on public.products;
create policy "products_write_admin_accountant"
on public.products
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "products_update_admin_accountant" on public.products;
create policy "products_update_admin_accountant"
on public.products
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "suppliers_read" on public.suppliers;
create policy "suppliers_read"
on public.suppliers
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "suppliers_write_admin_accountant" on public.suppliers;
create policy "suppliers_write_admin_accountant"
on public.suppliers
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "suppliers_update_admin_accountant" on public.suppliers;
create policy "suppliers_update_admin_accountant"
on public.suppliers
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "customers_read" on public.customers;
create policy "customers_read"
on public.customers
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "customers_write_admin_accountant" on public.customers;
create policy "customers_write_admin_accountant"
on public.customers
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "customers_update_admin_accountant" on public.customers;
create policy "customers_update_admin_accountant"
on public.customers
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "purchase_orders_read" on public.purchase_orders;
create policy "purchase_orders_read"
on public.purchase_orders
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "purchase_orders_write_admin_accountant" on public.purchase_orders;
create policy "purchase_orders_write_admin_accountant"
on public.purchase_orders
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "purchase_orders_update_admin_accountant" on public.purchase_orders;
create policy "purchase_orders_update_admin_accountant"
on public.purchase_orders
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "purchase_order_items_read" on public.purchase_order_items;
create policy "purchase_order_items_read"
on public.purchase_order_items
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "purchase_order_items_write_admin_accountant" on public.purchase_order_items;
create policy "purchase_order_items_write_admin_accountant"
on public.purchase_order_items
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "purchase_order_items_update_admin_accountant" on public.purchase_order_items;
create policy "purchase_order_items_update_admin_accountant"
on public.purchase_order_items
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "sales_orders_read" on public.sales_orders;
create policy "sales_orders_read"
on public.sales_orders
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant', 'warehouse']));

drop policy if exists "sales_orders_write_admin_accountant" on public.sales_orders;
create policy "sales_orders_write_admin_accountant"
on public.sales_orders
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "sales_orders_update_admin_accountant" on public.sales_orders;
create policy "sales_orders_update_admin_accountant"
on public.sales_orders
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "sales_order_items_read" on public.sales_order_items;
create policy "sales_order_items_read"
on public.sales_order_items
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant', 'warehouse']));

drop policy if exists "sales_order_items_write_admin_accountant" on public.sales_order_items;
create policy "sales_order_items_write_admin_accountant"
on public.sales_order_items
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "sales_order_items_update_admin_accountant" on public.sales_order_items;
create policy "sales_order_items_update_admin_accountant"
on public.sales_order_items
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "stock_movements_read" on public.stock_movements;
create policy "stock_movements_read"
on public.stock_movements
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant', 'warehouse']));

drop policy if exists "stock_movements_write_admin_accountant" on public.stock_movements;
create policy "stock_movements_write_admin_accountant"
on public.stock_movements
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "payments_read" on public.payments;
create policy "payments_read"
on public.payments
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "payments_write_admin_accountant" on public.payments;
create policy "payments_write_admin_accountant"
on public.payments
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "payments_update_admin_accountant" on public.payments;
create policy "payments_update_admin_accountant"
on public.payments
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "expenses_read" on public.expenses;
create policy "expenses_read"
on public.expenses
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "expenses_write_admin_accountant" on public.expenses;
create policy "expenses_write_admin_accountant"
on public.expenses
for insert
to authenticated
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "expenses_update_admin_accountant" on public.expenses;
create policy "expenses_update_admin_accountant"
on public.expenses
for update
to authenticated
using (public.has_app_role(array['admin', 'accountant']))
with check (public.has_app_role(array['admin', 'accountant']));

drop policy if exists "audit_logs_read" on public.audit_logs;
create policy "audit_logs_read"
on public.audit_logs
for select
to authenticated
using (public.has_app_role(array['admin', 'partner']));

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
on public.audit_logs
for insert
to authenticated
with check (public.current_profile_is_active());

drop policy if exists "closing_periods_read" on public.closing_periods;
create policy "closing_periods_read"
on public.closing_periods
for select
to authenticated
using (public.has_app_role(array['admin', 'partner', 'accountant']));

drop policy if exists "closing_periods_write_admin" on public.closing_periods;
create policy "closing_periods_write_admin"
on public.closing_periods
for insert
to authenticated
with check (public.has_app_role(array['admin']));

drop policy if exists "closing_periods_update_admin" on public.closing_periods;
create policy "closing_periods_update_admin"
on public.closing_periods
for update
to authenticated
using (public.has_app_role(array['admin']))
with check (public.has_app_role(array['admin']));

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'sales_orders',
    'purchase_orders',
    'stock_movements',
    'payments',
    'expenses',
    'audit_logs'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    exception
      when duplicate_object or undefined_object then null;
    end;
  end loop;
end $$;
