import React, { useEffect, useRef, useState } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import "../assets/css/LatestCourse.css";

const EXAMPLES = [
  { key: "manual", title: "Manual (start here)", code: "" },
  { key: "hello", title: "Hello 👋", code: `print("Hello, coder!")` },
  {
    key: "ask-name", title: "Ask your name 🎤", code: `name = input("What is your name? ")
print("Nice to meet you,", name + "!")` },
  {
    key: "add-two", title: "Add two numbers ➕", code: `a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
print("Sum is:", a + b)` },
  {
    key: "times-table", title: "Times table (x10) 🧮", code: `n = int(input("Show table for: "))
for i in range(1, 11):
    print(n, "x", i, "=", n*i)` },
  {
    key: "even-odd", title: "Even or odd 🔍", code: `n = int(input("Enter a number: "))
print("Even" if n % 2 == 0 else "Odd")` },
  {
    key: "count-5", title: "Count to 5 🔢", code: `for i in range(1, 6):
    print(i)` },
  {
    key: "stars", title: "Stars ⭐", code: `n = int(input("How many stars? "))
print("⭐" * n)` },
  {
    key: "factorial", title: "Factorial (loop) 🧠", code: `n = int(input("Number: "))
f = 1
for i in range(2, n+1):
    f *= i
print("Factorial =", f)` },
  {
    key: "fibonacci", title: "Fibonacci terms 🔗", code: `n = int(input("How many terms? "))
a, b = 0, 1
for _ in range(n):
    print(a)
    a, b = b, a+b` },
  {
    key: "palindrome", title: "Palindrome word 🔁", code: `w = input("Word: ").strip().lower()
print("Palindrome!" if w == w[::-1] else "Not a palindrome")` },
  {
    key: "mini-calc", title: "Mini calculator ➗", code: `a = float(input("a: "))
op = input("+, -, *, / : ")
b = float(input("b: "))
if op == "+":   print(a + b)
elif op == "-": print(a - b)
elif op == "*": print(a * b)
elif op == "/": print(a / b if b != 0 else "∞")
else:           print("Unknown op")` },
];

const MathsCompiler = () => {
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
      <PageHeader title={"Maths Playground 🧮"} curPage={"Maths Compiler"} />

      <main className="py-5" style={{ backgroundColor: "#f8f9fa", backgroundImage: "url('/images/background/bg1.png')", backgroundSize: "cover", backgroundBlendMode: "overlay" }}>
        <div className="container">

          <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: "24px", overflow: "hidden", borderTop: "8px solid #4cc9f0" }}>
            <div className="card-body p-4 p-md-5 bg-white">

              <div className="text-center mb-4">
                <h2 className="fw-bold mb-3" style={{ color: "#f72585" }}>Let's Write Some Code! 💻</h2>
                <div className="alert border-0 rounded-pill shadow-sm d-inline-block px-4 py-2" style={{ backgroundColor: "#fff3cd", color: "#856404" }}>
                  💡 <strong>Tip:</strong> If your program uses <code>input()</code>, a small box will pop up asking your answer.
                </div>
              </div>

              {loading && (
                <div className="text-center p-4">
                  <div className="spinner-border text-info mb-2" role="status"></div>
                  <h5 className="text-info fw-bold">Waking up the Maths Engine... 🧮</h5>
                </div>
              )}

              {!loading && !pyodide && (
                <div className="alert alert-danger rounded-4 shadow-sm text-center">
                  Oh no! 🙈 We couldn't load Maths. Please check your internet connection and try again!
                </div>
              )}

              <div className="row g-3 align-items-center mb-4 bg-light p-3 rounded-4 border border-2 border-info shadow-sm">
                <div className="col-12 col-md-auto">
                  <span className="fw-bold fs-5 text-primary">🪄 Magic Spells (Examples):</span>
                </div>
                <div className="col-12 col-md">
                  <select
                    className="form-select form-select-lg rounded-pill border-2 border-primary shadow-sm fw-bold text-dark"
                    value={exampleKey}
                    onChange={(e) => handleExampleChange(e.target.value)}
                  >
                    {EXAMPLES.map((ex) => (
                      <option key={ex.key} value={ex.key}>{ex.title}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-auto d-flex gap-2 justify-content-center mt-3 mt-md-0">
                  <button
                    className="btn btn-warning btn-lg rounded-pill fw-bold shadow-sm px-4"
                    onClick={clearOutput}
                    title="Clear the output screen"
                  >
                    🧹 Clear
                  </button>
                  <button
                    className="btn btn-success btn-lg rounded-pill fw-bold shadow-sm px-5"
                    onClick={runCode}
                    disabled={!pyodide || running}
                    style={{ transform: running ? "scale(0.95)" : "scale(1)", transition: "transform 0.2s" }}
                  >
                    {running ? "Running... 🏃" : "Run Code! ▶️"}
                  </button>
                </div>
              </div>

              <div className="row g-4">
                {/* Code Editor */}
                <div className="col-lg-7">
                  <div className="card h-100 border-0 shadow-sm rounded-4" style={{ border: "2px solid #e2e8f0" }}>
                    <div className="card-header border-0 rounded-top-4 py-3" style={{ backgroundColor: "#2b2d42" }}>
                      <div className="d-flex gap-2">
                        <div className="rounded-circle bg-danger" style={{ width: 12, height: 12 }}></div>
                        <div className="rounded-circle bg-warning" style={{ width: 12, height: 12 }}></div>
                        <div className="rounded-circle bg-success" style={{ width: 12, height: 12 }}></div>
                      </div>
                    </div>
                    <textarea
                      className="form-control border-0 rounded-bottom-4 p-4 shadow-none"
                      style={{
                        height: 400,
                        backgroundColor: "#111827",
                        color: "#10b981", // Matrix green text
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                        fontSize: "1.1rem",
                        lineHeight: 1.6,
                        resize: "none"
                      }}
                      spellCheck={false}
                      placeholder={`# Start typing your Maths code here…\n# e.g.\n# name = input("What is your name? ")\n# print("Hello,", name)`}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Output Screen */}
                <div className="col-lg-5">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style={{ border: "2px solid #e2e8f0" }}>
                    <div className="card-header bg-primary text-white border-0 py-3">
                      <h5 className="mb-0 fw-bold">🖥️ Output Screen</h5>
                    </div>
                    <div className="card-body bg-light p-0 d-flex flex-column">
                      <pre
                        className="p-4 mb-0 flex-grow-1"
                        style={{
                          fontFamily: 'ui-monospace, Consolas, monospace',
                          fontSize: "1.05rem",
                          whiteSpace: "pre-wrap",
                          color: "#1e293b",
                          minHeight: "200px"
                        }}
                      >
                        {stdout || " "}
                      </pre>

                      {stderr && (
                        <div className="p-3 border-top" style={{ backgroundColor: "#fef2f2" }}>
                          <div className="mb-2 fw-bold text-danger">⚠️ Oops! Found an Error:</div>
                          <pre
                            className="p-3 rounded-3 mb-0"
                            style={{ background: "#fff", border: "1px dashed #fca5a5", color: "#b91c1c", whiteSpace: "pre-wrap", fontSize: "0.95rem" }}
                          >
                            {stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default MathsCompiler;
