import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://rsbherkgjgjcpbqyemfi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYmhlcmtnanpqY3BiXCJyZWR1Y2VkXCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3MTI3NTQwMDAsImV4cCI6OTk5OTk5OTk5OX0.REDACTED_FOR_SAFETY'; // Replace with actual key

const supabase = createClient(supabaseUrl, process.env.SUPABASE_KEY || 'sb_publishable_x9sN8rlFSwDo9TjcSvinUQ_vadE_L7s');

async function verify() {
  console.log('🔍 Verifying Supabase Deployment...\n');

  try {
    // 1. Admins
    console.log('1️⃣ ADMINS TABLE');
    const { data: admins, error: adminsError, count: adminsCount } = await supabase
      .from('admins')
      .select('id, username, name', { count: 'exact' });
    
    if (adminsError) {
      console.log(`   ❌ Error: ${adminsError.message}`);
    } else {
      console.log(`   ✅ ${adminsCount} admins found:`);
      admins?.forEach((admin: any) => {
        console.log(`      - ${admin.username}: ${admin.name}`);
      });
    }

    // 2. Rooms
    console.log('\n2️⃣ ROOMS TABLE');
    const { data: rooms, error: roomsError, count: roomsCount } = await supabase
      .from('rooms')
      .select('room_number, room_type, title', { count: 'exact' })
      .order('room_number');
    
    if (roomsError) {
      console.log(`   ❌ Error: ${roomsError.message}`);
    } else {
      console.log(`   ✅ ${roomsCount} rooms found:`);
      rooms?.forEach((room: any) => {
        console.log(`      - Room ${room.room_number}: "${room.title}" (${room.room_type})`);
      });
    }

    // 3. Teams
    console.log('\n3️⃣ TEAMS TABLE');
    const { data: teams, error: teamsError, count: teamsCount } = await supabase
      .from('teams')
      .select('id, team_name, points', { count: 'exact' })
      .order('points', { ascending: false });
    
    if (teamsError) {
      console.log(`   ❌ Error: ${teamsError.message}`);
    } else {
      console.log(`   ✅ ${teamsCount} teams found`);
      if (teams && teams.length > 0) {
        teams.forEach((team: any, idx: number) => {
          console.log(`      ${idx + 1}. ${team.team_name}: ${team.points} pts`);
        });
      }
    }

    // 4. Test RPC
    console.log('\n4️⃣ RPC FUNCTIONS');
    const { data: loginResult, error: loginError } = await (supabase.rpc('admin_login', {
      p_username: 'admin1',
      p_password: 'cdhv-admin-2026-secure-1',
    }) as any);
    
    if (loginError) {
      console.log(`   ❌ admin_login failed: ${loginError.message}`);
    } else {
      const admin = loginResult?.[0];
      console.log(`   ✅ admin_login works: ${admin?.name} (ID: ${admin?.admin_id})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

verify();
