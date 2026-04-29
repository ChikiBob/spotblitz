import { useEffect, useRef, useState } from 'react';

export default function AnswerGrid({ roundData, myInfo, myScore, cooldown, feedback, onAnswer }) {
  const { items, targetItem, timeLimit, roundNumber, totalRounds } = roundData;
  const [timeLeft, setTimeLeft]     = useState(timeLimit);
  const [selected, setSelected]     = useState(null);  // last tapped itemId
  const [answered, setAnswered]     = useState(false);
  const timerRef = useRef(null);

  // Reset state on new round
  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelected(null);
    setAnswered(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [roundData, timeLimit]);

  // Stop timer when feedback arrives (round over)
  useEffect(() => {
    if (feedback === 'correct' || feedback === 'timeout' || feedback === 'roundover') {
      clearInterval(timerRef.current);
      setAnswered(true);
    }
  }, [feedback]);

  const handleTap = (item) => {
    if (answered || cooldown) return;
    setSelected(item.id);
    // Haptic
    if (navigator.vibrate) navigator.vibrate(30);
    onAnswer(item.id);
  };

  const urgent = timeLeft <= 10;

  // Determine item state
  const getItemState = (item) => {
    if (feedback === 'correct' && item.id === targetItem.id) return 'state-correct';
    if (feedback === 'timeout' && item.id === targetItem.id) return 'state-correct';
    if (selected === item.id && cooldown) return 'state-wrong';
    if (answered) return 'state-locked';
    if (cooldown)  return 'state-cooldown';
    return '';
  };

  return (
    <div className="answer-screen">
      {/* Header */}
      <div className="answer-header">
        <div className="answer-header__target">
          <div>
            <div className="answer-header__label">Find it!</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="answer-header__emoji">{targetItem?.emoji}</span>
              <span className="answer-header__name">{targetItem?.name}</span>
            </div>
          </div>
        </div>

        <div className={`answer-header__timer ${urgent ? 'urgent' : ''}`}>
          {timeLeft}s
        </div>

        <div className="answer-header__score">
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>Score</span>
          <strong>{myScore}</strong>
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
            Round {roundNumber}/{totalRounds}
          </span>
        </div>
      </div>

      {/* Item Grid — 3×4 */}
      <div className="answer-grid">
        {items.map((item, idx) => (
          <button
            key={item.id}
            id={`item-${item.id}`}
            className={`answer-item ${getItemState(item)}`}
            style={{ animationDelay: `${idx * 35}ms` }}
            onClick={() => handleTap(item)}
            aria-label={item.name}
          >
            <span className="answer-item__emoji">{item.emoji}</span>
            <span className="answer-item__name">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Cooldown notice */}
      {cooldown && (
        <div className="cooldown-overlay">
          ❌ Wrong! Wait 2 seconds…
        </div>
      )}

      {/* Full-screen feedback overlay */}
      {feedback === 'correct' && (
        <div className="feedback-overlay correct">
          <div className="feedback-icon">✅</div>
          <div className="feedback-title">Correct!</div>
          <div className="feedback-sub">You found it first! +100 pts</div>
          <div className="feedback-score">{myScore + 100} pts</div>
        </div>
      )}
      {feedback === 'roundover' && (
        <div className="feedback-overlay wrong" style={{ background: 'rgba(100,116,139,0.92)' }}>
          <div className="feedback-icon">😔</div>
          <div className="feedback-title">Too Slow!</div>
          <div className="feedback-sub">The other player got it first</div>
          <div className="feedback-score">{myScore} pts</div>
        </div>
      )}
      {feedback === 'timeout' && (
        <div className="feedback-overlay timeout">
          <div className="feedback-icon">⏰</div>
          <div className="feedback-title">Time's Up!</div>
          <div className="feedback-sub">
            The answer was <strong>{targetItem?.emoji} {targetItem?.name}</strong>
          </div>
          <div className="feedback-score">{myScore} pts</div>
        </div>
      )}
    </div>
  );
}
