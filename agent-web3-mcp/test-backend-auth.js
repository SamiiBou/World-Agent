const fetch = require('node-fetch');

async function testBackendAuth() {
  const BASE_URL = 'http://localhost:3001';
  
  console.log('🧪 Testing backend authentication endpoints...\n');
  
  try {
    // Test 1: Get nonce
    console.log('1. Testing /api/nonce endpoint...');
    const nonceResponse = await fetch(`${BASE_URL}/api/nonce`);
    
    if (!nonceResponse.ok) {
      throw new Error(`Nonce request failed: ${nonceResponse.status} ${nonceResponse.statusText}`);
    }
    
    const nonceData = await nonceResponse.json();
    console.log('✅ Nonce received:', {
      nonce: nonceData.nonce.substring(0, 8) + '...',
      length: nonceData.nonce.length,
      timestamp: nonceData.timestamp
    });
    
    // Test 2: Complete SIWE (mock)
    console.log('\n2. Testing /api/complete-siwe endpoint...');
    const mockPayload = {
      payload: {
        status: 'success',
        address: '0x1234567890123456789012345678901234567890'
      },
      nonce: nonceData.nonce,
      userInfo: {
        username: 'testuser',
        walletAddress: '0x1234567890123456789012345678901234567890'
      }
    };
    
    const siweResponse = await fetch(`${BASE_URL}/api/complete-siwe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });
    
    if (!siweResponse.ok) {
      throw new Error(`SIWE request failed: ${siweResponse.status} ${siweResponse.statusText}`);
    }
    
    const siweData = await siweResponse.json();
    console.log('✅ SIWE completion successful:', {
      status: siweData.status,
      isValid: siweData.isValid,
      walletAddress: siweData.walletAddress,
      username: siweData.username
    });
    
    // Test 3: Server status
    console.log('\n3. Testing /api/status endpoint...');
    const statusResponse = await fetch(`${BASE_URL}/api/status`);
    
    if (!statusResponse.ok) {
      throw new Error(`Status request failed: ${statusResponse.status} ${statusResponse.statusText}`);
    }
    
    const statusData = await statusResponse.json();
    console.log('✅ Server status:', {
      status: statusData.status,
      worldchain: statusData.worldchain?.connected,
      database: statusData.database?.connected
    });
    
    console.log('\n🎉 All backend tests passed!');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testBackendAuth(); 