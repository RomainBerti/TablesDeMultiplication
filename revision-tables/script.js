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
  document.getElementById("answerInput").onkeydown = function(event) {
    if (event.key === "Enter") {
      document.getElementById("validateButton").click();
    }
  };
  updateProgressBar();
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
