import SpeakButton from './SpeakButton'

export default function PoiDrillStep({
  current,
  currentIdx,
  total,
  phase,
  userAnswer,
  onUserAnswerChange,
  onShowAnswer,
  onNext,
  onBack,
}) {
  return (
    <>
      <div className="text-xs text-stone-500 flex items-center justify-between">
        <span>
          {current.argLabel} · 第 {currentIdx + 1} / {total} 题
        </span>
        <button
          onClick={onBack}
          className="text-xs text-stone-500 hover:text-stone-900"
        >
          ← 选择论点
        </button>
      </div>

      <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
            问题
          </div>
          {current.poi.question_en && (
            <SpeakButton text={current.poi.question_en} rate={0.85} label="听发音" />
          )}
        </div>
        {current.poi.question_en && (
          <p className="text-stone-800 whitespace-pre-wrap leading-relaxed">
            {current.poi.question_en}
          </p>
        )}
        {current.poi.question_zh && (
          <p className="text-stone-500 whitespace-pre-wrap leading-relaxed">
            {current.poi.question_zh}
          </p>
        )}
      </section>

      {phase === 'answering' && (
        <div className="space-y-3">
          <textarea
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="可选:在这里写下你的答案…"
            rows={4}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none resize-y bg-white"
          />
          <button
            onClick={onShowAnswer}
            className="px-5 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
          >
            查看参考答案
          </button>
        </div>
      )}

      {phase === 'comparing' && (
        <>
          {userAnswer.trim() && (
            <section className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
              <div className="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-2">
                你的答案
              </div>
              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {userAnswer}
              </p>
            </section>
          )}
          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
            <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
              参考答案
            </div>
            {current.poi.answer_en && (
              <p className="text-stone-800 whitespace-pre-wrap leading-relaxed">
                {current.poi.answer_en}
              </p>
            )}
            {current.poi.answer_zh && (
              <p className="text-stone-500 whitespace-pre-wrap leading-relaxed">
                {current.poi.answer_zh}
              </p>
            )}
          </section>

          <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-stone-200 px-4 py-3 z-10">
            <div className="max-w-5xl mx-auto flex justify-center gap-3">
              <button
                onClick={() => onNext(true)}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
              >
                满意 ✓
              </button>
              <button
                onClick={() => onNext(false)}
                className="px-5 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
              >
                需要再练
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
