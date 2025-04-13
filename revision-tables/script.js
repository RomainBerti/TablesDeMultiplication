const tablesContainer = document.getElementById("tableSelectors");
for (let i = 1; i <= 10; i++) {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" value="${i}" checked> ${i}`;
  tablesContainer.appendChild(label);
}

let questions = [], currentQuestion = 0, correctAnswers = 0, startTime = 0, playerName = "";

document.getElementById("startButton").onclick = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Merci d'entrer ton prénom !");
  const selectedTables = [...tablesContainer.querySelectorAll("input:checked")].map(cb => parseInt(cb.value));
  const mode = document.querySelector("input[name='mode']:checked").value;
  const questionCount = parseInt(document.getElementById("questionCount").value);

  if (!selectedTables.length) return alert("Choisis au moins une table !");
  playerName = name;
  questions = Array.from({length: questionCount}, () => {
    const a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, mode };
  });

  currentQuestion = 0;
  correctAnswers = 0;
  startTime = Date.now();
  document.getElementById("quizArea").classList.remove("hidden");
  document.getElementById("resultArea").classList.add("hidden");
  showQuestion();
};

document.getElementById("validateButton").onclick = () => {
  const answer = parseInt(document.getElementById("answerInput").value);
  const { a, b, mode } = questions[currentQuestion];
  const correct = (mode === "multiplication") ? a * b : a + b;
  const feedback = document.getElementById("feedback");

  if (answer === correct) {
    correctAnswers++;
    feedback.textContent = "✔ Bonne réponse !";
    feedback.style.color = "green";
  } else {
    feedback.textContent = `✘ Faux ! C'était ${correct}`;
    feedback.style.color = "red";
  }

  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion();
    } else {
      finishQuiz();
    }
  }, answer === correct ? 1000 : 2000);
};

function showQuestion() {
  const { a, b, mode } = questions[currentQuestion];
  const op = mode === "multiplication" ? "x" : "+";
  document.getElementById("questionDisplay").textContent = `${a} ${op} ${b} =`;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerInput").focus();
  document.getElementById("progress").textContent = `Question ${currentQuestion + 1} sur ${questions.length}`;
  document.getElementById("feedback").textContent = "";
}

function finishQuiz() {
  const durationSec = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const now = new Date().toLocaleString("fr-FR");

  const scoreRecord = {
    name: playerName,
    score: correctAnswers,
    total: questions.length,
    duration,
    date: now,
    tables: [...new Set(questions.map(q => q.a))].sort((a, b) => a - b).join(", ")
  };

  const history = JSON.parse(localStorage.getItem("quiz_history") || "[]");
  history.push(scoreRecord);
  history.sort((a, b) => b.score - a.score || a.duration.localeCompare(b.duration));
  localStorage.setItem("quiz_history", JSON.stringify(history));

  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("resultArea").classList.remove("hidden");
  document.getElementById("scoreSummary").textContent = `${playerName}, tu as eu ${correctAnswers} bonnes réponses sur ${questions.length} en ${duration}.`;

  const tbody = document.querySelector("#scoreTable tbody");
  tbody.innerHTML = "";
  history.forEach(r => {
    const row = tbody.insertRow();
    if (r.name === playerName) row.classList.add("highlight");
    row.insertCell().textContent = r.name;
    row.insertCell().textContent = r.tables;
    row.insertCell().textContent = `${r.score}/${r.total}`;
    row.insertCell().textContent = r.duration;
    row.insertCell().textContent = r.date;
  });
}
