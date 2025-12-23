import { Fragment, useEffect, useState } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import Swal from "sweetalert2";

const PER_QUESTION_MINUTES = 2;
const MAX_PRACTICE_ROUNDS = 3;
const MAX_GEN_PER_CATEGORY = 5;
const MIN_GEN_PER_CATEGORY = 0;

const safeNumber = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const isValidOriginalMCQ = (q) =>
  Array.isArray(q.answers) &&
  q.answers.length === 4 &&
  q.answers.every((t) => String(t || "").trim().length > 0);

// Validate a generated MCQ with A..D keys
const isValidGeneratedMCQ = (parsed) => {
  if (!parsed || !Array.isArray(parsed.options)) return false;
  if (parsed.options.length !== 4) return false;

  // options must have keys A..D and non-empty texts
  const keys = new Set(parsed.options.map((o) => String(o.key || "").toUpperCase()));
  const textsOk = parsed.options.every((o) => String(o.text || "").trim().length > 0);

  return (
    textsOk &&
    keys.size === 4 &&
    ["A", "B", "C", "D"].every((k) => keys.has(k))
  );
};


// -------------------------------
// Robust parser for generated MCQs
// -------------------------------
const parseGeneratedQA = (text) => {
  const raw = (text || "").replace(/\r/g, "");

  // Question
  const qMatch = raw.match(
    /Question:\s*([\s\S]*?)(?=\|\s*Option|\nOption|Correct\s*Answer:|Explanation:|$)/i
  );
  const question = qMatch ? qMatch[1].trim().replace(/\|$/, "").trim() : raw.trim();

  // Options A-D (allow multiline, pipes, or newlines)
  const options = [];
  const optRegex =
    /Option\s*([A-D])\s*:\s*([\s\S]*?)(?=\s*\|\s*Option|\nOption|\|\s*Correct\s*Answer:|\nCorrect\s*Answer:|\|\s*Explanation:|\nExplanation:|$)/gi;
  let m;
  while ((m = optRegex.exec(raw)) !== null) {
    options.push({ key: m[1].toUpperCase(), text: m[2].trim().replace(/\|$/, "").trim() });
  }
  // Fallback: lines like "A) text"
  if (options.length === 0) {
    const parts = raw.split("|").filter(Boolean).map((s) => s.trim());
    const inferred = parts.filter((s) => /^([A-D])[).:-]\s*/i.test(s));
    inferred.forEach((seg) => {
      const mm = seg.match(/^([A-D])[).:-]\s*(.*)$/i);
      if (mm) options.push({ key: mm[1].toUpperCase(), text: mm[2].trim() });
    });
  }

  // Correct answer (letter or text)
  let correctKey = null;
  let correctText = null;

  const caLetter = raw.match(/Correct\s*Answer\s*:\s*([A-D])\b/i);
  if (caLetter) correctKey = caLetter[1].toUpperCase();

  const caAny = raw.match(/Correct\s*Answer\s*:\s*([^\n|]+)(?!.*Correct\s*Answer)/im);
  if (!correctKey && caAny) correctText = caAny[1].trim().replace(/\|$/, "").trim();

  if (!correctKey && correctText && options.length) {
    const idx = options.findIndex((o) => o.text.toLowerCase() === correctText.toLowerCase());
    if (idx >= 0) correctKey = options[idx].key;
  }
  if (correctKey && !correctText) {
    const found = options.find((o) => o.key === correctKey);
    if (found) correctText = found.text;
  }

  // Explanation (prefer the last one, allow multiline to EOF)
  let explanation = "";
  const exMatches = [...raw.matchAll(/Explanation\s*:\s*([\s\S]*?)$/gim)];
  if (exMatches.length) {
    explanation = exMatches[exMatches.length - 1][1].trim().replace(/\|$/, "").trim();
  } else {
    const expShort = raw.match(/Explanation\s*:\s*([^\n|]+)/i);
    if (expShort) explanation = expShort[1].trim();
  }

  return { question, options, correctKey, correctText, explanation };
};

