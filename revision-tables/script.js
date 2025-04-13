
const tablesContainer = document.getElementById("tableSelectors");
function generateTableCheckboxes() {
  tablesContainer.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const label = document.createElement("label");
    label.style.marginRight = "8px";
    label.innerHTML = `<input type="checkbox" value="${i}" checked> ${i}`;
    tablesContainer.appendChild(label);
  }
}
generateTableCheckboxes();

let questions = [], currentQuestion = 0, correctAnswers = 0, startTime = 0, playerName = "";
let timerInterval = null;

document.querySelectorAll('input[name="exerciseType"]').forEach(el => {
  el.addEventListener("change", () => {
    const isTimed = document.querySelector('input[name="exerciseType"]:checked').value === "timed";
    document.getElementById("timerDurationSection").style.display = isTimed ? "block" : "none";
    document.getElementById("fixedCountSection").style.display = isTimed ? "none" : "block";
  });
});

document.getElementById("startButton").onclick = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Merci d'entrer ton prénom !");
  const selectedTables = [...tablesContainer.querySelectorAll("input:checked")].map(cb => parseInt(cb.value));
  const mode = document.querySelector("input[name='mode']:checked").value;
  const exerciseType = document.querySelector('input[name="exerciseType"]:checked').value;
  const questionCount = parseInt(document.getElementById("questionCount").value);
  const timerMinutes = parseFloat(document.getElementById("timerDuration").value);

  if (!selectedTables.length) return alert("Choisis au moins une table !");
  playerName = name;
  questions = [];
  currentQuestion = 0;
  correctAnswers = 0;
  startTime = Date.now();
  document.getElementById("quizArea").classList.remove("hidden");
  document.getElementById("resultArea").classList.add("hidden");

  if (exerciseType === "fixed") {
    questions = Array.from({length: questionCount}, () => {
      const a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
      const b = Math.floor(Math.random() * 10) + 1;
      return { a, b, mode };
    });
    showQuestion();
  } else {
    startTimer(timerMinutes);
    nextTimedQuestion(selectedTables, mode);
  }
};

const progressBar = document.createElement("div");
progressBar.className = "progress-bar";
document.getElementById("quizArea").prepend(progressBar);

document.getElementById("validateButton").onclick = () => {
  const answer = parseInt(document.getElementById("answerInput").value);
  const { a, b, mode } = questions[currentQuestion];
  const correct = (mode === "multiplication") ? a * b : a + b;
  const feedback = document.getElementById("feedback");

  questions[currentQuestion].correct = answer === correct;

  if (answer === correct) {
    correctAnswers++;
    feedback.textContent = "✔ Bonne réponse !";
    feedback.style.color = "green";
  } else {
    feedback.textContent = `✘ Faux ! C'était ${correct}`;
    feedback.style.color = "red";
  }

  const exerciseType = document.querySelector('input[name="exerciseType"]:checked').value;

  setTimeout(() => {
    if (exerciseType === "timed") {
      const selectedTables = [...document.querySelectorAll("#tableSelectors input:checked")].map(cb => parseInt(cb.value));
      const mode = document.querySelector('input[name="mode"]:checked').value;
      nextTimedQuestion(selectedTables, mode);
    } else {
      currentQuestion++;
      if (currentQuestion < questions.length) {
        showQuestion();
      } else {
        finishQuiz();
      }
    }
  }, answer === correct ? 1000 : 2000);
};

function nextTimedQuestion(selectedTables, mode) {
  const a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
  const b = Math.floor(Math.random() * 10) + 1;
  questions.push({ a, b, mode });
  currentQuestion = questions.length - 1;
  showQuestion();
}

function showQuestion() {
  const { a, b, mode } = questions[currentQuestion];
  const op = mode === "multiplication" ? "x" : "+";
  document.getElementById("questionDisplay").textContent = `${a} ${op} ${b} =`;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerInput").focus();
  document.getElementById("feedback").textContent = "";
  updateProgressBar();

  document.getElementById("answerInput").onkeydown = function(event) {
    if (event.key === "Enter") {
      document.getElementById("validateButton").click();
    }
  };
}

function startTimer(durationMinutes) {
  let timeLeft = durationMinutes * 60;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("progress").textContent = `Temps restant : ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz();
    }
  }, 1000);
}

function updateProgressBar() {
  progressBar.innerHTML = "";
  for (let i = 0; i < questions.length; i++) {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    if (i < currentQuestion) {
      dot.classList.add(questions[i].correct ? "correct" : "incorrect");
    }
    progressBar.appendChild(dot);
  }
}

function finishQuiz() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

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

  const exerciseType = document.querySelector('input[name="exerciseType"]:checked').value;
  const storageKey = exerciseType === "timed" ? "quiz_history_timed" : "quiz_history";
  const history = JSON.parse(localStorage.getItem(storageKey) || "[]");
  history.push(scoreRecord);
  history.sort((a, b) => b.score - a.score || a.duration.localeCompare(b.duration));
  localStorage.setItem(storageKey, JSON.stringify(history));

  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("resultArea").classList.remove("hidden");

  let encouragement = "";
  if (correctAnswers === questions.length) {
    encouragement = "🏆 Tu as tout réussi ! Bravo champion·ne !";
    document.getElementById("celebrationImage").src = "https://media.giphy.com/media/26FPGQKCzMc5sKpxC/giphy.gif";
    document.getElementById("celebrationImage").style.display = "block";
  } else if (correctAnswers >= questions.length * 0.75) {
    encouragement = "🎉 Super score, continue comme ça !";
    document.getElementById("celebrationImage").style.display = "none";
  } else {
    encouragement = "💪 Ne lâche pas, tu progresses !";
    document.getElementById("celebrationImage").style.display = "none";
  }

  document.getElementById("scoreSummary").textContent =
    `${playerName}, tu as eu ${correctAnswers} bonnes réponses sur ${questions.length} en ${duration}. ${encouragement}`;

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

document.getElementById("resetScoresButton").onclick = () => {
  if (confirm("Es-tu sûr·e de vouloir effacer tout le classement ?")) {
    localStorage.removeItem("quiz_history");
    document.querySelector("#scoreTable tbody").innerHTML = "";
  }
};

document.querySelectorAll(".quick-time").forEach(btn => {
  btn.addEventListener("click", () => {
    const val = parseFloat(btn.getAttribute("data-minutes"));
    document.getElementById("timerDuration").value = val;
  });
});
