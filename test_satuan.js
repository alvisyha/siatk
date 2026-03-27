require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing insert without deskripsi:");
    const res1 = await supabase.from('satuan').insert({ nama: 'Test1' }).select();
    console.log(res1.error ? res1.error.message : "Success");
    if(res1.data) await supabase.from('satuan').delete().eq('id', res1.data[0].id);

    console.log("Testing insert with deskripsi:");
    const res2 = await supabase.from('satuan').insert({ nama: 'Test2', deskripsi: 'Desc' }).select();
    console.log(res2.error ? res2.error.message : "Success");
    if(res2.data) await supabase.from('satuan').delete().eq('id', res2.data[0].id);
}

test();
