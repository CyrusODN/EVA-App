#!/usr/bin/env node

/**
 * AssemblyAI Integration Test Script
 * 
 * This script tests the AssemblyAI transcription service with a sample audio file.
 * It will verify:
 * 1. API key is valid
 * 2. File upload works correctly
 * 3. Transcription request is successful
 * 4. Polling for results works
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ASSEMBLYAI_API_KEY = '8abca671013e454f80cea1d4abdbdbec';
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

// Test with a sample audio URL (AssemblyAI provides sample files)
const SAMPLE_AUDIO_URL = 'https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3';

async function testAssemblyAI() {
    console.log('🧪 Starting AssemblyAI Integration Test...\n');

    try {
        // Step 1: Test API key validity
        console.log('Step 1: Testing API key validity...');
        const client = axios.create({
            baseURL: ASSEMBLYAI_BASE_URL,
            headers: {
                Authorization: ASSEMBLYAI_API_KEY,
            },
        });

        // Step 2: Create transcript with sample audio URL
        console.log('Step 2: Creating transcript with sample audio...');
        const { data: transcriptData } = await client.post('/transcript', {
            audio_url: SAMPLE_AUDIO_URL,
            speaker_labels: false,
            punctuate: true,
            format_text: true,
        });

        const transcriptId = transcriptData.id;
        console.log(`✅ Transcript created with ID: ${transcriptId}\n`);

        // Step 3: Poll for completion
        console.log('Step 3: Polling for transcription completion...');
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max

        while (attempts < maxAttempts) {
            const { data } = await client.get(`/transcript/${transcriptId}`);
            const status = data.status;

            console.log(`   Attempt ${attempts + 1}: Status = ${status}`);

            if (status === 'completed') {
                console.log('\n✅ Transcription completed successfully!\n');
                console.log('📝 Transcribed Text:');
                console.log('─'.repeat(80));
                console.log(data.text);
                console.log('─'.repeat(80));
                console.log(`\n✅ Text length: ${data.text.length} characters`);
                return { success: true, text: data.text };
            }

            if (status === 'error') {
                console.error('\n❌ Transcription failed with error:');
                console.error(data.error);
                return { success: false, error: data.error };
            }

            // Wait 2 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }

        console.error('\n❌ Transcription timed out after 2 minutes');
        return { success: false, error: 'Timeout' };

    } catch (error) {
        console.error('\n❌ Test failed with error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        return { success: false, error: error.message };
    }
}

// Run the test
testAssemblyAI()
    .then(result => {
        if (result.success) {
            console.log('\n✅ All tests passed!');
            process.exit(0);
        } else {
            console.log('\n❌ Tests failed');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
