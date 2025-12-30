const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Fetching Available Gemini Models...\n');

async function listModels(apiVersion) {
  try {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const models = response.data.models || [];
    console.log(`\n📋 Available Models for ${apiVersion} API:`);
    console.log('━'.repeat(80));
    
    models.forEach(model => {
      const name = model.name.replace('models/', '');
      const supportedMethods = model.supportedGenerationMethods || [];
      if (supportedMethods.includes('generateContent')) {
        console.log(`✅ ${name.padEnd(30)} - Supports: ${supportedMethods.join(', ')}`);
      }
    });
    
    return models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));
  } catch (error) {
    console.log(`❌ Error fetching ${apiVersion} models: ${error.response?.status || error.message}`);
    return [];
  }
}

(async () => {
  const v1Models = await listModels('v1');
  const v1betaModels = await listModels('v1beta');
  
  console.log('\n\n💡 RECOMMENDATION:');
  console.log('━'.repeat(80));
  
  const workingModels = [...v1Models, ...v1betaModels].filter(m => 
    m.supportedGenerationMethods?.includes('generateContent')
  );
  
  if (workingModels.length > 0) {
    const recommended = workingModels[0];
    const modelName = recommended.name.replace('models/', '');
    const apiVersion = v1Models.includes(recommended) ? 'v1' : 'v1beta';
    
    console.log(`\n🎯 Use this configuration:`);
    console.log(`   Model: ${modelName}`);
    console.log(`   API Version: ${apiVersion}`);
    console.log(`   URL: https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent`);
  } else {
    console.log('\n❌ No models with generateContent support found!');
    console.log('   This might be an API key issue or regional restriction.');
  }
})();
