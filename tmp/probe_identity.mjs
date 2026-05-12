async function probe() {
    const url = "https://jrjnrjbnpzelvwgyxzns.supabase.co/rest/v1/organizations?select=*";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyam5yamJucHplbHZ3Z3l4em5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc0ODE3NCwiZXhwIjoyMDg5MzI0MTc0fQ.8FfjzHbxQaBf2cth6rSrHZL4sCEM85yRVaFzo-KCA3c";

    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        const data = await res.json();
        console.log("--- CLUSTER IDENTITY REPORT ---");
        data.forEach(org => {
            console.log(`- Node: ${org.name.padEnd(25)} | TIN: ${org.tax_number} | VAT: ${org.vat_number}`);
        });
    } catch (e) {
        console.error("❌ CLUSTER PROBE FAILED:", e.message);
    }
}
probe();
