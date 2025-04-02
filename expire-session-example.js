// Example script to expire a specific checkout session
// This demonstrates how to use the API endpoint to expire a session by URL

// Example usage:
// node expire-session-example.js

const axios = require('axios');

// The Stripe checkout session URL you want to expire
const sessionUrl = 'https://checkout.stripe.com/c/pay/cs_test_a17wia8eBLy6QIX7AJkWNs9ChdUuzx51DnHwKG4gSfLWX3a4iHcZM7HFVg#fidkdWxOYHwnPyd1blpxYHZxWjA0VzBTb01MaDRLXDdWYHUzRF9JVWdEf11BSElkaktnQEtzMlddUlRvQW09XWBOQ1IwfH1hXTR8NXRJUnBrUWRoV2x0bWpWNTAwNjJxTGxAT1ZqUmNLbXAzNTVGRm1Qb39WUCcpJ2hsYXYnP34nYnBsYSc%2FJzcwYDIwND1gKDU1NzAoMWBnZyg8NWA3KGc3Zmc2ZmQxMWNkZzNnYDIyMScpJ2hwbGEnPycyPTRhZjZnZyg3YTRgKDFgY2EoPDUwMyhmZ2BmZDU0PGAzMGRhMDEwMWEnKSd2bGEnPydgPTYyNWdnNSgyZGAwKDE3YDcoPTRjMigzNWZnZjRnZDYxMDxgZjVjYTYneCknZ2BxZHYnP15YKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSd3YGNgd3dgd0p3bGJsayc%2FJ21xcXU%2FKippamZkaW1qdnE%2FMDQyNid4JSUl';

// Your server URL
const serverUrl = 'http://localhost:5000';

// Admin credentials (replace with actual admin credentials)
const adminCredentials = {
  email: 'admin@example.com',
  password: 'adminpassword'
};

async function expireSession() {
  try {
    console.log('Logging in as admin...');
    
    // First, log in to get auth token
    const loginResponse = await axios.post(`${serverUrl}/api/auth/login`, adminCredentials);
    const token = loginResponse.data.token;
    
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    console.log('Successfully logged in');
    console.log('Expiring session:', sessionUrl);
    
    // Set up headers with authentication
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Call the expire session endpoint
    const expireResponse = await axios.post(
      `${serverUrl}/api/admin/expire-session`,
      { sessionUrl },
      { headers }
    );
    
    console.log('Response:', expireResponse.data);
    
    if (expireResponse.data.success) {
      console.log('✅ Session expired successfully!');
    } else {
      console.log('❌ Failed to expire session:', expireResponse.data.message);
    }
  } catch (error) {
    console.error('Error expiring session:', error.response?.data || error.message);
  }
}

// Run the function
expireSession();