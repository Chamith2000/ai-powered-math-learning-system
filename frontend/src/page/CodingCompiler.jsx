import React, { useEffect, useRef, useState } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import "../assets/css/LatestCourse.css";

const EXAMPLES = [
  { key: "manual", title: "Manual (start here)", code: "" },
  { key: "hello", title: "Hello 👋", code: `print("Hello, coder!")` },
  { key: "ask-name", title: "Ask your name 🎤", code: `name = input("What is your name? ")
print("Nice to meet you,", name + "!")` },
  { key: "add-two", title: "Add two numbers ➕", code: `a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
print("Sum is:", a + b)` },
  { key: "times-table", title: "Times table (x10) 🧮", code: `n = int(input("Show table for: "))
for i in range(1, 11):
    print(n, "x", i, "=", n*i)` },
  { key: "even-odd", title: "Even or odd 🔍", code: `n = int(input("Enter a number: "))
print("Even" if n % 2 == 0 else "Odd")` },
  { key: "count-5", title: "Count to 5 🔢", code: `for i in range(1, 6):
    print(i)` },
  { key: "stars", title: "Stars ⭐", code: `n = int(input("How many stars? "))
print("⭐" * n)` },
  { key: "factorial", title: "Factorial (loop) 🧠", code: `n = int(input("Number: "))
f = 1
for i in range(2, n+1):
    f *= i
print("Factorial =", f)` },
  { key: "fibonacci", title: "Fibonacci terms 🔗", code: `n = int(input("How many terms? "))
a, b = 0, 1
for _ in range(n):
    print(a)
    a, b = b, a+b` },
  { key: "palindrome", title: "Palindrome word 🔁", code: `w = input("Word: ").strip().lower()
print("Palindrome!" if w == w[::-1] else "Not a palindrome")` },
  { key: "mini-calc", title: "Mini calculator ➗", code: `a = float(input("a: "))
op = input("+, -, *, / : ")
b = float(input("b: "))
if op == "+":   print(a + b)
elif op == "-": print(a - b)
elif op == "*": print(a * b)
elif op == "/": print(a / b if b != 0 else "∞")
else:           print("Unknown op")` },
];

const CodingCompiler = () => {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [exampleKey, setExampleKey] = useState("manual");
  const [code, setCode] = useState(""); // empty on load (manual mode)
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");

  const scriptRef = useRef(null);

  // Load Pyodide once
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    s.onload = async () => {
      try {
        // @ts-ignore
        const p = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
        setPyodide(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    s.onerror = () => setLoading(false);
    scriptRef.current = s;
    document.body.appendChild(s);
    return () => {
      if (scriptRef.current) document.body.removeChild(scriptRef.current);
    };
  }, []);

  // Change example
  const handleExampleChange = (key) => {
    setExampleKey(key);
    const found = EXAMPLES.find((e) => e.key === key);
    setCode(found?.code ?? "");
    setStdout("");
    setStderr("");
  };

  const runCode = async () => {
    if (!pyodide) return;
    setRunning(true);
    setStdout("");
    setStderr("");

    try {
      pyodide.globals.set("USER_CODE", code ?? "");

      await pyodide.runPythonAsync(`
import builtins, io, sys
from contextlib import redirect_stdout, redirect_stderr
from js import window

def _my_input(prompt_text=""):
    # Use browser prompt for input(); return empty string if canceled
    val = window.prompt(prompt_text)
    return "" if val is None else str(val)

builtins.input = _my_input

_stdout = io.StringIO()
_stderr = io.StringIO()
with redirect_stdout(_stdout), redirect_stderr(_stderr):
    try:
        exec(USER_CODE, {})
    except Exception:
        import traceback; traceback.print_exc()

RESULT_STDOUT = _stdout.getvalue()
RESULT_STDERR = _stderr.getvalue()
      `);

      const out = pyodide.globals.get("RESULT_STDOUT");
      const err = pyodide.globals.get("RESULT_STDERR");
      setStdout(out.toString());
      setStderr(err.toString());
      out.destroy && out.destroy();
      err.destroy && err.destroy();
    } catch (e) {
      setStderr(String(e));
    } finally {
      setRunning(false);
    }
  };

  const clearOutput = () => {
    setStdout("");
    setStderr("");
  };

  return (
    <>
      <Header />
      <PageHeader title={"Python Playground"} curPage={"Python Compiler"} />

      <div className="container py-4">
        <div className="mb-3 p-3 rounded-3" style={{ background: "#fff8e1", border: "1px solid #ffe0a3" }}>
          Tip: If your program uses <code>input()</code>, a small box will pop up asking your answer.
        </div>

        {loading && (
          <div className="text-center p-4">Loading Python…</div>
        )}

        {!loading && !pyodide && (
          <div className="alert alert-danger">Couldn’t load the Python engine. Check your internet connection.</div>
        )}

        <div className="d-flex align-items-center gap-2 mb-2">
          <label className="fw-semibold">Examples:</label>
          <select
            className="form-select"
            style={{ maxWidth: 320 }}
            value={exampleKey}
            onChange={(e) => handleExampleChange(e.target.value)}
          >
            {EXAMPLES.map((ex) => (
              <option key={ex.key} value={ex.key}>{ex.title}</option>
            ))}
          </select>

          <button
            className="btn btn-primary ms-auto"
            onClick={runCode}
            disabled={!pyodide || running}
            title="Run your Python program"
          >
            {running ? "Running…" : "Run ▶"}
          </button>
          <button className="btn btn-outline-secondary" onClick={clearOutput}>Clear Output</button>
        </div>

        {/* Big code area */}
        <textarea
          className="form-control mb-3"
          style={{
            height: 420,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            fontSize: 15,
            lineHeight: 1.45,
          }}
          spellCheck={false}
          placeholder={`# Start typing your Python code here…
# e.g.
# name = input("What is your name? ")
# print("Hello,", name)`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* Output area */}
        <div className="mb-1 fw-semibold">Output</div>
        <pre
          className="p-3 rounded-3"
          style={{ background: "#f7fbff", border: "1px solid #e6f0ff", minHeight: 140, whiteSpace: "pre-wrap" }}
        >
{stdout || " "}
        </pre>

        {stderr && (
          <>
            <div className="mb-1 fw-semibold text-danger">Errors</div>
            <pre
              className="p-3 rounded-3"
              style={{ background: "#fff6f6", border: "1px solid #ffd3d3", color: "#9b0c0c", whiteSpace: "pre-wrap" }}
            >
{stderr}
            </pre>
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default CodingCompiler;
