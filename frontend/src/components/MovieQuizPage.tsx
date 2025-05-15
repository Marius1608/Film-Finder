'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot, Loader2, Gamepad2, Trophy
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  quizData?: QuizQuestion[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export default function MovieQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    startQuiz();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startQuiz = async () => {
    setMessages([{
      role: 'assistant',
      content: 'Welcome to the Movie Quiz! I\'ll create 5 challenging questions about movies based on our database. Ready to test your knowledge? 🎬',
      timestamp: new Date()
    }]);
   
    setTimeout(() => {
      generateQuiz();
    }, 1500);
  };

  const generateQuiz = async () => {
    setIsLoading(true);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    
    let questionsGenerated = false;
    let source = 'database';
    
    try {
      const response = await axios.post('/chatbot/generate-quiz', {
        count: 5
      });
      
      const { questions, source: responseSource } = response.data;
      
      if (questions && questions.length > 0) {
        setCurrentQuiz(questions);
        questionsGenerated = true;
        source = responseSource || 'AI';
      }
    } catch (error) {
      console.error('Error generating quiz with AI:', error);
    }
    
    if (!questionsGenerated) {
      const fallbackQuestions: QuizQuestion[] = [
        {
          question: "Which movie won the Academy Award for Best Picture in 1994?",
          options: ["Pulp Fiction", "Forrest Gump", "The Shawshank Redemption", "Four Weddings and a Funeral"],
          correct: 1,
          explanation: "Forrest Gump won Best Picture at the 67th Academy Awards."
        },
        {
          question: "Who directed the movie 'The Dark Knight' (2008)?",
          options: ["Tim Burton", "Christopher Nolan", "Zack Snyder", "Matt Reeves"],
          correct: 1,
          explanation: "Christopher Nolan directed The Dark Knight trilogy."
        },
        {
          question: "In which year was the original 'Star Wars' movie released?",
          options: ["1975", "1977", "1979", "1981"],
          correct: 1,
          explanation: "Star Wars (later renamed A New Hope) was released in 1977."
        },
        {
          question: "Which actor played the lead role in 'The Godfather'?",
          options: ["Robert De Niro", "Al Pacino", "Marlon Brando", "James Caan"],
          correct: 2,
          explanation: "Marlon Brando played Don Vito Corleone in The Godfather."
        },
        {
          question: "What is the highest-grossing film of all time (not adjusted for inflation)?",
          options: ["Avengers: Endgame", "Avatar", "Titanic", "Star Wars: The Force Awakens"],
          correct: 1,
          explanation: "Avatar (2009) is the highest-grossing film with over $2.9 billion worldwide."
        }
      ];

      setCurrentQuiz(fallbackQuestions);
      source = 'database';
    }
    
    setIsLoading(false);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great! I've prepared 5 questions for you using ${source === 'AI' ? 'AI' : 'our database'}. Let's start with question 1:`,
      timestamp: new Date()
    }]);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentQuiz) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuiz[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setShowResult(true);

    setTimeout(() => {
      if (currentQuestion < currentQuiz.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        endQuiz();
      }
    }, 2000);
  };

  const endQuiz = () => {
    const finalScore = score + (selectedAnswer === currentQuiz![currentQuestion].correct ? 1 : 0);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Quiz completed! 🎉\n\nYour final score: ${finalScore}/5\n\n${
        finalScore === 5 ? 'Perfect score! You\'re a true movie expert! 🏆' :
        finalScore >= 3 ? 'Great job! You know your movies! 🌟' :
        'Good effort! Keep watching and learning! 📺'
      }\n\nWould you like to play again?`,
      timestamp: new Date()
    }]);

    setTimeout(() => {
      setCurrentQuiz(null);
    }, 1000);
  };

  const playAgain = () => {
    setMessages([]);
    setCurrentQuiz(null);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    startQuiz();
  };

  const currentQuizQuestion = currentQuiz?.[currentQuestion];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Movie Quiz Challenge
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Test your movie knowledge with AI-generated questions</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <span>Quiz Master</span>
                  </div>
                  {currentQuiz && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-bold">{score}/5</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex animate-slide-in",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-xl p-4",
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100'
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-xl p-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                  
                  {!currentQuiz && !isLoading && messages.length > 2 && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={playAgain}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Play Again
                      </Button>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {currentQuizQuestion && (
              <Card className="shadow-xl border-0 animate-scale-in">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <CardTitle>Question {currentQuestion + 1} of 5</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{currentQuizQuestion.question}</h3>
                  
                  <div className="space-y-3">
                    {currentQuizQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={selectedAnswer !== null}
                        variant={
                          selectedAnswer === null ? "outline" :
                          index === currentQuizQuestion.correct ? "default" :
                          index === selectedAnswer ? "destructive" :
                          "outline"
                        }
                        className={cn(
                          "w-full justify-start text-left h-auto p-4",
                          selectedAnswer === null && "hover:border-purple-500",
                          index === currentQuizQuestion.correct && selectedAnswer !== null && "bg-green-500 hover:bg-green-600",
                          index === selectedAnswer && index !== currentQuizQuestion.correct && "bg-red-500 hover:bg-red-600"
                        )}
                      >
                        <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>
                  
                  {showResult && (
                    <div className={cn(
                      "mt-4 p-4 rounded-lg animate-fade-in",
                      selectedAnswer === currentQuizQuestion.correct ? "bg-green-100" : "bg-red-100"
                    )}>
                      <p className="font-semibold">
                        {selectedAnswer === currentQuizQuestion.correct ? "✅ Correct!" : "❌ Incorrect"}
                      </p>
                      <p className="text-sm mt-1">{currentQuizQuestion.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {currentQuiz && (
              <Card className="mt-4 shadow-lg border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-600">{currentQuestion + 1}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestion + 1) / 5) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}