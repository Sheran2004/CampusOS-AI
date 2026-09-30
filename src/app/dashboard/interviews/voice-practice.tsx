'use client';

/**
 * Voice Mock Interview — Web Speech API
 * - Uses browser-native SpeechRecognition (no API key required)
 * - Falls back to text input if SpeechRecognition is not supported
 * - Speaks questions aloud via SpeechSynthesis (TTS)
 * - Works in Chrome, Edge, Safari (limited). Not in Firefox.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mic, MicOff, Volume2, ChevronRight, Check, Trophy, AlertCircle, Square } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  history: any[];
  avgScore: number;
}

const INTERVIEW_TYPES = [
  { value: 'Frontend Developer', label: 'Frontend Developer', emoji: '🎨' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer', emoji: '🔗' },
  { value: 'Backend Developer', label: 'Backend Developer', emoji: '⚙️' },
  { value: 'DSA', label: 'DSA / Coding', emoji: '🧠' },
  { value: 'HR', label: 'HR / Behavioral', emoji: '💬' },
];

// Minimal types so we don't depend on @types/dom for these experimental APIs
type SR = any;
type SS = SpeechSynthesis;

export function VoicePractice({ history, avgScore }: Props) {
  const [step, setStep] = useState<'setup' | 'interview' | 'feedback'>('setup');
  const [interviewType, setInterviewType] = useState('Full Stack Developer');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState({ sr: false, tts: false });

  const recognitionRef = useRef<SR | null>(null);
  const synthesisRef = useRef<SS | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSupported({ sr: !!SR, tts: 'speechSynthesis' in window });
      synthesisRef.current = window.speechSynthesis;
    }
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      synthesisRef.current?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    // Try to pick an English voice; otherwise first available
    const voices = synthesisRef.current.getVoices();
    const enVoice =
      voices.find((v) => v.lang?.toLowerCase().startsWith('en')) || voices[0];
    if (enVoice) utter.voice = enVoice;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synthesisRef.current.speak(utter);
  }, []);

  const startListening = () => {
    setError('');
    if (!supported.sr) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      let final = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript + ' ';
        else interimText += r[0].transcript;
      }
      if (final) {
        setTranscript((t) => (t + final).trim());
      }
      setInterim(interimText);
    };
    recognition.onerror = (e: any) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone access denied. Please allow microphone in your browser settings.');
      } else if (e.error !== 'no-speech') {
        setError(`Speech recognition error: ${e.error}`);
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (err: any) {
      setError(`Could not start microphone: ${err.message}`);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  };

  const startInterview = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'questions', role: interviewType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setTranscript('');
      setFeedback(null);
      setStep('interview');
      // Speak first question after a brief delay so UI updates first
      setTimeout(() => speak(data.questions[0]), 400);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const answer = (transcript + ' ' + interim).trim();
    if (answer.length < 20) {
      setError('Please speak at least 20 characters. You can also type your answer.');
      return;
    }
    stopListening();
    synthesisRef.current?.cancel();
    setError('');
    setLoading(true);
    const t = toast.loading('Analyzing your voice answer...');
    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          question: questions[currentIdx],
          answer,
          role: interviewType,
          isVoice: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback(data.feedback);
      setStep('feedback');
      toast.success(`Voice interview score: ${data.feedback.score}/100`, { id: t });
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed', { id: t, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      setTranscript('');
      setInterim('');
      setFeedback(null);
      setStep('interview');
      setTimeout(() => speak(questions[next]), 300);
    } else {
      synthesisRef.current?.cancel();
      setStep('setup');
      setCurrentIdx(0);
      setTranscript('');
      setInterim('');
      setFeedback(null);
      setQuestions([]);
      toast.success('🎉 Voice interview session complete!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Browser support notice */}
      {!supported.sr && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Voice mode limited:</strong> Your browser doesn't support speech recognition.
            Voice interview works best in <strong>Chrome or Edge</strong>. You can still type your
            answer in the text box below.
          </div>
        </div>
      )}

      {/* Setup */}
      {step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-violet-600" />
              Start a voice interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Choose interview type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setInterviewType(t.value)}
                    className={`p-3 rounded-lg border text-center text-sm transition ${
                      interviewType === t.value
                        ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold'
                        : 'border-border hover:border-violet-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-lg p-4 text-sm border border-violet-500/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                How voice interviews work
              </h4>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>The AI will <strong>speak each question aloud</strong> to you</li>
                <li>Click the <strong>microphone</strong> to start recording your answer</li>
                <li>Speak naturally — we'll transcribe in real-time</li>
                <li>Submit to get the same AI feedback as text mode, with <strong>speech clarity scoring</strong></li>
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                🔒 Your audio is processed entirely in your browser. Nothing is sent to a server except the final transcript text.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button onClick={startInterview} loading={loading} size="lg" className="w-full">
              <Volume2 className="h-4 w-4" />
              Start Voice Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Interview in progress */}
      {step === 'interview' && questions[currentIdx] && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Question {currentIdx + 1} of {questions.length}
              </CardTitle>
              <Badge variant="info">{interviewType}</Badge>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20 flex items-start gap-3">
              <button
                onClick={() => speak(questions[currentIdx])}
                className="flex-shrink-0 h-9 w-9 rounded-full bg-violet-500/20 hover:bg-violet-500/30 flex items-center justify-center transition"
                aria-label="Read question aloud"
                disabled={!supported.tts}
              >
                <Volume2 className={`h-4 w-4 text-violet-600 ${speaking ? 'animate-pulse' : ''}`} />
              </button>
              <p className="text-lg font-medium flex-1">{questions[currentIdx]}</p>
            </div>

            {/* Mic control */}
            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-secondary/30 border border-dashed">
              {!listening ? (
                <button
                  onClick={startListening}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:opacity-90 transition flex items-center justify-center shadow-lg"
                  aria-label="Start recording"
                  disabled={!supported.sr}
                >
                  <Mic className="h-7 w-7 text-white" />
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 animate-pulse transition flex items-center justify-center shadow-lg"
                  aria-label="Stop recording"
                >
                  <Square className="h-6 w-6 text-white" />
                </button>
              )}
              <div className="text-sm text-muted-foreground">
                {listening
                  ? '🎙️ Listening... speak your answer'
                  : supported.sr
                    ? 'Click mic to record, or type below'
                    : 'Type your answer below (mic unavailable)'}
              </div>
            </div>

            {/* Transcript / text input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your answer{' '}
                <span className="text-muted-foreground">
                  ({transcript.length + interim.length} characters)
                </span>
              </label>
              <textarea
                value={transcript + (interim ? ' ' + interim : '')}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Click the mic and speak, or type your answer here..."
                rows={6}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {interim && (
                <div className="mt-1 text-xs text-muted-foreground italic">
                  Hearing: {interim}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={submitAnswer} loading={loading} className="flex-1">
                Submit Answer <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => { stopListening(); synthesisRef.current?.cancel(); setStep('setup'); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {step === 'feedback' && feedback && (
        <Card className="overflow-hidden">
          <div className={`p-6 border-b bg-gradient-to-r ${
            feedback.score >= 75
              ? 'from-emerald-500/10 to-teal-500/10'
              : feedback.score >= 50
                ? 'from-yellow-500/10 to-orange-500/10'
                : 'from-red-500/10 to-pink-500/10'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <Badge variant={feedback.score >= 75 ? 'success' : feedback.score >= 50 ? 'warning' : 'danger'}>
                {feedback.score >= 75 ? '🎉 Excellent' : feedback.score >= 50 ? '👍 Good' : '🎯 Practice more'}
              </Badge>
              <Badge variant="info">
                <Mic className="h-3 w-3 mr-1" /> Voice
              </Badge>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${scoreColor(feedback.score)}`}>
                {feedback.score}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Overall /100</div>
              <p className="text-base mt-4 max-w-2xl mx-auto">{feedback.feedback}</p>
            </div>
          </div>

          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <ScoreBar label="Content" score={feedback.contentScore} />
              <ScoreBar label="Clarity" score={feedback.clarityScore} />
              <ScoreBar label="Confidence" score={feedback.confidenceScore} />
            </div>

            {feedback.improvements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">🎯 How to improve</h4>
                <ul className="space-y-2">
                  {feedback.improvements.map((imp: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {currentIdx < questions.length - 1 ? (
                <Button onClick={nextQuestion} className="flex-1">
                  Next Question <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={nextQuestion} variant="default" className="flex-1">
                  <Trophy className="h-4 w-4" /> Finish Voice Interview
                </Button>
              )}
              <Button variant="outline" onClick={() => { synthesisRef.current?.cancel(); setStep('setup'); }}>
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice interview stats */}
      {history.filter((h: any) => h.isVoice).length > 0 && step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" /> Voice Interview History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">
              You have done <strong>{history.filter((h: any) => h.isVoice).length}</strong> voice interviews.
              Average voice score: <strong className={scoreColor(avgScore)}>{avgScore}/100</strong>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const cls =
    score >= 75 ? 'text-emerald-600' :
    score >= 50 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="text-center p-3 rounded-lg bg-secondary/30">
      <div className={`text-2xl font-bold ${cls}`}>{score}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}