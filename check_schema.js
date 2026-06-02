const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking schema by inserting ADJ-TEST...");
    const { data, error } = await supabase.from('stock_history').upsert({
        id: 'ADJ-TEST',
        date: new Date().toISOString(),
        type: 'Test',
        qty: 1,
        weight: 1
    });
    console.log("Upsert result:", error ? error.message : "Success");
    
    if (!error) {
        await supabase.from('stock_history').delete().eq('id', 'ADJ-TEST');
    }
}
check();
