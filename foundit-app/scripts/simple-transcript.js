// Simulador simple de transcripción para testing
function generateMockTranscript(videoTitle, videoId) {
  // Datos mock realistas basados en el título del video
  const mockData = {
    transcript: `Welcome to this video about ${videoTitle}. In this presentation, we'll discuss the key concepts and important tools mentioned. This is a mock transcript for testing purposes. The video covers various technologies, frameworks, and methodologies that are relevant to the topic. We'll explore best practices, implementation strategies, and real-world applications. Thank you for watching this educational content about ${videoTitle}.`,
    
    aiSummary: {
      mainTopic: videoTitle,
      description: `This video discusses ${videoTitle} and covers key concepts and methodologies.`,
      toolsMentioned: ['JavaScript', 'Node.js', 'API', 'Framework'],
      keyConcepts: ['Development', 'Technology', 'Best Practices', 'Implementation'],
      language: 'en'
    },
    
    transcriptSource: 'mock',
    hasTranscript: true,
    processedAt: new Date().toISOString()
  };
  
  return {
    success: true,
    ...mockData
  };
}

module.exports = { generateMockTranscript };