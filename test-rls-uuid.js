
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viwnlfduyhnxtypkrzea.supabase.co';
const supabaseKey = 'sb_publishable_XZZehI5j_V52mDqJ2PDc-Q_K5eConXh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data, error } = await supabase.from('agents').insert({
        id: 'b2222222-2222-2222-2222-222222222222',
        name: 'Test Agent',
        email: 'test@test.com',
        role: 'agent',
        department: 'Test'
    });
    if (error) {
        console.log('Insert failed:', error.message);
    } else {
        console.log('Insert successful!');
    }
}

testInsert();
