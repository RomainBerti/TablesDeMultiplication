import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import random
import time
import json
import os
import sys
from datetime import datetime

class MultiplicationApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Révision des tables")
        self.mode = tk.StringVar(value="multiplication")
        mode_frame = tk.Frame(root)
        mode_frame.pack(pady=10)

        tk.Label(mode_frame, text="Mode :", font=("Arial", 20)).pack(side="left", padx=10)
        tk.Radiobutton(mode_frame, text="Multiplication", variable=self.mode, value="multiplication", font=("Arial", 20)).pack(side="left")
        tk.Radiobutton(mode_frame, text="Addition", variable=self.mode, value="addition", font=("Arial", 20)).pack(side="left")

        # Sélection des tables
        self.table_vars = []
        tables_frame = tk.LabelFrame(root, text="Choisis les tables à réviser", font=("Arial", 20))
        tables_frame.pack(padx=10, pady=5)

        for i in range(1, 11):
            var = tk.IntVar()
            chk = tk.Checkbutton(tables_frame, text=f"Table de {i}", variable=var, font=("Arial", 20))
            chk.grid(row=0, column=i-1, padx=5)
            self.table_vars.append(var)

        # Choix du nombre de questions
        options_frame = tk.Frame(root)
        options_frame.pack(padx=10, pady=5)

        tk.Label(options_frame, text="Nombre de questions :", font=("Arial", 20)).grid(row=0, column=0)
        self.nb_questions = tk.Spinbox(options_frame, from_=1, to=50, width=5, font=("Arial", 20))
        self.nb_questions.grid(row=0, column=1, padx=5)

        # Bouton Commencer
        self.start_button = tk.Button(root, text="Commencer", command=self.start_quiz, font=("Arial", 20))
        self.start_button.pack(pady=10)

        self.reset_button = tk.Button(root, text="Réinitialiser l'historique", command=self.reset_history, font=("Arial", 20))
        self.reset_button.pack(pady=5)

        self.sound_enabled = tk.IntVar()
        self.sound_checkbox = tk.Checkbutton(root, text="Activer les sons", variable=self.sound_enabled, font=("Arial", 20))
        self.sound_checkbox.pack(pady=5)

    def reset_history(self):
        results_file = "results.json" if self.mode.get() == "multiplication" else "results_addition.json"
        if os.path.exists(results_file):
            os.remove(results_file)
            messagebox.showinfo("Historique réinitialisé", "Les résultats précédents ont été supprimés.")
        else:
            messagebox.showinfo("Aucun historique", "Aucun fichier de résultats à supprimer.")

    def start_quiz(self):
        self.selected_tables = [i+1 for i, var in enumerate(self.table_vars) if var.get() == 1]
        self.nb_questions_total = int(self.nb_questions.get())
        self.current_question = 0
        self.correct_answers = 0
        self.questions = []
        self.start_time = time.time()

        if not self.selected_tables:
            messagebox.showwarning("Attention", "Choisis au moins une table.")
            return

        for _ in range(self.nb_questions_total):
            a = random.choice(self.selected_tables)
            b = random.randint(1, 10)
            self.questions.append((a, b, self.mode.get()))

        self.show_next_question()

    def show_next_question(self):
        for widget in self.root.winfo_children():
            if isinstance(widget, tk.Frame) and "question_frame" in str(widget):
                widget.destroy()

        if self.current_question >= self.nb_questions_total:
            self.finish_quiz()
            return

        a, b, mode = self.questions[self.current_question]
        self.answer_frame = tk.Frame(self.root, name="question_frame")
        self.answer_frame.pack(pady=10)

        remaining = self.nb_questions_total - self.current_question
        self.remaining_label = tk.Label(self.answer_frame, text=f"Question {self.current_question + 1} sur {self.nb_questions_total}", font=("Arial", 20))
        self.remaining_label.pack(pady=2)

        tk.Label(self.answer_frame, text="", font=("Arial", 10)).pack(pady=5)

        qa_frame = tk.Frame(self.answer_frame)
        qa_frame.pack(pady=5)

        operator = "x" if mode == "multiplication" else "+"
        self.question_label = tk.Label(qa_frame, text=f"{a} {operator} {b} = ", font=("Arial", 20))
        self.question_label.pack(side="left")

        self.answer_entry = tk.Entry(qa_frame, font=("Arial", 20), width=5)
        self.answer_entry.pack(side="left")

        self.validate_button = tk.Button(self.answer_frame, text="Valider", command=self.check_answer, font=("Arial", 20))
        self.validate_button.pack()

        self.feedback_label = tk.Label(self.answer_frame, text="", font=("Arial", 20))
        self.feedback_label.pack(pady=5)

        if mode == "multiplication":
            self.correct_result = a * b
        else:
            self.correct_result = a + b

        self.answer_entry.focus_set()
        self.root.bind('<Return>', lambda event: self.check_answer())

    def check_answer(self):
        try:
            user_answer = int(self.answer_entry.get())
            if user_answer == self.correct_result:
                self.correct_answers += 1
                self.feedback_label.config(text="✔ Bonne réponse !", fg="green")
                self.root.after(1000, self.next_question_step)
                if self.sound_enabled.get():
                    os.system("afplay /System/Library/Sounds/Glass.aiff &")
            else:
                self.feedback_label.config(text=f"✘ Faux ! C'était {self.correct_result}", fg="red", font=("Arial", 28))
                self.root.after(2000, self.next_question_step)
                if self.sound_enabled.get():
                    os.system("afplay /System/Library/Sounds/Basso.aiff &")
        except ValueError:
            self.feedback_label.config(text="✘ Entrée invalide", fg="red")
            return

    def next_question_step(self):
        self.current_question += 1
        self.show_next_question()

    def finish_quiz(self):
        duration = round(time.time() - self.start_time, 2)
        result = {
            "score": self.correct_answers,
            "total": self.nb_questions_total,
            "duration": duration,
            "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "tables": self.selected_tables
        }

        results_file = "results.json" if self.mode.get() == "multiplication" else "results_addition.json"
        results = []
        if os.path.exists(results_file):
            with open(results_file, "r") as f:
                results = json.load(f)

        results.append(result)
        results.sort(key=lambda x: (-x["score"], x["duration"]))

        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)

        ranking = results.index(result) + 1
        success_perfect = self.correct_answers == self.nb_questions_total
        if success_perfect and self.sound_enabled.get():
            os.system("afplay /System/Library/Sounds/Ping.aiff &")

        result_window = tk.Toplevel(self.root)
        result_window.title("Résultats du quiz")

        tk.Label(result_window, text=f"Score : {self.correct_answers}/{self.nb_questions_total}", font=("Arial", 20)).pack(pady=2)
        tk.Label(result_window, text=f"Temps : {duration} secondes", font=("Arial", 20)).pack(pady=2)
        tk.Label(result_window, text=f"Classement : #{ranking} sur {len(results)}", font=("Arial", 20, "bold")).pack(pady=5)

        if success_perfect:
            tk.Label(result_window, text="🎉 Félicitations pour le score parfait ! 🎉", font=("Arial", 22, "bold"), fg="blue").pack(pady=10)

        historique_label = "Historique des tests de multiplication" if self.mode.get() == "multiplication" else "Historique des tests d'addition"
        tk.Label(result_window, text=historique_label, font=("Arial", 20, "underline")).pack(pady=(10, 2))

        tree = ttk.Treeview(result_window, columns=("datetime", "tables", "score", "total", "duration"), show="headings")
        tree.heading("datetime", text="Date/Heure", anchor='center')
        tree.heading("tables", text="Tables", anchor='center')
        tree.heading("score", text="Score", anchor='center')
        tree.heading("total", text="Total", anchor='center')
        tree.heading("duration", text="Durée", anchor='center')

        for r in results:
            minutes = int(r["duration"]) // 60
            seconds = int(r["duration"]) % 60
            formatted_duration = f"{minutes:02d}:{seconds:02d}"
            tables_str = ", ".join(str(t) for t in r.get("tables", []))
            tree.insert("", "end", values=(r["datetime"], tables_str, r["score"], r["total"], formatted_duration))

        tree.pack(padx=10, pady=10)

if __name__ == "__main__":
    root = tk.Tk()
    app = MultiplicationApp(root)
    root.mainloop()