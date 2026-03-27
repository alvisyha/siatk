
async function test() {
    console.log("Fetching /api/barang...");
    // Since we are running in a script, we can't easily get the auth cookie 
    // but we can at least see if it returns a 401 with valid JSON or something else.
    try {
        const res = await fetch('http://localhost:3000/api/barang');
        console.log("Status:", res.status);
        console.log("Headers:", Object.fromEntries(res.headers.entries()));
        const text = await res.text();
        console.log("Raw Body:", text);
        try {
            const json = JSON.parse(text);
            console.log("JSON Body:", json);
        } catch (e) {
            console.log("Body is NOT JSON");
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
test();
