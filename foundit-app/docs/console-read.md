// Formatear transcript con timestamps estilo YouTube MEJORADO
const words = $json.words || [];
const fullTranscript = $json.text || '';

let transcriptWithTimestamps = '';
let currentSegmentWords = []; // Almacena las palabras del segmento actual
let segmentStartTime = 0; // Tiempo de inicio del segmento actual (en milisegundos)

// Configuración para la segmentación (puedes ajustar estos valores)
const MIN_SEGMENT_LENGTH_CHARS = 80;  // Mínimo de caracteres por segmento
const MAX_SEGMENT_LENGTH_CHARS = 150; // Máximo de caracteres por segmento
const MIN_SEGMENT_DURATION_SECONDS = 8;  // Mínimo de segundos por segmento
const MAX_SEGMENT_DURATION_SECONDS = 20; // Máximo de segundos por segmento

for (let i = 0; i < words.length; i++) {
  const word = words[i];

  // Si estamos empezando un nuevo segmento, registramos su tiempo de inicio
  if (currentSegmentWords.length === 0) {
    segmentStartTime = word.start; // 'start' de la primera palabra del segmento
  }

  currentSegmentWords.push(word); // Añadimos la palabra actual al segmento

  // Calculamos el texto y la duración del segmento actual
  const currentSegmentText = currentSegmentWords.map(w => w.text).join(' ');
  // La duración se calcula desde el inicio del segmento hasta el final de la ÚLTIMA palabra añadida
  const currentSegmentDuration = (word.end - segmentStartTime) / 1000; // Convertir a segundos

  let shouldEndSegment = false;

  // Condición 1: El segmento ha alcanzado la longitud mínima Y cumple uno de los criterios de finalización
  if (currentSegmentText.length >= MIN_SEGMENT_LENGTH_CHARS) {
    if (
      currentSegmentText.length >= MAX_SEGMENT_LENGTH_CHARS || // El segmento es demasiado largo
      currentSegmentDuration >= MAX_SEGMENT_DURATION_SECONDS || // El segmento ha durado demasiado tiempo
      word.text.match(/[.!?]$/) || // La palabra actual termina con puntuación (fin de oración)
      i === words.length - 1 // Es la última palabra de toda la transcripción
    ) {
      shouldEndSegment = true;
    }
  } 
  // Condición 2: Forzar el final si la duración del segmento es demasiado larga, o si es la última palabra
  else if (currentSegmentDuration >= MAX_SEGMENT_DURATION_SECONDS || i === words.length - 1) {
    shouldEndSegment = true;
  }

  // Si se debe finalizar el segmento y hay palabras en él
  if (shouldEndSegment && currentSegmentWords.length > 0) {
    // Formatear el timestamp a MM:SS
    const minutes = Math.floor(segmentStartTime / (1000 * 60));
    const seconds = Math.floor((segmentStartTime / 1000) % 60);
    const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Añadir el segmento formateado a la transcripción final
    transcriptWithTimestamps += `${timestamp}\n${currentSegmentText.trim()}\n\n`;

    // Reiniciar para el siguiente segmento
    currentSegmentWords = [];
    segmentStartTime = 0; // Reiniciar el tiempo de inicio
  }
}

// Asegurarse de que el último segmento se añada si no se hizo dentro del bucle
// (Esto es una medida de seguridad, la lógica del bucle debería manejarlo con 'i === words.length - 1')
if (currentSegmentWords.length > 0) {
  const minutes = Math.floor(segmentStartTime / (1000 * 60));
  const seconds = Math.floor((segmentStartTime / (1000)) % 60);
  const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const finalSegmentText = currentSegmentWords.map(w => w.text).join(' ');
  transcriptWithTimestamps += `${timestamp}\n${finalSegmentText.trim()}`;
}

return {
  status: "completed",
  transcript: fullTranscript,
  transcriptWithTimestamps: transcriptWithTimestamps.trim(),
  video_id: $node["Code1"].json.video_id,
  youtube_url: $node["Code1"].json.youtube_url,
  memory_id: $node["Code1"].json.memory_id
};


podrias actualzar el readme? tambien necesitaria las instrucciones basicas de N8N.md con una idea de lo que me reomienas para overlo a un VPN