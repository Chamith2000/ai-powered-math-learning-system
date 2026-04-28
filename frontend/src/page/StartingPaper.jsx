import { Fragment, useEffect, useState, useRef } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import Swal from "sweetalert2";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const MAX_PRACTICE_ROUNDS = 2;
const PER_QUESTION_SECONDS = 120;
const TOTAL_QUESTIONS_TARGET = 5;

const safeNumber = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const VALID_GRADES = [3, 4, 5];

const startingPaperStyles = `
  .starting-paper-page {
    background:
      radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 34%),
      radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 30%),
      #f6f9ff;
  }

  .starting-setup-card,
  .starting-loading-card,
  .starting-panel,
  .starting-summary-card {
    border: 1px solid rgba(79, 70, 229, 0.12);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 24px 60px rgba(31, 41, 55, 0.11);
  }

  .starting-grade-btn {
    width: 122px;
    height: 122px;
    border: 2px solid #e0e7ff;
    color: #27335c;
    font-weight: 800;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .starting-grade-btn:hover,
  .starting-grade-btn.is-selected {
    transform: translateY(-4px);
    border-color: #4f46e5;
    background: #eef2ff;
    box-shadow: 0 14px 30px rgba(79, 70, 229, 0.2);
  }

  .starting-hero {
    border-radius: 18px;
    padding: 26px;
    background: linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #ecfeff 100%);
    border: 1px solid #dbeafe;
  }

  .starting-hero h2,
  .starting-hero h3 {
    color: #24306b;
    font-family: "Baloo 2", sans-serif;
    font-weight: 800;
  }

  .starting-stat {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 9px 14px;
    background: #ffffff;
    border: 1px solid #dbeafe;
    color: #334155;
    font-weight: 800;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  }

  .starting-category-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #3243a3;
    font-weight: 800;
    border-bottom: 1px solid #dbeafe;
    padding-bottom: 12px;
  }

  .starting-question-card {
    border-radius: 18px;
    border: 1px solid #dbeafe;
    background: #ffffff;
    box-shadow: 0 14px 34px rgba(30, 41, 59, 0.08);
  }

  .starting-question-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    color: #1f2a55;
  }

  .starting-question-title {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0;
    line-height: 1.45;
  }

  .starting-question-number {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 900;
  }

  .starting-mark-badge {
    white-space: nowrap;
    border-radius: 999px;
    padding: 9px 13px;
    background: #fef3c7;
    color: #7c2d12;
    font-weight: 900;
  }

  .starting-option-label {
    display: block;
    border: 1px solid #dbeafe;
    border-radius: 16px;
    padding: 14px 16px;
    background: #f8fbff;
    color: #24306b;
    font-size: 1.05rem;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
  }

  .starting-option-label:hover {
    transform: translateX(4px);
    border-color: #818cf8;
    background: #eef2ff;
  }

  .starting-option-input:checked + .starting-option-label {
    border-color: #4f46e5;
    background: #4f46e5;
    color: #ffffff;
    box-shadow: 0 12px 24px rgba(79, 70, 229, 0.23);
  }

  .starting-submit-bar {
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    padding: 8px;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
  }

  .starting-round-card {
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  @media (max-width: 575px) {
    .starting-setup-card,
    .starting-loading-card,
    .starting-panel,
    .starting-summary-card {
      border-radius: 16px;
    }

    .starting-hero {
      padding: 20px;
    }

    .starting-question-head {
      flex-direction: column;
    }

    .starting-question-title {
      flex-direction: column;
    }

    .starting-mark-badge {
      white-space: normal;
    }
  }
`;

const isValidOriginalMCQ = (q) =>
  Array.isArray(q.answers) &&
  q.answers.filter((t) => String(t || "").trim().length > 0).length >= 2;

