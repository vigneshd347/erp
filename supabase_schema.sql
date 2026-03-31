-- Supabase Migration Schema for Manti ERP
-- Copy and paste this entirely into the Supabase SQL Editor and click "Run"

-- 1. Create the `orders` table (Sales and Purchase Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'Sales Order' or 'Purchase Order'
    date DATE NOT NULL,
    due_date DATE,
    customer_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    total_weight NUMERIC NOT NULL,
    weight_unit TEXT NOT NULL,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the `job_works` table (Production Line Tracking)
CREATE TABLE IF NOT EXISTS public.job_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_no TEXT NOT NULL,
    date DATE NOT NULL,
    worker_id TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    process TEXT NOT NULL, -- '1. Issue', '2. Casting', ..., '5. Despatch'
    issue_wt NUMERIC,
    receive_wt NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the `invoices` table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    customer_data JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create the `settings` table (Stored as key-value JSON for flexibility)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create the `snapshots` table (For valuation report archives)
CREATE TABLE IF NOT EXISTS public.snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    html TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Vendor KYC table
CREATE TABLE IF NOT EXISTS public.vendor_kyc (
    id TEXT PRIMARY KEY,
    date DATE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    company_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pin TEXT,
    gst TEXT,
    pan TEXT,
    msme TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    bank_acc TEXT,
    bank_ifsc TEXT,
    bank_upi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Supplier KYC table
CREATE TABLE IF NOT EXISTS public.supplier_kyc (
    id TEXT PRIMARY KEY,
    date DATE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    company_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pin TEXT,
    gst TEXT,
    pan TEXT,
    msme TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    bank_acc TEXT,
    bank_ifsc TEXT,
    bank_upi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS) and create permissive policies for initial development
-- Note: In a true production app with user auth, these policies should be restricted!
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.job_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.job_works FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.snapshots FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.vendor_kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.vendor_kyc FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.supplier_kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.supplier_kyc FOR ALL USING (true) WITH CHECK (true);