const StartingPaper = () => {
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  // original paper answering/evaluation
  const [studentAnswers, setStudentAnswers] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [totalCorrectMarks, setTotalCorrectMarks] = useState(0);
  const [totalAvailableMarks, setTotalAvailableMarks] = useState(0);
  const [percentage, setPercentage] = useState(0);

  // category payloads/predictions
  const [categoryPayloads, setCategoryPayloads] = useState({});
  const [categoryPredictions, setCategoryPredictions] = useState({});

  // practice flow
  const [practiceRound, setPracticeRound] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [nextPaper, setNextPaper] = useState([]);
  const [nextAnswers, setNextAnswers] = useState({});
  const [nextResults, setNextResults] = useState({});
  const [nextSubmitted, setNextSubmitted] = useState(false);
  const [nextScore, setNextScore] = useState(0);
  const [nextTotal, setNextTotal] = useState(0);

  const [practiceHistory, setPracticeHistory] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  const userId = localStorage.getItem("userId");

  const invertDifficulty = (d) => {
    const v = String(d || "").trim().toLowerCase();
    if (v === "easy") return "Hard";
    if (v === "hard") return "Easy";
    return d ?? "-";
  };

  // ---- Timing (original paper) ----
  const [qTimers, setQTimers] = useState({});
  const [activeQ, setActiveQ] = useState(null);
  const nowMs = () => Date.now();

  const ensureTimer = (qid) => {
    setQTimers((prev) => (prev[qid] ? prev : { ...prev, [qid]: { startAt: null, totalMs: 0, firstFocusAt: null, firstAnswerAt: null } }));
  };
  const startTiming = (qid) => {
    setQTimers((prev) => {
      const n = { ...prev };
      if (activeQ && n[activeQ]?.startAt != null) {
        const elapsed = nowMs() - n[activeQ].startAt;
        n[activeQ] = { ...n[activeQ], startAt: null, totalMs: n[activeQ].totalMs + Math.max(0, elapsed) };
      }
      if (!n[qid]) n[qid] = { startAt: null, totalMs: 0, firstFocusAt: null, firstAnswerAt: null };
      if (n[qid].startAt == null) {
        const t = nowMs();
        n[qid] = { ...n[qid], startAt: t, firstFocusAt: n[qid].firstFocusAt ?? t };
      }
      return n;
    });
    setActiveQ(qid);
  };
  const stopTiming = (qid) => {
    setQTimers((prev) => {
      const n = { ...prev };
      const t = n[qid];
      if (t?.startAt != null) {
        const elapsed = nowMs() - t.startAt;
        n[qid] = { ...t, startAt: null, totalMs: t.totalMs + Math.max(0, elapsed) };
      }
      return n;
    });
    if (activeQ === qid) setActiveQ(null);
  };
  const markFirstAnswerIfNeeded = (qid) => {
    setQTimers((prev) => {
      const t = prev[qid];
      if (!t || t.firstAnswerAt != null) return prev;
      return { ...prev, [qid]: { ...t, firstAnswerAt: nowMs() } };
    });
  };
  const stopActiveIfAny = () => {
    setQTimers((prev) => {
      const n = { ...prev };
      if (activeQ && n[activeQ]?.startAt != null) {
        const elapsed = nowMs() - n[activeQ].startAt;
        n[activeQ] = { ...n[activeQ], startAt: null, totalMs: n[activeQ].totalMs + Math.max(0, elapsed) };
      }
      return n;
    });
    setActiveQ(null);
  };

  // Per-category waited-time stats (computed at submit)
  const [categoryTimeStats, setCategoryTimeStats] = useState({});
  const buildCategoryWaitStats = (qs, timers, idSelector) => {
    const byCat = {};
    qs.forEach((q) => {
      const cat = q.paperQuestioncategory || q.category || "General";
      const id = idSelector(q);
      const t = timers[id];
      const waitedMs = t
        ? t.firstAnswerAt != null && t.firstFocusAt != null
          ? Math.max(0, t.firstAnswerAt - t.firstFocusAt)
          : t.totalMs || 0
        : 0;
      if (!byCat[cat]) byCat[cat] = { totalWaitMs: 0, qCount: 0 };
      byCat[cat].totalWaitMs += waitedMs;
      byCat[cat].qCount += 1;
    });

    const out = {};
    Object.keys(byCat).forEach((cat) => {
      const { totalWaitMs, qCount } = byCat[cat];
      const avgSec = qCount > 0 ? Math.round(totalWaitMs / qCount / 1000) : 0;
      out[cat] = { totalWaitMs, qCount, avgSec };
    });
    return out;
  };

  // ---- Timing (generated paper) ----
  const [nextQTimers, setNextQTimers] = useState({});
  const [nextActiveQ, setNextActiveQ] = useState(null);
  const ensureNextTimer = (qid) => {
    setNextQTimers((prev) => (prev[qid] ? prev : { ...prev, [qid]: { startAt: null, totalMs: 0, firstFocusAt: null, firstAnswerAt: null } }));
  };
  const startNextTiming = (qid) => {
    setNextQTimers((prev) => {
      const n = { ...prev };
      if (nextActiveQ && n[nextActiveQ]?.startAt != null) {
        const elapsed = Date.now() - n[nextActiveQ].startAt;
        n[nextActiveQ] = { ...n[nextActiveQ], startAt: null, totalMs: n[nextActiveQ].totalMs + Math.max(0, elapsed) };
      }
      if (!n[qid]) n[qid] = { startAt: null, totalMs: 0, firstFocusAt: null, firstAnswerAt: null };
      if (n[qid].startAt == null) {
        const t = Date.now();
        n[qid] = { ...n[qid], startAt: t, firstFocusAt: n[qid].firstFocusAt ?? t };
      }
      return n;
    });
    setNextActiveQ(qid);
  };
  const stopNextTiming = (qid) => {
    setNextQTimers((prev) => {
      const n = { ...prev };
      const t = n[qid];
      if (t?.startAt != null) {
        const elapsed = Date.now() - t.startAt;
        n[qid] = { ...t, startAt: null, totalMs: t.totalMs + Math.max(0, elapsed) };
      }
      return n;
    });
    if (nextActiveQ === qid) setNextActiveQ(null);
  };
  const markNextFirstAnswerIfNeeded = (qid) => {
    setNextQTimers((prev) => {
      const t = prev[qid];
      if (!t || t.firstAnswerAt != null) return prev;
      return { ...prev, [qid]: { ...t, firstAnswerAt: Date.now() } };
    });
  };
  const stopNextActiveIfAny = () => {
    setNextQTimers((prev) => {
      const n = { ...prev };
      if (nextActiveQ && n[nextActiveQ]?.startAt != null) {
        const elapsed = Date.now() - n[nextActiveQ].startAt;
        n[nextActiveQ] = { ...n[nextActiveQ], startAt: null, totalMs: n[nextActiveQ].totalMs + Math.max(0, elapsed) };
      }
      return n;
    });
    setNextActiveQ(null);
  };

  useEffect(() => {
    fetchRandomPaperAndQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllQuestionsByPaperId = async (paperId) => {
    let page = 1;
    const limit = 100;
    let items = [];
    let pages = 1;
    do {
      const res = await apiClient.get(`/api/starting-paper-questions/by-paper/${paperId}?page=${page}&limit=${limit}`);
      const data = res?.data || {};
      const batch = Array.isArray(data.items) ? data.items : [];
      items = items.concat(batch);

      if (Number.isFinite(Number(data.pages))) {
        pages = Number(data.pages);
      } else if (Number.isFinite(Number(data.total))) {
        pages = Math.max(1, Math.ceil(Number(data.total) / limit));
      } else {
        pages = 1;
      }
      page += 1;
    } while (page <= pages);

    return items;
  };

  const fetchRandomPaperAndQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const listRes = await apiClient.get(`/api/starting-paper-titles`);
      const arr = Array.isArray(listRes.data) ? listRes.data : [];
      if (arr.length === 0) throw new Error("No starting-paper titles found");
      const pick = arr[Math.floor(Math.random() * arr.length)];
      setPaper(pick);

      const all = await fetchAllQuestionsByPaperId(pick._id);
      const normalizedAll = all.map((q) => ({ ...q, score: safeNumber(q.score, 1) }));
      const normalized = normalizedAll.filter(isValidOriginalMCQ); // <-- keep only 4-option items
      setQuestions(normalized);

      const totalAvail = normalized.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
      setTotalAvailableMarks(totalAvail);

      // reset everything
      setStudentAnswers({});
      setEvaluationResults({});
      setIsSubmitted(false);
      setCategoryPayloads({});
      setCategoryPredictions({});
      setTotalCorrectMarks(0);
      setPercentage(0);

      setPracticeRound(0);
      setGenerating(false);
      setNextPaper([]);
      setNextAnswers({});
      setNextResults({});
      setNextSubmitted(false);
      setNextScore(0);
      setNextTotal(0);
      setPracticeHistory([]);
      setShowSummary(false);

      // reset timers
      setQTimers({});
      setCategoryTimeStats({});
      setActiveQ(null);
      setNextQTimers({});
      setNextActiveQ(null);

      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch starting paper.");
      setLoading(false);
    }
  };

  // ===== Original paper evaluation =====
  const handleAnswerChange = (qid, value) => {
    if (isSubmitted) return;
    setStudentAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const submitAnswers = async () => {
    if (isSubmitted || questions.length === 0) return;

    // finalize active timer & compute stats
    stopActiveIfAny();
    const waited = buildCategoryWaitStats(questions, qTimers, (q) => q._id);
    setCategoryTimeStats(waited);

    let results = {};
    let correctMarks = 0;

    questions.forEach((q) => {
      const student = (studentAnswers[q._id] || "").trim();
      const correctAns = (q.correctanser || "").trim();
      const isCorrect = student !== "" && student === correctAns;
      results[q._id] = isCorrect;
      if (isCorrect) correctMarks += Number(q.score) || 0;
    });

    const pct = totalAvailableMarks > 0 ? (correctMarks / totalAvailableMarks) * 100 : 0;

    setEvaluationResults(results);
    setTotalCorrectMarks(Number(correctMarks.toFixed(2)));
    setPercentage(Number(pct.toFixed(2)));
    setIsSubmitted(true);

    const payloads = buildCategoryPayloadsFromOriginal(questions, results, studentAnswers);
    setCategoryPayloads(payloads);
    await predictForAllCategories(payloads);
  };

  // Build payloads using the original paper answers
  const buildCategoryPayloadsFromOriginal = (qs, results, answers) => {
    const byCat = {};
    qs.forEach((q) => {
      const cat = q.paperQuestioncategory || "General";
      if (!byCat[cat]) {
        byCat[cat] = { all: 0, answered: 0, wrong: 0, empty: 0 };
      }
      const st = byCat[cat];
      st.all += 1;

      const ans = (answers[q._id] || "").trim();
      if (ans === "") st.empty += 1;
      else {
        st.answered += 1;
        if (!results[q._id]) st.wrong += 1;
      }
    });

    const payloads = {};
    Object.keys(byCat).forEach((cat) => {
      const st = byCat[cat];
      payloads[cat] = {
        Category: cat,
        CategoryTimeLimit: st.all * PER_QUESTION_MINUTES,
        AnsweredQuestionCount: st.answered,
        AllocatedMarksPercentage: 100,
        WrongQuestionCount: st.wrong,
        EmptyQuestionCount: st.empty,
        AllQuestionCount: st.all,
      };
    });
    return payloads;
  };

  const predictForAllCategories = async (payloads) => {
    setPredicting(true);
    setCategoryPredictions({});
    try {
      const entries = Object.entries(payloads);
      const results = await Promise.all(
        entries.map(async ([cat, payload]) => {
          const resp = await apiClient.post(`http://127.0.0.1:5000/predict-required-questions`, payload);
          return [cat, resp.data];
        })
      );
      const mapped = results.reduce((acc, [cat, data]) => {
        acc[cat] = data;
        return acc;
      }, {});
      setCategoryPredictions(mapped);
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Prediction Error",
        text: "Could not fetch predictions for categories.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setPredicting(false);
    }
  };

  // ===== Practice generation =====
  const handleGenerateNextPaperClick = async () => {
    if (practiceRound >= MAX_PRACTICE_ROUNDS) return;

    if (!isSubmitted) {
      Swal.fire({
        title: "Please submit",
        text: "Submit your answers first to compute category-wise predictions.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    if (!categoryPredictions || Object.keys(categoryPredictions).length === 0) {
      Swal.fire({
        title: "No predictions yet",
        text: "We need category predictions before generating the next paper.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    setGenerating(true);
    setNextPaper([]);
    setNextAnswers({});
    setNextResults({});
    setNextSubmitted(false);
    setNextScore(0);
    setNextTotal(0);

    try {
      const generated = [];
      const cats = Object.keys(categoryPredictions);

      for (const cat of cats) {
        const pred = categoryPredictions[cat] || {};
        const difficulty = pred.difficulty_level || "Easy";
        const countRaw = pred.predicted_required_questions;
        const need = Math.min(
          MAX_GEN_PER_CATEGORY,
          Math.max(MIN_GEN_PER_CATEGORY, Math.round(Number(countRaw) || 0))
        );

        for (let i = 0; i < need; i++) {
          const body = { prompt: `Skill : ${cat} | Difficulty: ${difficulty} | Explanation: true` };
          try {
            const r = await apiClient.post(`http://127.0.0.1:5000/predict-answer`, body);
            const txt = r?.data?.generated_text || r?.data?.full_text || "";
            const parsed = parseGeneratedQA(txt);
            if (parsed?.question && isValidGeneratedMCQ(parsed)) {
              generated.push({
                id: `${cat}_${difficulty}_${i}_${Date.now()}`,
                category: cat,
                difficulty,
                ...parsed,
                score: 1,
              });
            } else {
              // optional: track skips for debugging
              // console.warn("Skipped generated item (invalid options)", { cat, difficulty, parsed });
            }
          } catch (e) {
            console.error("predict-answer failed", e);
          }
        }
      }

      if (generated.length === 0) {
        Swal.fire({
          title: "No questions generated",
          text: "The generator did not return usable questions.",
          icon: "info",
          confirmButtonText: "OK",
        });
        return;
      }

      setNextPaper(generated);
      setNextTotal(generated.reduce((s, q) => s + (q.score || 1), 0));
      setPracticeRound((r) => r + 1);

      // reset generated timers
      setNextQTimers({});
      setNextActiveQ(null);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Generation Error",
        text: "Could not generate the next paper.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleNextAnswerChange = (qid, value) => {
    if (nextSubmitted) return;
    setNextAnswers((p) => ({ ...p, [qid]: value }));
  };

  const buildCategoryPayloadsFromGenerated = (items, results, answers) => {
    const byCat = {};
    items.forEach((q) => {
      const cat = q.category || "General";
      if (!byCat[cat]) {
        byCat[cat] = { all: 0, answered: 0, wrong: 0, empty: 0 };
      }
      const st = byCat[cat];
      st.all += 1;

      const chosen = (answers[q.id] || "").trim();
      if (chosen === "") st.empty += 1;
      else {
        st.answered += 1;
        if (!results[q.id]) st.wrong += 1;
      }
    });

    const payloads = {};
    Object.keys(byCat).forEach((cat) => {
      const st = byCat[cat];
      payloads[cat] = {
        Category: cat,
        CategoryTimeLimit: st.all * PER_QUESTION_MINUTES,
        AnsweredQuestionCount: st.answered,
        AllocatedMarksPercentage: 100,
        WrongQuestionCount: st.wrong,
        EmptyQuestionCount: st.empty,
        AllQuestionCount: st.all,
      };
    });
    return payloads;
  };

  const updateUserSuitability = async (avgPercent) => {
    if (!userId) {
      console.warn("No userId in localStorage; skipping user update.");
      return;
    }
    const body = avgPercent > 60 ? { suitabilityForCoding: 1, entranceTest: 1 } : { suitabilityForCoding: 0, entranceTest: 1 };

    try {
      await apiClient.put(`/api/users/${userId}`, body);
      Swal.fire({
        title: "User Updated",
        text: avgPercent > 60 ? "Great job! Marked as suitable for coding." : "Recorded entrance test; keep practicing!",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (e) {
      console.error("Failed to update user suitability:", e);
      Swal.fire({ title: "Update Failed", text: "Could not update your profile at this time.", icon: "error", confirmButtonText: "OK" });
    }
  };

  const submitNextPaper = async () => {
    if (nextSubmitted || nextPaper.length === 0) return;

    // finalize any active generated timer
    stopNextActiveIfAny();

    let results = {};
    let score = 0;

    nextPaper.forEach((q) => {
      const chosenKey = (nextAnswers[q.id] || "").trim().toUpperCase();
      const isCorrect =
        chosenKey !== "" && (q.correctKey ? chosenKey === q.correctKey.toUpperCase() : false);
      results[q.id] = isCorrect;
      if (isCorrect) score += Number(q.score) || 1;
    });

    setNextResults(results);
    setNextScore(score);
    setNextSubmitted(true);

    const total = nextPaper.reduce((s, q) => s + (q.score || 1), 0);
    const percent = total > 0 ? (score / total) * 100 : 0;
    const thisRound = { round: practiceRound, score, total, percent: Number(percent.toFixed(2)) };

    const finalHistory = [...practiceHistory, thisRound];
    setPracticeHistory(finalHistory);

    if (practiceRound >= MAX_PRACTICE_ROUNDS) {
      const avgPercent = finalHistory.reduce((s, x) => s + x.percent, 0) / finalHistory.length || 0;
      setShowSummary(true);
      await updateUserSuitability(avgPercent);
      return;
    }

    const payloads = buildCategoryPayloadsFromGenerated(nextPaper, results, nextAnswers);
    setCategoryPayloads(payloads);
    await predictForAllCategories(payloads);
  };

  return (
    <Fragment>
      <Header />
      <PageHeader title="Question Paper" curPage={"Paper Details"} />
      <div className="paper-section padding-tb section-bg">
        <div className="container">
          {loading ? (
            <p>Loading paper details...</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : paper ? (
            <div className="paper-content">
              {/* Paper Header */}
              <div className="paper-header text-center">
                <h2>{paper.paperTytle}</h2>
                <p className="mb-1">
                  <strong>Paper No:</strong> {paper.paperNumber ?? "-"}{" "}
                  | <strong>Creator:</strong> {paper.createBy?.username ?? "-"}{" "}
                  | <strong>Created:</strong>{" "}
                  {paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : "-"}
                </p>
                <p className="mb-0">
                  <strong>Full Marks:</strong> {totalAvailableMarks}
                </p>
              </div>

              {/* Questions (answerable) */}
              <div className="question-section mt-4">
                {questions.length > 0 ? (
                  <ul className="question-list list-unstyled">
                    {questions.map((q, idx) => (
                      <li
                        key={q._id}
                        className="mb-4 p-3 bg-white rounded shadow-sm"
                        onMouseEnter={() => {
                          ensureTimer(q._id);
                          startTiming(q._id);
                        }}
                        onMouseLeave={() => {
                          ensureTimer(q._id);
                          stopTiming(q._id);
                        }}
                        onFocus={() => {
                          ensureTimer(q._id);
                          startTiming(q._id);
                        }}
                        onBlur={() => {
                          ensureTimer(q._id);
                          stopTiming(q._id);
                        }}
                        tabIndex={0}
                      >
                        <p className="mb-2">
                          <strong>Q{idx + 1}:</strong> {q.paperQuestionTitle}{" "}
                          <span className="text-muted">({q.paperQuestioncategory})</span>{" "}
                          <span className="text-muted">
                            [{q.score} mark{q.score === 1 ? "" : "s"}]
                          </span>
                        </p>

                        <div>
                          {(Array.isArray(q.answers) ? q.answers : []).map((opt, i) => {
                            const inputId = `${q._id}_${i}`;
                            const checked = (studentAnswers[q._id] || "") === opt;
                            return (
                              <div className="form-check" key={inputId}>
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={q._id}
                                  id={inputId}
                                  value={opt}
                                  disabled={isSubmitted}
                                  checked={checked}
                                  onFocus={() => {
                                    ensureTimer(q._id);
                                    startTiming(q._id);
                                  }}
                                  onClick={() => {
                                    ensureTimer(q._id);
                                    startTiming(q._id);
                                  }}
                                  onChange={(e) => {
                                    handleAnswerChange(q._id, e.target.value);
                                    markFirstAnswerIfNeeded(q._id);
                                  }}
                                />
                                <label className="form-check-label" htmlFor={inputId}>
                                  {opt}
                                </label>
                              </div>
                            );
                          })}
                        </div>

                        {evaluationResults[q._id] !== undefined && (
                          <p className={evaluationResults[q._id] ? "text-success mt-2" : "text-danger mt-2"}>
                            {evaluationResults[q._id]
                              ? "Correct ✅"
                              : `Incorrect ❌ (Answer: ${q.correctanser})`}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No questions available.</p>
                )}
              </div>

              {/* Submit + Scores (original) */}
              <div className="text-center mt-4">
                <button
                  className="btn btn-primary"
                  onClick={submitAnswers}
                  disabled={isSubmitted || questions.length === 0}
                >
                  {isSubmitted ? "Submitted" : "Submit Answers"}
                </button>

                {isSubmitted && (
                  <div className="mt-3">
                    <h5 className="text-success">
                      Correct Marks: {totalCorrectMarks} / {totalAvailableMarks}
                    </h5>
                    <h5 className="text-primary">Score: {percentage}%</h5>
                  </div>
                )}
              </div>

              {/* Category Predictions -> Generate Next Paper */}
              {isSubmitted && (
                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <h4 className="mb-3">Category Predictions</h4>
                    <span className="badge bg-secondary">
                      Practice Round: {practiceRound} / {MAX_PRACTICE_ROUNDS}
                    </span>
                  </div>

                  {predicting && <p>Predicting required questions per category…</p>}

                  {!predicting && Object.keys(categoryPayloads).length === 0 && (
                    <p className="text-muted">No categories found.</p>
                  )}

                  {!predicting && Object.keys(categoryPayloads).length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-striped align-middle">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Allocated %</th>
                            <th>All Qs</th>
                            <th>Answered</th>
                            <th>Wrong</th>
                            <th>Empty</th>
                            <th>Difficulty</th>
                            <th>Predicted Required</th>
                            <th>Avg Time (s)</th>
                            <th>Empty Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(categoryPayloads).map((cat) => {
                            const payload = categoryPayloads[cat];
                            const pred = categoryPredictions[cat] || {};
                            const details = pred.details || {};
                            const predictedNum = pred.predicted_required_questions;
                            const difficulty = pred.difficulty_level || "-";
                            const emptyRate =
                              typeof details.empty_rate === "number"
                                ? `${(details.empty_rate * 100).toFixed(1)}%`
                                : "-";

                            return (
                              <tr key={cat}>
                                <td>{cat}</td>
                                <td>{payload.AllocatedMarksPercentage}%</td>
                                <td>{payload.AllQuestionCount}</td>
                                <td>{payload.AnsweredQuestionCount}</td>
                                <td>{payload.WrongQuestionCount}</td>
                                <td>{payload.EmptyQuestionCount}</td>
                                <td>{invertDifficulty(difficulty)}</td>
                                <td>
                                  {typeof predictedNum === "number"
                                    ? `${predictedNum.toFixed(2)} (≈ ${Math.max(0, Math.round(predictedNum))})`
                                    : "-"}
                                </td>
                                <td>{categoryTimeStats[cat]?.avgSec ?? "-"}</td>
                                <td>{emptyRate}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Generate Next Paper */}
                  <div className="text-center mt-3">
                    <button
                      className="btn btn-success"
                      onClick={handleGenerateNextPaperClick}
                      disabled={
                        predicting ||
                        Object.keys(categoryPredictions).length === 0 ||
                        generating ||
                        practiceRound >= MAX_PRACTICE_ROUNDS
                      }
                    >
                      {generating
                        ? "Generating…"
                        : practiceRound === 0
                        ? "Generate Next Paper (1 / 3)"
                        : `Generate Next Paper (${practiceRound + 1} / ${MAX_PRACTICE_ROUNDS})`}
                    </button>
                  </div>
                </div>
              )}

              {/* Current Practice Paper */}
              {nextPaper.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-3">
                    Practice Paper {practiceRound} / {MAX_PRACTICE_ROUNDS}
                  </h3>
                  <p className="text-muted">
                    Total Questions: {nextPaper.length} | Total Marks: {nextTotal}
                  </p>
                  <ul className="list-unstyled">
                    {nextPaper.map((q, idx) => (
                      <li
                        key={q.id}
                        className="mb-4 p-3 bg-white rounded shadow-sm"
                        onMouseEnter={() => {
                          ensureNextTimer(q.id);
                          startNextTiming(q.id);
                        }}
                        onMouseLeave={() => {
                          ensureNextTimer(q.id);
                          stopNextTiming(q.id);
                        }}
                        onFocus={() => {
                          ensureNextTimer(q.id);
                          startNextTiming(q.id);
                        }}
                        onBlur={() => {
                          ensureNextTimer(q.id);
                          stopNextTiming(q.id);
                        }}
                        tabIndex={0}
                      >
                        <p className="mb-2">
                          <strong>Q{idx + 1}:</strong> {q.question}{" "}
                          <span className="text-muted">
                            ({q.category} | {q.difficulty})
                          </span>{" "}
                          <span className="text-muted">
                            [{q.score} mark{q.score === 1 ? "" : "s"}]
                          </span>
                        </p>
                        <div>
                          {(Array.isArray(q.options) ? q.options : []).map((opt) => {
                            const inputId = `${q.id}_${opt.key}`;
                            const checked = (nextAnswers[q.id] || "") === opt.key;
                            return (
                              <div className="form-check" key={inputId}>
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={q.id}
                                  id={inputId}
                                  value={opt.key}
                                  disabled={nextSubmitted}
                                  checked={checked}
                                  onFocus={() => {
                                    ensureNextTimer(q.id);
                                    startNextTiming(q.id);
                                  }}
                                  onClick={() => {
                                    ensureNextTimer(q.id);
                                    startNextTiming(q.id);
                                  }}
                                  onChange={(e) => {
                                    handleNextAnswerChange(q.id, e.target.value);
                                    markNextFirstAnswerIfNeeded(q.id);
                                  }}
                                />
                                <label className="form-check-label" htmlFor={inputId}>
                                  <strong>{opt.key}.</strong> {opt.text}
                                </label>
                              </div>
                            );
                          })}
                        </div>

                        {nextResults[q.id] !== undefined && (
                          <>
                            <p className={nextResults[q.id] ? "text-success mt-2" : "text-danger mt-2"}>
                              {nextResults[q.id]
                                ? "Correct ✅"
                                : `Incorrect ❌ (Answer: ${q.correctKey || "-"})`}
                            </p>
                            {!nextResults[q.id] && q.explanation && (
                              <p className="text-muted mb-0">
                                <em>Explanation:</em> {q.explanation}
                              </p>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="text-center mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={submitNextPaper}
                      disabled={nextSubmitted || nextPaper.length === 0}
                    >
                      {nextSubmitted ? "Submitted" : "Submit Practice Paper"}
                    </button>

                    {nextSubmitted && (
                      <div className="mt-3">
                        <h5 className="text-success">
                          Correct Marks: {nextScore} / {nextTotal}
                        </h5>
                        <h5 className="text-primary">
                          Score: {nextTotal > 0 ? ((nextScore / nextTotal) * 100).toFixed(2) : "0"}%
                        </h5>
                        {practiceRound < MAX_PRACTICE_ROUNDS ? (
                          <p className="text-muted mt-2">
                            Predictions updated — you can generate the next paper above.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary after 3 practice rounds */}
              {showSummary && practiceHistory.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-3">Practice Summary (3 rounds)</h3>
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead>
                        <tr>
                          <th>Round</th>
                          <th>Score</th>
                          <th>Total</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {practiceHistory.map((r) => (
                          <tr key={r.round}>
                            <td>{r.round}</td>
                            <td>{r.score}</td>
                            <td>{r.total}</td>
                            <td>{r.percent}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th>Average</th>
                          <th>
                            {Math.round(
                              practiceHistory.reduce((s, x) => s + x.score, 0) / practiceHistory.length
                            )}
                          </th>
                          <th>
                            {Math.round(
                              practiceHistory.reduce((s, x) => s + x.total, 0) / practiceHistory.length
                            )}
                          </th>
                          <th>
                            {(
                              practiceHistory.reduce((s, x) => s + x.percent, 0) / practiceHistory.length
                            ).toFixed(2)}
                            %
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-muted">
                    Tip: Use the “Generate Next Paper” flow again after restarting a new starting paper to continue practicing.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p>Paper not found.</p>
          )}
        </div>
      </div>
      <Footer />
    </Fragment>
  );
};

export default StartingPaper;