const parseMCQGenerateOutput = (output) => {
  let question = "";
  let choicesObj = null;
  let correctKey = "A";

  if (typeof output === 'object' && output !== null) {
    question = output.question || "";
    choicesObj = output.choices || null;
    correctKey = String(output.correct_answer || "A").toUpperCase();
  } else if (typeof output === 'string') {
    try {
      let clean = output.trim();
      
      // Clean leading markdown artifacts if present
      if (clean.startsWith('```json')) clean = clean.replace(/```json/i, '').replace(/```/i, '').trim();

      // We need to isolate the JSON object from trailing markdown garbage.
      // Since "choices" introduces 1 level of nesting, we can target it specifically,
      // or we can mathematically extract the first valid balanced JSON bracket sequence.
      let jsonStr = null;
      
      const preciseJsonMatch = clean.match(/\{[\s\S]*?"choices"\s*:\s*\{[^{}]*\}[^{}]*\}/i);
      
      if (preciseJsonMatch) {
         jsonStr = preciseJsonMatch[0];
      } else {
         // Bracket balancing fallback: Find the first { and capture until depth hits 0
         const startIdx = clean.indexOf('{');
         if (startIdx !== -1) {
           let depth = 0;
           for (let i = startIdx; i < clean.length; i++) {
             if (clean[i] === '{') depth++;
             else if (clean[i] === '}') {
               depth--;
               if (depth === 0) {
                 jsonStr = clean.substring(startIdx, i + 1);
                 break;
               }
             }
           }
         }
      }

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        question = parsed.question;
        choicesObj = parsed.choices;
        correctKey = String(parsed.correct_answer || "A").toUpperCase();
      }
    } catch (e) {
      console.warn("JSON exact parsing failed, falling back to regex extraction.", e);
    }
  }

  if ((!question || !choicesObj) && typeof output === 'string') {
    const qMatch = output.match(/"question"\s*:\s*"((?:\\"|[^"])*)"/i) || output.match(/question\s*:\s*"((?:\\"|[^"])*)"/i) || output.match(/question:\s*(.*?)\n/i);
    if (qMatch) question = qMatch[1].replace(/\\"/g, '"');

    const cMatch = output.match(/"choices"\s*:\s*(\{.*?\})/is) || output.match(/choices\s*:\s*(\{.*?\})/is);
    let cParsed = false;
    if (cMatch) {
      try { choicesObj = JSON.parse(cMatch[1]); cParsed = true; } catch (e) { }
    }

    if (!cParsed) {
      const tupleMatch = output.match(/choices\s*=\s*\[(.*?)\]/is);
      if (tupleMatch) {
        const pairs = [...tupleMatch[1].matchAll(/\(\s*"([^"]+)"\s*(?:,\s*"([^"]+)")?\s*\)/g)];
        if (pairs.length >= 2) {
          choicesObj = {};
          const labels = ["A", "B", "C", "D", "E", "F"];
          pairs.forEach((p, i) => { choicesObj[labels[i]] = p[1]; });
        }
      }
    }

    const ansMatch = output.match(/"correct_answer"\s*:\s*"([^"]+)"/i) || output.match(/correct_answer\s*[:=]\s*"([^"]+)"/i);
    if (ansMatch) correctKey = String(ansMatch[1]).toUpperCase();
    else if (output.match(/\\boxed\{([A-Z])\}/i)) correctKey = output.match(/\\boxed\{([A-Z])\}/i)[1].toUpperCase();
  }

  if (!question || !choicesObj) return null;

  let options = [];
  if (typeof choicesObj === 'object' && !Array.isArray(choicesObj)) {
    options = Object.entries(choicesObj).map(([key, val]) => ({
      key: String(key).toUpperCase(),
      text: String(val),
    }));
  } else if (Array.isArray(choicesObj)) {
    const labels = ["A", "B", "C", "D", "E"];
    options = choicesObj.map((val, i) => ({
      key: labels[i] || String(i),
      text: String(val)
    }));
  }

  if (options.length < 2) return null;

  return { question: String(question).trim(), options, correctKey };
};

const StartingPaper = () => {
  // --- View Controller State ---
  const [currentView, setCurrentView] = useState("GRADE_SELECTION");

  const [grade, setGrade] = useState(null);
  const [gradeConfirmed, setGradeConfirmed] = useState(false);

  // --- Initial Paper States ---
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentAnswers, setStudentAnswers] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [totalCorrectMarks, setTotalCorrectMarks] = useState(0);
  const [totalAvailableMarks, setTotalAvailableMarks] = useState(0);
  const [percentage, setPercentage] = useState(0);

  // --- Recommendation & Next Paper States ---
  const [categoryStats, setCategoryStats] = useState({});
  const [categoryRecommendations, setCategoryRecommendations] = useState({});
  const [practiceRound, setPracticeRound] = useState(0);
  const [nextPaper, setNextPaper] = useState([]);
  const [nextAnswers, setNextAnswers] = useState({});
  const [nextResults, setNextResults] = useState({});
  const [nextSubmitted, setNextSubmitted] = useState(false);
  const [nextScore, setNextScore] = useState(0);
  const [nextTotal, setNextTotal] = useState(0);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [finalDifficulty, setFinalDifficulty] = useState(null);

  const userId = localStorage.getItem("userId");

  // ── Cheating incidents ──
  const cheatIncidentsRef = useRef([]);

  // --- Camera & Socket Stream ---
  useEffect(() => {
    socket.emit("object_stream_enable", { enabled: true });

    socket.on("object_result", (data) => {
      if (data && data.detections && data.detections.length > 0) {
        const incidents = data.detections.map(d => ({
          timestamp: new Date().toISOString(),
          detectionType: d.class_name || "phone"
        }));
        cheatIncidentsRef.current = [...cheatIncidentsRef.current, ...incidents];
      }
    });

    const video = document.createElement("video");
    video.setAttribute("autoplay", true);
    video.setAttribute("playsinline", true);
    video.style.display = "none";
    document.body.appendChild(video);

    let stream;
    let captureInterval;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((_stream) => {
        stream = _stream;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          captureInterval = setInterval(() => {
            if (currentView === "SUMMARY" || !gradeConfirmed) return;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg");
            socket.emit("send_object_image", imageData);
          }, 5000);
        };
      })
      .catch((err) => console.error("Camera access failed:", err));

    return () => {
      socket.emit("object_stream_enable", { enabled: false });
      socket.off("object_result");
      if (captureInterval) clearInterval(captureInterval);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (document.body.contains(video)) document.body.removeChild(video);
    };
  }, [currentView, gradeConfirmed]);

  // --- Timers Logic ---
  const [qTimers, setQTimers] = useState({});
  const [activeQ, setActiveQ] = useState(null);
  const nowMs = () => Date.now();

  const ensureTimer = (qid) => {
    setQTimers((prev) => prev[qid] ? prev : { ...prev, [qid]: { startAt: null, totalMs: 0, firstFocusAt: null, firstAnswerAt: null } });
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

  const [nextQTimers, setNextQTimers] = useState({});
  const [nextActiveQ, setNextActiveQ] = useState(null);

  const ensureNextTimer = (qid) => {
    setNextQTimers((prev) => prev[qid] ? prev : { ...prev, [qid]: { startAt: null, totalMs: 0, firstFocusAt: null, firstAnswerAt: null } });
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

  // --- Initial Fetching ---
  useEffect(() => {
    if (gradeConfirmed) {
      fetchRandomPaperAndQuestions();
    }
  }, [gradeConfirmed]);

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
      if (Number.isFinite(Number(data.pages))) pages = Number(data.pages);
      else if (Number.isFinite(Number(data.total))) pages = Math.max(1, Math.ceil(Number(data.total) / limit));
      else pages = 1;
      page += 1;
    } while (page <= pages);
    return items;
  };

  const fetchRandomPaperAndQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const listRes = await apiClient.get(`/api/starting-paper-titles`);
      let arr = Array.isArray(listRes.data) ? listRes.data : [];
      if (grade) arr = arr.filter(p => Number(p.grade) === Number(grade));

      if (arr.length === 0) throw new Error(`No starting-paper titles found for Grade ${grade}`);
      const pick = arr[Math.floor(Math.random() * arr.length)];
      setPaper(pick);

      const all = await fetchAllQuestionsByPaperId(pick._id);
      const normalized = all.map((q) => ({ ...q, score: safeNumber(q.score, 1) }));
      setQuestions(normalized);

      const totalAvail = normalized.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
      setTotalAvailableMarks(totalAvail);

      setCurrentView("INITIAL_PAPER");
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch starting paper.");
      setLoading(false);
    }
  };

  const buildCategoryStats = (qs, results, answers, timers) => {
    const byCat = {};
    qs.forEach((q) => {
      const cat = q.paperQuestioncategory || "General";
      if (!byCat[cat]) byCat[cat] = { qIds: [], answered: 0, correct: 0, wrong: 0 };
      const st = byCat[cat];
      st.qIds.push(q._id);
      const ans = (answers[q._id] || "").trim();
      if (ans !== "") {
        st.answered += 1;
        if (results[q._id]) st.correct += 1;
        else st.wrong += 1;
      }
    });

    const out = {};
    Object.keys(byCat).forEach((cat) => {
      const st = byCat[cat];
      const total_q = st.qIds.length;
      const total_time = total_q * PER_QUESTION_SECONDS;

      let waitedMs = 0;
      st.qIds.forEach((id) => {
        const t = timers[id];
        if (t) waitedMs += (t.firstAnswerAt != null && t.firstFocusAt != null) ? Math.max(0, t.firstAnswerAt - t.firstFocusAt) : (t.totalMs || 0);
      });
      const waited_time = Math.round(waitedMs / 1000);
      const marks = total_q > 0 ? Number(((st.correct / total_q) * 100).toFixed(2)) : 0;

      out[cat] = { total_time, waited_time, total_q, answered: st.answered, correct: st.correct, wrong: st.wrong, marks };
    });
    return out;
  };

  const buildCategoryStatsFromGenerated = (items, results, answers, timers) => {
    const byCat = {};
    items.forEach((q) => {
      const cat = q.category || "General";
      if (!byCat[cat]) byCat[cat] = { qIds: [], answered: 0, correct: 0, wrong: 0 };
      const st = byCat[cat];
      st.qIds.push(q.id);
      const chosen = (answers[q.id] || "").trim();
      if (chosen !== "") {
        st.answered += 1;
        if (results[q.id]) st.correct += 1;
        else st.wrong += 1;
      }
    });

    const out = {};
    Object.keys(byCat).forEach((cat) => {
      const st = byCat[cat];
      const total_q = st.qIds.length;
      const total_time = total_q * PER_QUESTION_SECONDS;
      let waitedMs = 0;
      st.qIds.forEach((id) => {
        const t = timers[id];
        if (t) waitedMs += (t.firstAnswerAt != null && t.firstFocusAt != null) ? Math.max(0, t.firstAnswerAt - t.firstFocusAt) : (t.totalMs || 0);
      });
      const waited_time = Math.round(waitedMs / 1000);
      const marks = total_q > 0 ? Number(((st.correct / total_q) * 100).toFixed(2)) : 0;

      out[cat] = { total_time, waited_time, total_q, answered: st.answered, correct: st.correct, wrong: st.wrong, marks };
    });
    return out;
  };

  const fetchRecommendations = async (stats) => {
    try {
      const entries = Object.entries(stats);
      const results = await Promise.all(
        entries.map(async ([cat, payload]) => {
          const resp = await apiClient.post(`http://127.0.0.1:5000/recommend`, payload);
          return [cat, resp.data];
        })
      );
      const mapped = results.reduce((acc, [cat, data]) => { acc[cat] = data; return acc; }, {});
      setCategoryRecommendations(mapped);
      return mapped;
    } catch (e) {
      console.error("recommend error", e);
      return {};
    }
  };

  const computeDistribution = (recs) => {
    const cats = Object.keys(recs);
    if (cats.length === 0) return {};

    const rawCounts = cats.map((c) => Math.max(1, Math.round(Number(recs[c]?.recommended_question_count) || 0)));
    const totalRaw = rawCounts.reduce((s, v) => s + v, 0);

    const exact = rawCounts.map((v) => (v / totalRaw) * TOTAL_QUESTIONS_TARGET);
    const floored = exact.map((v) => Math.floor(v));
    let remainder = TOTAL_QUESTIONS_TARGET - floored.reduce((s, v) => s + v, 0);

    const fracs = exact.map((v, i) => ({ i, frac: v - floored[i] }));
    fracs.sort((a, b) => b.frac - a.frac);
    for (const f of fracs) {
      if (remainder <= 0) break;
      floored[f.i] += 1;
      remainder -= 1;
    }
    for (let i = 0; i < floored.length; i++) if (floored[i] === 0) floored[i] = 1;

    const dist = {};
    cats.forEach((c, i) => { dist[c] = floored[i]; });
    return dist;
  };

  // --- Auto Generate Next Paper Core Logic ---
  const autoGeneratePracticePaper = async (recs) => {
    setCurrentView("GENERATING");
    setNextPaper([]);
    setNextAnswers({});
    setNextResults({});
    setNextSubmitted(false);
    setNextScore(0);
    setNextTotal(0);
    setNextQTimers({});
    setNextActiveQ(null);

    try {
      const distribution = computeDistribution(recs);
      const cats = Object.keys(distribution);
      let generatedQs = [];
      let genTotal = 0;

      for (const cat of cats) {
        const rec = recs[cat] || {};
        const difficulty = String(rec.recommended_difficulty || "Easy").toLowerCase();
        const count = distribution[cat] || 1;

        for (let i = 0; i < count; i++) {
          const body = { topic: cat, difficulty, model_type: "question", grade: grade };
          try {
            const r = await apiClient.post(`https://Chamith2000-mcq-generator-new.hf.space/generate`, body);
            const outputData = r?.data?.output || null;
            const parsed = parseMCQGenerateOutput(outputData);
            if (parsed && parsed.question && parsed.options?.length >= 2) {
              const newQuestion = { id: `${cat}_${difficulty}_${i}_${Date.now()}`, category: cat, difficulty, ...parsed, score: 1 };
              generatedQs.push(newQuestion);
              genTotal += 1;
            }
          } catch (e) {
            console.error("mcq/generate failed for", cat, e);
          }
        }
      }

      setNextPaper(generatedQs);
      setNextTotal(genTotal);
      setPracticeRound((r) => r + 1);
      setCurrentView("PRACTICE_PAPER");

      if (generatedQs.length === 0) {
        Swal.fire("Error", "Could not generate questions. Please refresh.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Generation Error", "Could not generate the next paper.", "error");
    }
  };

  // --- HTML Table Builder for Popup ---
  const buildTableHtml = (score, total, pct, stats, recs, dist, isFinal) => {
    let html = `
      <div style="margin-bottom: 25px;">
        <h2 style="color: #198754; margin: 0; font-weight: 800;">Score: ${score} / ${total}</h2>
        <h4 style="margin: 5px 0; color: #495057;">Percentage: ${pct.toFixed(2)}%</h4>
      </div>
      <div style="max-height: 350px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead style="background-color: #f8f9fa; position: sticky; top: 0; z-index: 1;">
            <tr>
              <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Category</th>
              <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Time (s)</th>
              <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Correct</th>
              <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Marks</th>
              <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">AI Diff</th>
              ${!isFinal ? `<th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Next Qs</th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    Object.keys(stats).forEach(cat => {
      const st = stats[cat];
      const rec = recs[cat] || {};
      const recDiff = rec.recommended_difficulty || "—";
      const genCount = dist ? (dist[cat] || "—") : "—";

      let diffColor = "#6c757d";
      if (recDiff.toLowerCase() === "hard") diffColor = "#dc3545";
      else if (recDiff.toLowerCase() === "medium") diffColor = "#fd7e14";
      else if (recDiff.toLowerCase() === "easy") diffColor = "#198754";

      html += `
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 12px;"><b>${cat}</b></td>
          <td style="padding: 12px;">${st.waited_time}s</td>
          <td style="padding: 12px; color: #198754; font-weight: bold;">${st.correct}/${st.total_q}</td>
          <td style="padding: 12px;">${st.marks}%</td>
          <td style="padding: 12px;"><span style="color: ${diffColor}; font-weight: bold;">${recDiff}</span></td>
          ${!isFinal ? `<td style="padding: 12px; font-weight: bold;">${genCount}</td>` : ''}
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    return html;
  };

  // --- Answer Handlers ---
  const handleAnswerChange = (qid, value) => {
    if (isSubmitted) return;
    setStudentAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleNextAnswerChange = (qid, value) => {
    if (nextSubmitted || currentView === "GENERATING") return;
    setNextAnswers((p) => ({ ...p, [qid]: value }));
  };


  // --- Initial Paper Submit ---
  const submitAnswers = async () => {
    if (isSubmitted || questions.length === 0) return;
    stopActiveIfAny();

    // Show Loading
    Swal.fire({
      title: 'Evaluating Answers & Analyzing Profile...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

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

    const stats = buildCategoryStats(questions, results, studentAnswers, qTimers);
    setCategoryStats(stats);

    // Calculate DB seconds
    let secs = 0;
    Object.values(stats).forEach(c => secs += c.waited_time);

    try {
      await apiClient.post("/api/paper-logs", {
        studentId: userId,
        paperId: paper?._id,
        paperTitle: paper?.paperTytle || "Starting Paper Original",
        paperType: "Starting",
        marks: correctMarks,
        totalMarks: totalAvailableMarks,
        timeSpent: secs,
        cheatIncidents: cheatIncidentsRef.current
      });
      cheatIncidentsRef.current = [];
    } catch (e) {
      console.error("Failed to save log:", e);
    }

    let answeredCnt = 0, correctCnt = 0, total_q = 0;
    Object.values(stats).forEach(c => {
      answeredCnt += c.answered;
      correctCnt += c.correct;
      total_q += c.total_q;
    });

    const initialRound = {
       round: 0,
       roundName: "Initial Assessment",
       score: correctMarks,
       total: totalAvailableMarks,
       percent: pct,
       timeSpent: secs,
       answered: answeredCnt,
       totalQs: total_q,
       correctAnswers: correctCnt,
       unanswered: total_q - answeredCnt
    };
    setPracticeHistory([initialRound]);

    // Fetch recommendations for the table
    const recs = await fetchRecommendations(stats);
    const dist = computeDistribution(recs);

    // Build the popup content
    const tableHtml = buildTableHtml(correctMarks, totalAvailableMarks, pct, stats, recs, dist, false);

    // Fire Detailed Popup
    await Swal.fire({
      title: "Initial Assessment Completed!",
      html: tableHtml,
      width: '800px', // Wide popup for the table
      icon: "success",
      confirmButtonText: "Generate Practice Paper",
      confirmButtonColor: '#198754',
      allowOutsideClick: false
    });

    // Auto generate after user clicks confirm
    await autoGeneratePracticePaper(recs);
  };


  // --- Next Paper Submit ---
  const submitNextPaper = async () => {
    if (nextSubmitted || nextPaper.length === 0) return;
    stopNextActiveIfAny();

    Swal.fire({
      title: 'Evaluating Practice Round...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    let results = {};
    let score = 0;

    nextPaper.forEach((q) => {
      const chosenKey = (nextAnswers[q.id] || "").trim().toUpperCase();
      const isCorrect = chosenKey !== "" && (q.correctKey ? chosenKey === q.correctKey.toUpperCase() : false);
      results[q.id] = isCorrect;
      if (isCorrect) score += Number(q.score) || 1;
    });

    setNextResults(results);
    setNextScore(score);
    setNextSubmitted(true);

    const total = nextPaper.reduce((s, q) => s + (q.score || 1), 0);
    const percent = total > 0 ? (score / total) * 100 : 0;

    let roundSecs = 0;
    Object.values(nextQTimers).forEach(t => { roundSecs += Math.round((t.totalMs || 0) / 1000); });

    try {
      await apiClient.post("/api/paper-logs", {
        studentId: userId,
        paperId: paper?._id,
        paperTitle: `${paper?.paperTytle || "Starting Paper"} (Round ${practiceRound})`,
        paperType: "Starting",
        marks: score,
        totalMarks: total,
        timeSpent: roundSecs,
        cheatIncidents: cheatIncidentsRef.current
      });
      cheatIncidentsRef.current = [];
    } catch (e) {
      console.error("Failed to save log:", e);
    }

    const genStats = buildCategoryStatsFromGenerated(nextPaper, results, nextAnswers, nextQTimers);
    setCategoryStats(genStats);

    let answeredCnt = 0, correctCnt = 0, total_q = 0;
    Object.values(genStats).forEach(c => {
      answeredCnt += c.answered;
      correctCnt += c.correct;
      total_q += c.total_q;
    });

    const thisRound = { 
       round: practiceRound,
       roundName: `Practice Round ${practiceRound}`,
       score, 
       total, 
       percent: Number(percent.toFixed(2)),
       timeSpent: roundSecs,
       answered: answeredCnt,
       totalQs: total_q,
       correctAnswers: correctCnt,
       unanswered: total_q - answeredCnt
    };

    const finalHistory = [...practiceHistory, thisRound];
    setPracticeHistory(finalHistory);

    const recs = await fetchRecommendations(genStats);

    const isFinal = practiceRound >= MAX_PRACTICE_ROUNDS;
    const dist = isFinal ? null : computeDistribution(recs);
    const tableHtml = buildTableHtml(score, total, percent, genStats, recs, dist, isFinal);

    await Swal.fire({
      title: "Awesome Practice!",
      html: tableHtml,
      width: '800px',
      icon: "success",
      confirmButtonText: isFinal ? "View Final Summary" : "Generate Next Paper",
      confirmButtonColor: '#0dcaf0',
      allowOutsideClick: false
    });

    if (isFinal) {
      const avgPercent = finalHistory.reduce((s, x) => s + x.percent, 0) / finalHistory.length || 0;
      let decided = "Medium";
      if (avgPercent >= 70) decided = "Hard";
      else if (avgPercent < 40) decided = "Easy";

      setFinalDifficulty(decided);
      localStorage.setItem("difficultyLevel", decided);

      try {
        await updateEntranceStatus(decided);
      } catch (e) { console.error("User update failed:", e); }

      setCurrentView("SUMMARY");
    } else {
      await autoGeneratePracticePaper(recs);
    }
  };

  const updateEntranceStatus = async (decided) => {
    if (!userId) return;
    try { await apiClient.put(`/api/users/${userId}`, { entranceTest: 1, difficultyLevel: decided }); }
    catch (e) { console.error("Failed to update entrance status:", e); }
  };


  // ================= RENDER LOGIC =================

  if (currentView === "GRADE_SELECTION") {
    return (
      <Fragment>
        <style>{startingPaperStyles}</style>
        <Header />
        <PageHeader title="Starting Paper" curPage={"Setup"} />
        <div className="paper-section padding-tb starting-paper-page">
          <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
            <div className="starting-setup-card p-5" style={{ maxWidth: 620, width: "100%" }}>
              <div className="text-center mb-4">
                <h2 className="text-primary mb-3" style={{ fontWeight: 800, fontSize: "2.5rem" }}>
                  Ready to Start? <i className="icofont-rocket ms-2"></i>
                </h2>
                <h5 className="text-muted">Choose your grade and begin the assessment.</h5>
              </div>
              <div className="d-flex justify-content-center flex-wrap gap-4 mb-5 mt-4">
                {VALID_GRADES.map((g) => {
                  const isSelected = grade === g;
                  return (
                    <button
                      key={g}
                      className={`btn btn-lg rounded-circle d-flex flex-column justify-content-center align-items-center starting-grade-btn ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setGrade(g)}
                    >
                      <span style={{ fontSize: "0.98rem" }}>Grade</span>
                      <span style={{ fontSize: "2rem" }}>{g}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-center" style={{ minHeight: "80px" }}>
                {grade ? (
                  <>
                    <p className="text-success mb-3 fs-5" style={{ fontWeight: "bold" }}>Selected Grade {grade} <i className="icofont-check-circled ms-1"></i></p>
                    <button
                      className="btn btn-primary btn-lg rounded-pill px-5 py-3 shadow"
                      style={{ fontSize: "1.4rem", fontWeight: "bold" }}
                      onClick={() => { if (VALID_GRADES.includes(grade)) setGradeConfirmed(true); }}
                    >
                      Start Paper <i className="icofont-rocket ms-2"></i>
                    </button>
                  </>
                ) : (
                  <p className="text-muted fst-italic">Select a grade to continue.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </Fragment>
    );
  }

  if (currentView === "GENERATING") {
    return (
      <Fragment>
        <style>{startingPaperStyles}</style>
        <Header />
        <PageHeader title="Generating Paper" curPage={"Processing"} />
        <div className="paper-section padding-tb starting-paper-page" style={{ minHeight: "60vh" }}>
          <div className="container d-flex justify-content-center align-items-center h-100">
            <div className="starting-loading-card p-5 text-center" style={{ maxWidth: 640 }}>
              <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} role="status"></div>
              <h3 className="mt-4 text-primary fw-bold">Generating your customized practice paper...</h3>
              <p className="text-muted mb-0">We are checking your learning level and preparing the next questions. <i className="icofont-clock-time ms-1"></i></p>
            </div>
          </div>
        </div>
        <Footer />
      </Fragment>
    );
  }

  return (
    <Fragment>
      <style>{startingPaperStyles}</style>
      <Header />
      <PageHeader
        title={currentView === "SUMMARY" ? "Performance Summary" : "Question Paper"}
        curPage={currentView === "SUMMARY" ? "Summary" : "Paper Details"}
      />
      <div className="paper-section padding-tb starting-paper-page">
        <div className="container">

          {/* --- View 3: Initial Paper --- */}
          {currentView === "INITIAL_PAPER" && (
            loading ? <p>Loading paper details...</p> : error ? <p className="text-danger">{error}</p> : paper ? (
              <div className="paper-content starting-panel p-4 p-lg-5">
                <div className="starting-hero text-center mb-5">
                  <h2 className="mb-2">{paper.paperTytle} - Initial Assessment</h2>
                  <p className="text-muted mb-4">Answer each question carefully. Your result helps MathsBuddy choose the right learning path.</p>
                  <div className="d-flex justify-content-center flex-wrap gap-3">
                    <span className="starting-stat"><i className="icofont-star"></i>{totalAvailableMarks} Marks</span>
                    <span className="starting-stat"><i className="icofont-question-circle"></i>{questions.length} Questions</span>
                    <span className="starting-stat"><i className="icofont-clock-time"></i>{PER_QUESTION_SECONDS / 60} min/question</span>
                  </div>
                </div>

                <div className="question-section mt-4">
                  {questions.length > 0 ? (
                    (() => {
                      const grouped = {};
                      questions.forEach((q) => {
                        const cat = q.paperQuestioncategory || "General";
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(q);
                      });

                      let globalIdx = 0;
                      return Object.keys(grouped).map((cat) => (
                        <div key={cat} className="mb-4">
                          <h5 className="starting-category-title mb-3"><i className="icofont-folder-open"></i>Category: {cat}</h5>
                          <ul className="question-list list-unstyled">
                            {grouped[cat].map((q) => {
                              globalIdx += 1;
                              const idx = globalIdx;
                              return (
                                <li
                                  key={q._id}
                                  className="starting-question-card mb-4 p-4"
                                  onMouseEnter={() => { ensureTimer(q._id); startTiming(q._id); }}
                                  onMouseLeave={() => { ensureTimer(q._id); stopTiming(q._id); }}
                                >
                                  <div className="starting-question-head mb-4">
                                    <h4 className="starting-question-title">
                                      <span className="starting-question-number">Q{idx}</span>
                                      <span>{q.paperQuestionTitle}</span>
                                    </h4>
                                    <span className="starting-mark-badge"><i className="icofont-star me-1"></i>{q.score} marks</span>
                                  </div>
                                  <div className="d-flex flex-column gap-2">
                                    {(Array.isArray(q.answers) ? q.answers : []).filter(t => String(t || "").trim().length > 0).map((opt, i) => {
                                      const inputId = `${q._id}_${i}`;
                                      const checked = (studentAnswers[q._id] || "") === opt;
                                      return (
                                        <div key={inputId}>
                                          <input
                                            className="btn-check starting-option-input" type="radio" name={q._id} id={inputId} value={opt}
                                            checked={checked}
                                            disabled={isSubmitted}
                                            onChange={(e) => { handleAnswerChange(q._id, e.target.value); markFirstAnswerIfNeeded(q._id); }}
                                          />
                                          <label className="starting-option-label" htmlFor={inputId}>
                                            {opt}
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ));
                    })()
                  ) : <p>No questions available.</p>}
                </div>

                <div className="starting-submit-bar mt-5 mb-2">
                  <button
                    className={`btn btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg ${isSubmitted ? 'btn-secondary' : 'btn-success'}`}
                    style={{ fontSize: "1.5rem" }}
                    onClick={submitAnswers}
                    disabled={isSubmitted || questions.length === 0}
                  >
                    {isSubmitted ? <><i className="icofont-check-circled me-2"></i>Submitted!</> : <>Submit My Answers! <i className="icofont-rocket ms-2"></i></>}
                  </button>
                </div>
              </div>
            ) : <p>Paper not found.</p>
          )}


          {/* --- View 4: Practice Paper --- */}
          {currentView === "PRACTICE_PAPER" && (
            <div className="starting-panel p-4 p-lg-5">
              <div className="starting-hero text-center mb-5">
                <h3 className="mb-2">Practice Paper {practiceRound} / {MAX_PRACTICE_ROUNDS}</h3>
                <p className="text-muted mb-4">These questions are selected from your previous performance.</p>
                <div className="d-flex justify-content-center flex-wrap gap-3">
                  <span className="starting-stat"><i className="icofont-question-circle"></i>{nextPaper.length} Questions</span>
                  <span className="starting-stat"><i className="icofont-star"></i>{nextTotal} Marks</span>
                  <span className="starting-stat"><i className="icofont-dart"></i>Round {practiceRound}</span>
                </div>
              </div>

              {(() => {
                const grouped = {};
                nextPaper.forEach((q) => {
                  const cat = q.category || "General";
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(q);
                });

                let gIdx = 0;
                return Object.keys(grouped).map((cat) => (
                  <div key={cat} className="mb-4">
                    <h5 className="starting-category-title mb-3"><i className="icofont-folder-open"></i>{cat}</h5>
                    <ul className="list-unstyled">
                      {grouped[cat].map((q) => {
                        gIdx += 1;
                        const qi = gIdx;
                        return (
                          <li
                            key={q.id}
                            className="starting-question-card mb-4 p-4"
                            onMouseEnter={() => { ensureNextTimer(q.id); startNextTiming(q.id); }}
                            onMouseLeave={() => { ensureNextTimer(q.id); stopNextTiming(q.id); }}
                          >
                            <div className="starting-question-head mb-4">
                              <h4 className="starting-question-title">
                                <span className="starting-question-number">Q{qi}</span>
                                <span>{q.question}</span>
                              </h4>
                              <span className="starting-mark-badge"><i className="icofont-star me-1"></i>{q.score} marks</span>
                            </div>
                            <div className="d-flex flex-column gap-2">
                              {(Array.isArray(q.options) ? q.options : []).map((opt) => {
                                const inputId = `${q.id}_${opt.key}`;
                                const checked = (nextAnswers[q.id] || "") === opt.key;
                                return (
                                  <div key={inputId}>
                                    <input
                                      className="btn-check starting-option-input" type="radio" name={q.id} id={inputId} value={opt.key}
                                      checked={checked}
                                      disabled={nextSubmitted}
                                      onChange={(e) => { handleNextAnswerChange(q.id, e.target.value); markNextFirstAnswerIfNeeded(q.id); }}
                                    />
                                    <label className="starting-option-label" htmlFor={inputId}>
                                      <span className="me-2">{opt.key}.</span> {opt.text}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ));
              })()}

              <div className="starting-submit-bar mt-5 mb-2">
                <button
                  className={`btn btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg ${nextSubmitted ? 'btn-secondary' : 'btn-success'}`}
                  style={{ fontSize: "1.5rem" }}
                  onClick={submitNextPaper}
                  disabled={nextSubmitted || nextPaper.length === 0}
                >
                  {nextSubmitted ? <><i className="icofont-check-circled me-2"></i>Practice Completed!</> : <>Submit Practice Paper! <i className="icofont-rocket ms-2"></i></>}
                </button>
              </div>
            </div>
          )}


          {/* --- View 5: Summary --- */}
          {currentView === "SUMMARY" && (
            <div className="starting-summary-card p-4 p-lg-5" style={{ fontFamily: "'Nunito', sans-serif" }}>
              <div className="starting-hero text-center mb-5">
                <h2 className="mb-2">Assessment Summary <i className="icofont-star ms-2"></i></h2>
                <h5 className="text-muted mb-0">You've completed the assessment phase. Here's your overall performance.</h5>
              </div>

              <div className="row g-4 mb-5">
                {practiceHistory.map((r, idx) => (
                  <div className="col-lg-6 col-12" key={r.round}>
                    <div className="card h-100 border-0 starting-round-card" style={{ borderTop: idx === 0 ? "5px solid #198754" : "5px solid #0dcaf0" }}>
                      <div className="card-body p-4">
                        <h4 className="fw-bold mb-4" style={{ color: idx === 0 ? "#198754" : "#0dcaf0", borderBottom: "2px solid #E5E7EB", paddingBottom: "10px" }}>{r.roundName}</h4>
                        
                        <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                           <span className="text-muted fw-bold">Score / Total Marks:</span>
                           <span className="fw-bold text-dark">{r.score} / {r.total} <span className="badge ms-2" style={{ backgroundColor: idx===0?"#198754":"#0dcaf0" }}>{r.percent}%</span></span>
                        </div>
                        
                        <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                           <span className="text-muted fw-bold">Total Time Spent:</span>
                           <span className="fw-bold text-dark">{Math.floor((r.timeSpent || 0) / 60)}m {(r.timeSpent || 0) % 60}s</span>
                        </div>

                        <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                           <span className="text-muted fw-bold">Answering Status:</span>
                           <span className="fw-bold text-primary">{r.answered} Answered <span className="text-muted mx-1">|</span> <span className="text-danger">{r.unanswered} Skipped</span></span>
                        </div>

                        <div className="d-flex justify-content-between mb-2">
                           <span className="text-muted fw-bold">Accuracy:</span>
                           <span className="fw-bold text-success">{r.correctAnswers} Correct out of {r.totalQs}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="table-responsive mt-3">
                <table className="table table-bordered align-middle text-center shadow-sm" style={{ fontSize: "1.2rem", borderRadius: "10px", overflow: "hidden" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Round</th>
                      <th>Score</th>
                      <th>Time Spent</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {practiceHistory.map((r) => (
                      <tr key={r.round}>
                        <td className="fw-bold text-secondary">{r.roundName}</td>
                        <td className="text-success fw-bold">{r.score} / {r.total}</td>
                        <td className="text-muted">{Math.floor((r.timeSpent || 0) / 60)}m {(r.timeSpent || 0) % 60}s</td>
                        <td className="text-info fw-bold">{r.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-primary fw-bold">
                      <th>Average Session</th>
                      <th>{(practiceHistory.reduce((s, x) => s + x.score, 0) / practiceHistory.length).toFixed(1)} / {(practiceHistory.reduce((s, x) => s + x.total, 0) / practiceHistory.length).toFixed(1)}</th>
                      <th>{Math.floor(((practiceHistory.reduce((s, x) => s + (x.timeSpent||0), 0) / practiceHistory.length) || 0) / 60)}m {Math.floor((practiceHistory.reduce((s, x) => s + (x.timeSpent||0), 0) / practiceHistory.length) || 0) % 60}s</th>
                      <th>{(practiceHistory.reduce((s, x) => s + x.percent, 0) / practiceHistory.length).toFixed(2)}%</th>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {finalDifficulty && (
                <div className="alert alert-success mt-5 text-center p-4 rounded-4 shadow-sm border-0">
                  <h4 className="fw-bold"><i className="icofont-dart me-2"></i>Recommended System Difficulty:</h4>
                  <span className={`badge px-4 py-2 mt-2 fs-5 ${finalDifficulty === "Hard" ? "bg-danger" : finalDifficulty === "Medium" ? "bg-warning text-dark" : "bg-success"}`}>
                    {finalDifficulty} Path
                  </span>
                  <p className="mb-0 mt-3 text-muted">
                    Your entire LMS experience will now be tailored to the <b>{finalDifficulty}</b> difficulty level. Good luck!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </Fragment>
  );
};

export default StartingPaper;
