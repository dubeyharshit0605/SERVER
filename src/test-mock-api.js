const axios = require('axios');
const { server } = require('./mock-server');

// Base URL for API requests
const API_URL = 'http://localhost:5000';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Test utility functions
const test = async (name, testFn) => {
  testResults.total++;
  try {
    console.log(`\n🧪 RUNNING TEST: ${name}`);
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    testResults.passed++;
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    testResults.failed++;
  }
};

const skip = (name) => {
  console.log(`⏭️ SKIPPED: ${name}`);
  testResults.skipped++;
  testResults.total++;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

// Store tokens and IDs for use across tests
const testData = {
  userToken: null,
  leaderToken: null,
  userId: null,
  treeId: null
};

// Run tests
const runTests = async () => {
  try {
    console.log('🚀 Starting API tests...');

    // Test root endpoint
    await test('Root endpoint', async () => {
      const response = await axios.get(`${API_URL}/`);
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.message.includes('Welcome'), 'Expected welcome message');
    });

    // Test user registration
    await test('User registration', async () => {
      const userData = {
        nickname: `user_${Date.now()}`,
        communityId: 'test_community',
        password: 'password123'
      };
      
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      assert(response.status === 201, 'Expected 201 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.user.nickname === userData.nickname, 'Expected nickname to match');
      assert(response.data.user.token, 'Expected token to be present');
      
      // Save token for later tests
      testData.userToken = response.data.user.token;
      testData.userId = response.data.user._id;
    });

    // Test user login
    await test('User login', async () => {
      // Use existing test user
      const loginData = {
        nickname: 'testuser',
        password: 'password123'
      };
      
      const response = await axios.post(`${API_URL}/api/auth/login`, loginData);
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.user.nickname === loginData.nickname, 'Expected nickname to match');
      assert(response.data.user.token, 'Expected token to be present');
    });

    // Test community leader login
    await test('Community leader login', async () => {
      const loginData = {
        nickname: 'communityleader',
        password: 'password123'
      };
      
      const response = await axios.post(`${API_URL}/api/auth/login`, loginData);
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.user.role === 'leader', 'Expected role to be leader');
      
      // Save leader token for later tests
      testData.leaderToken = response.data.user.token;
    });

    // Test get user profile (protected route)
    await test('Get user profile (protected)', async () => {
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.user, 'Expected user object to be present');
    });

    // Test unauthorized access
    await test('Unauthorized access', async () => {
      try {
        await axios.get(`${API_URL}/api/auth/profile`);
        throw new Error('Should have failed with 401');
      } catch (error) {
        assert(error.response.status === 401, 'Expected 401 status code');
        assert(error.response.data.success === false, 'Expected success to be false');
      }
    });

    // Test create tree
    await test('Create tree', async () => {
      const treeData = {
        location: {
          type: 'Point',
          coordinates: [73.123, 19.456]
        },
        species: 'Rhizophora mucronata',
        plantedDate: '2023-08-15',
        healthStatus: 'healthy',
        images: ['https://example.com/image1.jpg'],
        notes: 'Planted near the coastal area',
        localId: `local-${Date.now()}`
      };
      
      const response = await axios.post(`${API_URL}/api/trees`, treeData, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 201, 'Expected 201 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.tree.species === treeData.species, 'Expected species to match');
      assert(response.data.reward.points === 10, 'Expected 10 reward points');
      
      // Save tree ID for later tests
      testData.treeId = response.data.tree._id;
    });

    // Test get trees
    await test('Get trees', async () => {
      const response = await axios.get(`${API_URL}/api/trees`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(Array.isArray(response.data.trees), 'Expected trees to be an array');
    });

    // Test get tree by ID
    await test('Get tree by ID', async () => {
      const response = await axios.get(`${API_URL}/api/trees/${testData.treeId}`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.tree._id === testData.treeId, 'Expected tree ID to match');
    });

    // Test get user rewards
    await test('Get user rewards', async () => {
      const response = await axios.get(`${API_URL}/api/rewards`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(Array.isArray(response.data.rewards), 'Expected rewards to be an array');
    });

    // Test get community rewards (leader only)
    await test('Get community rewards (leader only)', async () => {
      const response = await axios.get(`${API_URL}/api/rewards/community`, {
        headers: { Authorization: `Bearer ${testData.leaderToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(Array.isArray(response.data.rewards), 'Expected rewards to be an array');
    });

    // Test unauthorized access to leader-only route
    await test('Unauthorized access to leader-only route', async () => {
      try {
        await axios.get(`${API_URL}/api/rewards/community`, {
          headers: { Authorization: `Bearer ${testData.userToken}` }
        });
        throw new Error('Should have failed with 403');
      } catch (error) {
        assert(error.response.status === 403, 'Expected 403 status code');
        assert(error.response.data.success === false, 'Expected success to be false');
      }
    });

    // Test get leaderboard
    await test('Get leaderboard', async () => {
      const response = await axios.get(`${API_URL}/api/rewards/leaderboard`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(Array.isArray(response.data.leaderboard), 'Expected leaderboard to be an array');
    });

    // Test sync trees
    await test('Sync trees', async () => {
      const syncData = {
        trees: [
          {
            localId: `local-sync-${Date.now()}`,
            location: {
              type: 'Point',
              coordinates: [73.124, 19.457]
            },
            species: 'Avicennia marina',
            plantedDate: '2023-08-16',
            healthStatus: 'healthy',
            images: ['https://example.com/image2.jpg'],
            notes: 'Planted in muddy area'
          }
        ]
      };
      
      const response = await axios.post(`${API_URL}/api/sync/trees`, syncData, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      assert(response.status === 200, 'Expected 200 status code');
      assert(response.data.success === true, 'Expected success to be true');
      assert(response.data.count === syncData.trees.length, 'Expected count to match');
    });

  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  } finally {
    // Print test summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`   Total: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed}`);
    console.log(`   Failed: ${testResults.failed}`);
    console.log(`   Skipped: ${testResults.skipped}`);
    
    // Close server
    server.close(() => {
      console.log('\n🛑 Server closed');
      
      // Exit with appropriate code
      process.exit(testResults.failed > 0 ? 1 : 0);
    });
  }
};

// Run tests
runTests();

