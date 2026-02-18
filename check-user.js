
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viwnlfduyhnxtypkrzea.supabase.co';
const supabaseKey = 'sb_publishable_XZZehI5j_V52mDqJ2PDc-Q_K5eConXh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const { data, error } = await supabase.from('agents').select('*').eq('email', 'brahim@fatmi.com');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('User in agents table:', data);
    }
}

checkUser();
