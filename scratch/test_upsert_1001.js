const url = "https://stcomjtuuuchdafhssgv.supabase.co/rest/v1/stock_history";
const headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates"
};

const data = {
    "id": "ADJ-1001",
    "date": new Date().toISOString(),
    "type": "Buy",
    "details": JSON.stringify({"id":"ADJ-1001","note":"test","status":"Active"}),
    "qty": 0,
    "weight": 5,
    "metal_type": "pure_gold_999"
};

fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
})
.then(r => r.json())
.then(json => console.log(JSON.stringify(json, null, 2)))
.catch(e => console.error(e));
