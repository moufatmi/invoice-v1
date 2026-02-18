
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viwnlfduyhnxtypkrzea.supabase.co';
const supabaseKey = 'sb_publishable_XZZehI5j_V52mDqJ2PDc-Q_K5eConXh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgents() {
    const { data, error } = await supabase.from('agents').select('*').limit(1);
    if (error) {
        console.error('Error fetching agents:', error.message);
    } else {
        console.log('Agents table exists. Sample:', data);
    }
}

checkAgents();
