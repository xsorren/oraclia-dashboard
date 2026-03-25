require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN || key; // We might need a JWT for admin role, let's just use the Anon/Service key to see what happens, or authenticate as admin.

async function test() {
    // Let's first log in as locutoramajo@hotmail.com to get a token
    const { createClient } = require('@supabase/supabase-js');
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supaUrl, supaKey);

    console.log("Logging in...");
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'locutoramajo@hotmail.com',
        password: 'Oraclia2025'
    });

    if (authErr) {
        console.log("Login failed", authErr);
        return;
    }

    const jwt = auth.session.access_token;

    console.log("Calling edge function...");
    const res = await fetch(`${url}/admin-dashboard/private-consultations?page=1&limit=15`, {
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
        }
    });

    const text = await res.text();
    console.log("Status:", res.status);

    try {
        const json = JSON.parse(text);
        console.log("Response data (first user):", json.data?.[0]?.user);
        const users = json.data?.map(d => d.user?.display_name);
        console.log("User names mapped:", users);
    } catch (e) {
        console.log("Raw text:", text);
    }
}

test();
