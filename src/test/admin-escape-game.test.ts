import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive test suite for Admin Escape Game System
 * Run all tests to verify the system is working correctly
 */

export const adminEscapeGameTests = {
  
  // ==================== ADMIN LOGIN TESTS ====================
  
  async testAdminLogin() {
    console.log('\n🔐 Testing Admin Login...');
    
    const testCases = [
      { username: 'admin1', password: 'cdhv-admin-2026-secure-1', expectedSuccess: true },
      { username: 'admin2', password: 'cdhv-admin-2026-secure-2', expectedSuccess: true },
      { username: 'admin3', password: 'cdhv-admin-2026-secure-3', expectedSuccess: true },
      { username: 'admin4', password: 'cdhv-admin-2026-secure-4', expectedSuccess: true },
      { username: 'admin1', password: 'wrongpassword', expectedSuccess: false },
    ];

    for (const tc of testCases) {
      try {
        const { data, error } = await (supabase.rpc('admin_login', {
          p_username: tc.username,
          p_password: tc.password,
        }) as any);

        if (tc.expectedSuccess) {
          if (error) {
            console.log(`  ❌ ${tc.username} login failed: ${error.message}`);
          } else {
            console.log(`  ✅ ${tc.username} login successful: ${data?.[0]?.name}`);
          }
        } else {
          if (error) {
            console.log(`  ✅ ${tc.username} with wrong password correctly rejected`);
          } else {
            console.log(`  ❌ ${tc.username} with wrong password should have failed`);
          }
        }
      } catch (err) {
        console.log(`  ❌ Error testing ${tc.username}: ${err}`);
      }
    }
  },

  // ==================== TEAM CREATION TESTS ====================

  async testCreateTeam() {
    console.log('\n👥 Testing Team Creation...');

    // First, get admin1 ID
    const { data: adminData, error: adminError } = await (supabase.rpc('admin_login', {
      p_username: 'admin1',
      p_password: 'cdhv-admin-2026-secure-1',
    }) as any);

    if (adminError || !adminData?.[0]) {
      console.log(`  ❌ Could not get admin1 ID: ${adminError?.message}`);
      return;
    }

    const adminId = adminData[0].admin_id;

    const members = [
      { first_name: 'Alice', last_name: 'Martin' },
      { first_name: 'Bob', last_name: 'Dupont' },
      { first_name: 'Charlie', last_name: 'Durand' },
    ];

    try {
      const { data, error } = await (supabase.rpc('create_team_with_members', {
        p_admin_id: adminId,
        p_team_name: 'Test Team 1',
        p_members: members,
      }) as any);

      if (error) {
        console.log(`  ❌ Team creation failed: ${error.message}`);
      } else {
        console.log(`  ✅ Team created: ${data?.[0]?.team_name} with ${data?.[0]?.member_count} members`);
        return data?.[0]?.team_id; // Return team ID for next tests
      }
    } catch (err) {
      console.log(`  ❌ Error creating team: ${err}`);
    }
  },

  // ==================== ANSWER VALIDATION TESTS ====================

  async testValidateAnswer(teamId: string, adminId: string) {
    console.log('\n✅ Testing Answer Validation...');

    const testCases = [
      { room_order: 1, answer: 'REPONSE1', expectedCorrect: true },
      { room_order: 1, answer: 'WRONG_ANSWER', expectedCorrect: false },
      { room_order: 2, answer: 'REPONSE2', expectedCorrect: true },
      { room_order: 3, answer: 'reponse3', expectedCorrect: true }, // Should be case-insensitive
    ];

    for (const tc of testCases) {
      try {
        const { data, error } = await (supabase.rpc('validate_answer', {
          p_team_id: teamId,
          p_admin_id: adminId,
          p_room_order: tc.room_order,
          p_answer: tc.answer,
        }) as any);

        if (error) {
          console.log(`  ❌ Room ${tc.room_order} answer validation failed: ${error.message}`);
        } else {
          const result = data?.[0];
          const status = result?.is_correct === tc.expectedCorrect ? '✅' : '❌';
          console.log(
            `  ${status} Room ${tc.room_order}: "${tc.answer}" -> ${result?.is_correct ? 'Correct (+1)' : 'Incorrect (-1)'}`
          );
        }
      } catch (err) {
        console.log(`  ❌ Error validating answer for room ${tc.room_order}: ${err}`);
      }
    }
  },

  // ==================== LEADERBOARD TESTS ====================

  async testLeaderboard() {
    console.log('\n🏆 Testing Leaderboard...');

    try {
      const { data, error } = await (supabase.rpc('get_leaderboard') as any);

      if (error) {
        console.log(`  ❌ Leaderboard fetch failed: ${error.message}`);
      } else {
        console.log('  📊 Current Leaderboard:');
        data?.forEach((team: any, index: number) => {
          console.log(`    ${team.rank}. ${team.team_name} - ${team.points} pts (Members: ${team.members})`);
        });
      }
    } catch (err) {
      console.log(`  ❌ Error fetching leaderboard: ${err}`);
    }
  },

  // ==================== ATTEMPT HISTORY TESTS ====================

  async testAttemptHistory(teamId: string) {
    console.log('\n📋 Testing Attempt History...');

    try {
      const { data, error } = await (supabase.rpc('get_attempt_history', {
        p_team_id: teamId,
        p_limit: 50,
      }) as any);

      if (error) {
        console.log(`  ❌ Attempt history fetch failed: ${error.message}`);
      } else {
        console.log(`  ✅ Fetched ${data?.length || 0} attempts`);
        data?.slice(0, 5).forEach((attempt: any) => {
          console.log(
            `    Room ${attempt.room_order}: "${attempt.answer_submitted}" -> ${attempt.is_correct ? '✅' : '❌'} (${attempt.admin_name})`
          );
        });
      }
    } catch (err) {
      console.log(`  ❌ Error fetching attempt history: ${err}`);
    }
  },

  // ==================== MAIN TEST RUNNER ====================

  async runAllTests() {
    console.log('🎮 ========== ADMIN ESCAPE GAME TEST SUITE ==========');
    
    // Test 1: Admin Login
    await this.testAdminLogin();

    // Test 2: Team Creation
    const teamId = await this.testCreateTeam();

    if (!teamId) {
      console.log('\n❌ Cannot continue without team. Aborting remaining tests.');
      return;
    }

    // Get admin1 for further tests
    const { data: adminData } = await (supabase.rpc('admin_login', {
      p_username: 'admin1',
      p_password: 'cdhv-admin-2026-secure-1',
    }) as any);

    if (adminData?.[0]) {
      // Test 3: Answer Validation
      await this.testValidateAnswer(teamId, adminData[0].admin_id);

      // Test 4: Leaderboard
      await this.testLeaderboard();

      // Test 5: Attempt History
      await this.testAttemptHistory(teamId);
    }

    console.log('\n✅ ========== TEST SUITE COMPLETE ==========\n');
  },
};

// Export for use
export default adminEscapeGameTests;
