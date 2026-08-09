import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kpzqhtoegvqscvppavqa.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_irayHpIXw6IsOtuZpbd-TA_EUZZ04Ws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  const email = 'praveenyt872@gmail.com';
  console.log("=== Testing Anon Update with password_hash only ===");
  const passwordHash = await bcrypt.hash('123456', 10);

  const { data, error } = await supabase
    .from('teacher_whitelist')
    .update({
      password_hash: passwordHash
    })
    .eq('email', email)
    .select();

  console.log("Update Data:", data);
  console.log("Update Error:", error);
}

testUpdate();
