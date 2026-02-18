
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viwnlfduyhnxtypkrzea.supabase.co';
const supabaseKey = 'sb_publishable_XZZehI5j_V52mDqJ2PDc-Q_K5eConXh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncDirector() {
    const director = {
        id: 'd1111111-1111-1111-1111-111111111111',
        name: 'Ibrahim Fatmi',
        email: 'brahim@fatmi.com',
        role: 'director',
        department: 'Management'
    };

    const { data, error } = await supabase
        .from('agents')
        .upsert(director, { onConflict: 'id' });

    if (error) {
        console.error('Sync failed:', error.message);
    } else {
        console.log('Ibrahim Fatmi synchronized to Supabase!');
    }
}

syncDirector();
