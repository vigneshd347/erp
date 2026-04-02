import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://stcomjtuuuchdafssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dbSuppliers = [{
    id: "SUP-1001", date: "2026-04-01", name: "Test Supplier", mobile: "1234567890", email: null,
    company_type: null, address: "Test", city: null, state: null, pin: "123456", gst: "GST", pan: "PAN", msme: null,
    bank_name: null, bank_branch: null, bank_acc: null, bank_ifsc: null, bank_upi: null
}];

async function test() {
    console.log("Upserting...");
    const { data, error } = await supabase.from('supplier_kyc').upsert(dbSuppliers, { onConflict: 'id' });
    console.log("Error:", error);
    console.log("Data:", data);
}

test();
