const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const extendedData = {
        items: [], category: 'Stock', assetType: '', mainMetalType: 'Gold', billNo: '', mcPercent: '', mcAmount: '', remark: 'test'
    };
    const row = {
        order_number: 'PO-1004', type: 'Purchase Order', date: '2026-04-02', due_date: null,
        customer_name: '', vendor_id: 'SUP-1004', product_name: '',
        total_weight: 10, weight_unit: 'g', remark: JSON.stringify(extendedData),
        total_amount: 1000, paid_amount: 0, status: 'Open'
    };
    const { error } = await supabase.from('orders').upsert([row], { onConflict: 'order_number' });
    console.log(error);
}
test();
