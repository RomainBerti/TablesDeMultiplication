import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import random
import time
import json
import os
from datetime import datetime

class MultiplicationApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Révision des tables de multiplication")

        # Sélection des tables
        self.table_vars = []
        tables_frame = tk.LabelFrame(root, text="Choisis les tables à réviser")
        tables_frame.pack(padx=10, pady=5)

        for i in range(1, 11):
            var = tk.IntVar()
            chk = tk.Checkbutton(tables_frame, text=f"Table de {i}", variable=var)
            chk.grid(row=0, column=i-1, padx=5)
            self.table_vars.append(var)

        # Choix du nombre de questions
        options_frame = tk.Frame(root)
        options_frame.pack(padx=10, pady=5)

        tk.Label(options_frame, text="Nombre de questions :").grid(row=0, column=0)
        self.nb_questions = tk.Spinbox(options_frame, from_=1, to=50, width=5)
        self.nb_questions.grid(row=0, column=1, padx=5)

        # Bouton Commencer
        self.start_button = tk.Button(root, text="Commencer", command=self.start_quiz)
        self.start_button.pack(pady=10)

        self.reset_button = tk.Button(root, text="Réinitialiser l'historique", command=self.reset_history)
        self.reset_button.pack(pady=5)

    def reset_history(self):
        results_file = "results.json"
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
            self.questions.append((a, b))

        self.show_next_question()

    def show_next_question(self):
        for widget in self.root.winfo_children():
            if isinstance(widget, tk.Frame) and "question_frame" in str(widget):
                widget.destroy()

        if self.current_question >= self.nb_questions_total:
            self.finish_quiz()
            return

        a, b = self.questions[self.current_question]
        self.answer_frame = tk.Frame(self.root, name="question_frame")
        self.answer_frame.pack(pady=10)

        self.question_label = tk.Label(self.answer_frame, text=f"{a} x {b} = ?")
        self.question_label.pack()

        self.answer_entry = tk.Entry(self.answer_frame)
        self.answer_entry.pack()

        self.validate_button = tk.Button(self.answer_frame, text="Valider", command=self.check_answer)
        self.validate_button.pack()

        self.feedback_label = tk.Label(self.answer_frame, text="", font=("Arial", 12))
        self.feedback_label.pack(pady=5)

        self.correct_result = a * b
        self.answer_entry.focus_set()

    def check_answer(self):
        try:
            user_answer = int(self.answer_entry.get())
            if user_answer == self.correct_result:
                self.correct_answers += 1
                self.feedback_label.config(text="✔ Bonne réponse !", fg="green")
            else:
                self.feedback_label.config(text=f"✘ Faux ! C'était {self.correct_result}", fg="red")
        except ValueError:
            self.feedback_label.config(text="✘ Entrée invalide", fg="red")
            return

        self.root.after(1000, self.next_question_step)

    def next_question_step(self):
        self.current_question += 1
        self.show_next_question()

    def finish_quiz(self):
        duration = round(time.time() - self.start_time, 2)
        result = {
            "score": self.correct_answers,
            "total": self.nb_questions_total,
            "duration": duration,
            "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        results_file = "results.json"
        results = []
        if os.path.exists(results_file):
            with open(results_file, "r") as f:
                results = json.load(f)

        results.append(result)
        results.sort(key=lambda x: (-x["score"], x["duration"]))

        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)

        ranking = results.index(result) + 1
        result_window = tk.Toplevel(self.root)
        result_window.title("Résultats du quiz")

        tk.Label(result_window, text=f"Score : {self.correct_answers}/{self.nb_questions_total}", font=("Arial", 12)).pack(pady=2)
        tk.Label(result_window, text=f"Temps : {duration} secondes", font=("Arial", 12)).pack(pady=2)
        tk.Label(result_window, text=f"Classement : #{ranking} sur {len(results)}", font=("Arial", 12, "bold")).pack(pady=5)
        tk.Label(result_window, text="Historique des tests :", font=("Arial", 11, "underline")).pack(pady=(10, 2))

        tree = ttk.Treeview(result_window, columns=("datetime", "score", "total", "duration"), show="headings")
        tree.heading("datetime", text="Date/Heure")
        tree.heading("score", text="Score")
        tree.heading("total", text="Total")
        tree.heading("duration", text="Durée (s)")

        for r in reversed(results):
            tree.insert("", "end", values=(r["datetime"], r["score"], r["total"], r["duration"]))

        tree.pack(padx=10, pady=10)

if __name__ == "__main__":
    root = tk.Tk()
    app = MultiplicationApp(root)
    root.mainloop()