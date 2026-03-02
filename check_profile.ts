import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing SUPABASE env vars.");
    Deno.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
    const ids = ["47abe231-60a5-4a63-9360-9e828347296d"];
    const { data, error } = await supabaseAdmin.from("profiles").select("*").in("id", ids);
    console.log({ data, error });
}

check();
