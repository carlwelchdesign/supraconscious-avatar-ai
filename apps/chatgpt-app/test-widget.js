#!/usr/bin/env node

// Simple test script for the ChatGPT widget functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function testWidget() {
  console.log('🧪 Testing Supraconscious ChatGPT Widget...\n');

  try {
    // Test 1: Check widget HTML loads
    console.log('1. Testing widget HTML...');
    const htmlResponse = await fetch(`${BASE_URL}/widget/index.html`);
    if (htmlResponse.ok) {
      console.log('✅ Widget HTML loads successfully');
    } else {
      console.log('❌ Widget HTML failed to load');
      return;
    }

    // Test 2: Check widget CSS loads
    console.log('2. Testing widget CSS...');
    const cssResponse = await fetch(`${BASE_URL}/widget/styles.css`);
    if (cssResponse.ok) {
      console.log('✅ Widget CSS loads successfully');
    } else {
      console.log('❌ Widget CSS failed to load');
      return;
    }

    // Test 3: Check widget JS loads
    console.log('3. Testing widget JS...');
    const jsResponse = await fetch(`${BASE_URL}/widget/widget.js`);
    if (jsResponse.ok) {
      console.log('✅ Widget JS loads successfully');
    } else {
      console.log('❌ Widget JS failed to load');
      return;
    }

    // Test 4: Test MCP tools endpoint
    console.log('4. Testing MCP tools endpoint...');
    const toolsResponse = await fetch(`${BASE_URL}/mcp/tools`);
    if (toolsResponse.ok) {
      const tools = await toolsResponse.json();
      console.log(`✅ MCP tools endpoint returns ${tools.tools.length} tools`);
    } else {
      console.log('❌ MCP tools endpoint failed');
      return;
    }

    // Test 5: Test a tool execution (analyze_journal_entry)
    console.log('5. Testing tool execution...');
    const testInput = { text: 'I feel anxious about my work performance' };
    const toolResponse = await fetch(`${BASE_URL}/mcp/tools/analyze_journal_entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInput)
    });

    if (toolResponse.ok) {
      const result = await toolResponse.json();
      console.log('✅ Tool execution successful');
      console.log('   Analysis result:', JSON.stringify(result, null, 2));
    } else {
      const error = await toolResponse.json();
      console.log('❌ Tool execution failed:', error.error);
      return;
    }

    console.log('\n🎉 All widget tests passed! The ChatGPT widget is ready.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testWidget();
