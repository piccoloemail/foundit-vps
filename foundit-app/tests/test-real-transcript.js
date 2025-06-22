// Test con una memoria real del sistema
async function testWithRealMemory() {
  console.log('🧪 Testing with a real memory from the database...\n');
  
  const realMemoryId = '24bb3547-4ccc-4b52-ac04-d6b3a9facf1d'; // De la lista que obtuvimos
  const testTranscript = `Welcome to this tutorial about using component libraries when AI prototyping. Today we're going to learn how to efficiently build user interfaces by leveraging existing design systems and components.

First, let's talk about why component libraries are essential. They provide consistency, save development time, and ensure that your prototypes look professional from the start.

We'll cover tools like Material-UI, Ant Design, and Chakra UI. These libraries offer pre-built components that you can quickly integrate into your React applications.

The key is to choose a library that matches your design requirements and has good documentation. This will help you move faster when building AI-powered prototypes.`;

  try {
    const response = await fetch('http://localhost:3000/api/process-manual-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memoryId: realMemoryId,
        transcript: testTranscript,
        videoTitle: 'Use your Component Library when AI Prototyping — Lightning Lesson'
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response OK:', response.ok);
    
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Manual transcript processing successful!');
      console.log('🧠 AI Summary generated:', data.data?.aiSummary ? 'Yes' : 'No');
    } else {
      console.error('\n❌ Error:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testWithRealMemory();