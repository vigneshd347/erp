const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('stock_history').select('*');
    if (error) {
        console.error('Error fetching stock_history:', error);
        return;
    }
    console.log('Stock History Records:', data);
}

run();
