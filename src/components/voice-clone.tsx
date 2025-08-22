import React, { useState } from 'react';

const VoiceClone: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleRecord = async () => {
    if (recording) {
      mediaRecorder?.stop();
      setRecording(false);
      return;
    }
    setRecordedChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const file = new File([blob], 'recorded-audio.webm', { type: 'audio/webm' });
        setAudioFile(file);
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied or not available.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setError('Please upload or record an audio file.');
      return;
    }
    setLoading(true);
    setError(null);
    setOutputUrl(null);
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (text) formData.append('text', text);
    try {
      const res = await fetch('/api/clone-voice', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Voice cloning failed.');
      }
      const blob = await res.blob();
      setOutputUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Voice Cloning</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button
          type="button"
          className={`bg-green-500 text-white px-4 py-2 rounded ${recording ? 'bg-red-500' : ''}`}
          onClick={handleRecord}
        >
          {recording ? 'Stop Recording' : 'Record Voice'}
        </button>
        {audioFile && (
          <div className="mt-2 text-sm text-gray-700">Selected: {audioFile.name}</div>
        )}
        <input
          type="text"
          placeholder="Text to speak (optional)"
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Cloning...' : 'Clone Voice'}
        </button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {outputUrl && (
        <div className="mt-4">
          <audio controls src={outputUrl} />
        </div>
      )}
    </div>
  );
};

export default VoiceClone;
