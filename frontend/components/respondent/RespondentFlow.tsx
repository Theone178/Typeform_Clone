"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PublicForm } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { getQuestionTypeDefinition } from "@/lib/questionTypes";
import { ProgressBar } from "./ProgressBar";
import { NavigationControls } from "./NavigationControls";
import { WelcomeScreen } from "./WelcomeScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { QuestionRenderer } from "./QuestionRenderer";

interface RespondentFlowProps {
  form: PublicForm;
}

export const RespondentFlow: React.FC<RespondentFlowProps> = ({ form }) => {
  // State machine: -1 = Welcome screen, 0..N-1 = Questions, N = Thank You screen
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [direction, setDirection] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Sync ref for immediate access to prevent asynchronous/stale-closure race conditions
  const answersRef = useRef<Record<string, any>>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const questions = useMemo(
    () => [...form.questions].sort((a, b) => a.position - b.position),
    [form.questions]
  );

  const totalQuestions = questions.length;
  const isWelcome = currentIndex === -1;
  const isThankYou = currentIndex === totalQuestions;
  const currentQuestion = currentIndex >= 0 && currentIndex < totalQuestions ? questions[currentIndex] : null;

  // Apply theme styles
  const primaryColor = form.theme?.primary_color || "#7c3aed";
  const backgroundColor = form.theme?.background_color || "#ffffff";
  const textColor = form.theme?.text_color || "#191919";

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (isWelcome) return 0;
    if (isThankYou) return 100;
    return ((currentIndex + 1) / totalQuestions) * 100;
  }, [isWelcome, isThankYou, currentIndex, totalQuestions]);

  const handleStart = () => {
    setStartedAt(new Date().toISOString());
    setDirection(1);
    setCurrentIndex(0);
  };

  // Requirement 1: Clear the error for a question immediately as soon as its answer changes
  const handleAnswerChange = useCallback((questionId: string, val: any) => {
    answersRef.current[questionId] = val;
    setAnswers((prev) => ({ ...prev, [questionId]: val }));

    // Unconditionally remove the error for this question using a functional updater
    setErrors((prev) => {
      if (!(questionId in prev)) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const submittedAt = new Date().toISOString();

    const formattedAnswers = Object.entries(answersRef.current).map(([question_id, value]) => ({
      question_id,
      value,
    }));

    try {
      await api.submitFormResponse(form.slug, {
        answers: formattedAnswers,
        started_at: startedAt || submittedAt,
        submitted_at: submittedAt,
      });

      setDirection(1);
      setCurrentIndex(totalQuestions); // Jump to Thank You
    } catch (err: any) {
      if (err instanceof ApiError && err.errors && err.errors.length > 0) {
        // Map server-side validation errors inline
        const newErrors: Record<string, string> = {};
        let firstBadIndex = -1;

        err.errors.forEach((e) => {
          if (e.question_id) {
            newErrors[e.question_id] = e.error;
            const qIndex = questions.findIndex((q) => q.id === e.question_id);
            if (qIndex !== -1 && (firstBadIndex === -1 || qIndex < firstBadIndex)) {
              firstBadIndex = qIndex;
            }
          }
        });

        setErrors(newErrors);

        // Jump respondent to the first question with an error
        if (firstBadIndex !== -1) {
          setDirection(-1);
          setCurrentIndex(firstBadIndex);
        }
      } else {
        alert(err.message || "Failed to submit response. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Requirement 3: Re-validate on advance rather than relying on an old error state
  const handleNext = useCallback(() => {
    if (isWelcome) {
      handleStart();
      return;
    }

    if (isThankYou || isSubmitting) return;

    if (!currentQuestion) return;

    // Validate the latest answer value from answersRef directly
    const currentVal = answersRef.current[currentQuestion.id];
    const def = getQuestionTypeDefinition(currentQuestion.type);
    const validationError = def.validate(currentVal, currentQuestion.required, currentQuestion.config);

    if (validationError) {
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: validationError }));
      return;
    }

    // Clear any residual error if now valid
    setErrors((prev) => {
      if (!(currentQuestion.id in prev)) return prev;
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });

    if (currentIndex === totalQuestions - 1) {
      handleSubmit();
    } else {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isWelcome, isThankYou, isSubmitting, currentIndex, totalQuestions, currentQuestion]);

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0 || isThankYou || isSubmitting) return;
    setDirection(-1);
    setCurrentIndex((prev) => prev - 1);
  }, [currentIndex, isThankYou, isSubmitting]);

  // Keep refs for navigation handlers to avoid stale closures in event listeners
  const handleNextRef = useRef(handleNext);
  const handlePrevRef = useRef(handlePrev);
  useEffect(() => {
    handleNextRef.current = handleNext;
    handlePrevRef.current = handlePrev;
  });

  // Global Keyboard Navigation (Enter, ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Enter on text inputs if user is navigating dropdowns
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        e.preventDefault();
        handleNextRef.current();
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
        e.preventDefault();
        handleNextRef.current();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
        e.preventDefault();
        handlePrevRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Slide Animation Variants (up and down based on direction)
  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        y: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        y: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor,
        color: textColor,
        fontFamily: form.theme?.font ? `var(--font-${form.theme.font.toLowerCase()}), sans-serif` : undefined,
      }}
    >
      {/* Top Progress Bar */}
      <ProgressBar progress={progress} primaryColor={primaryColor} />

      {/* Main Slide Carousel */}
      <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait" custom={direction}>
          {isWelcome && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <WelcomeScreen
                form={form}
                onStart={handleStart}
                primaryColor={primaryColor}
                textColor={textColor}
              />
            </motion.div>
          )}

          {currentQuestion && !isThankYou && (
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <QuestionRenderer
                question={currentQuestion}
                index={currentIndex}
                value={answers[currentQuestion.id]}
                onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                onNext={handleNext}
                error={errors[currentQuestion.id]}
                primaryColor={primaryColor}
                textColor={textColor}
              />
            </motion.div>
          )}

          {isThankYou && (
            <motion.div
              key="thank-you"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <ThankYouScreen
                thankYou={form.thank_you}
                primaryColor={primaryColor}
                textColor={textColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submitting Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="font-medium text-base">Submitting your response...</span>
          </div>
        </div>
      )}

      {/* Signature Bottom-Right Navigation Arrows */}
      {!isWelcome && !isThankYou && (
        <NavigationControls
          onPrev={handlePrev}
          onNext={handleNext}
          canPrev={currentIndex > 0}
          canNext={currentIndex < totalQuestions - 1}
          primaryColor={primaryColor}
          textColor={textColor}
        />
      )}
    </div>
  );
};
