# Plan Commitów - Przewidywanie Intencji Zakupowych

Ten dokument zawiera plan logicznych commitów, które odzwierciedlają proces tworzenia projektu od zera.

## Kolejność Commitów

### Commit 1: Inicjalizacja projektu
**Pliki:**
- `requirements.txt` - zależności projektu
- `.gitignore` - ignorowane pliki

**Wiadomość:**
```
feat: inicjalizacja projektu - dodanie requirements.txt i .gitignore

- Dodano requirements.txt z podstawowymi zależnościami
- Dodano .gitignore dla projektu Python/ML
```

---

### Commit 2: Klasa DataLoader - wczytywanie danych
**Pliki:**
- `ml_classes.py` (tylko klasa DataLoader i importy)

**Wiadomość:**
```
feat: dodanie klasy DataLoader do wczytywania danych CSV

- Implementacja metody load_data() do wczytywania plików CSV
- Implementacja metody get_info() do pobierania podstawowych informacji o danych
- Obsługa błędów (FileNotFoundError, Exception)
```

---

### Commit 3: Klasa DataPreprocessor - preprocessing danych
**Pliki:**
- `ml_classes.py` (dodanie klasy DataPreprocessor)

**Wiadomość:**
```
feat: dodanie klasy DataPreprocessor do przetwarzania danych

- Metoda handle_missing_values() - obsługa brakujących wartości (drop/mean)
- Metoda encode_categorical() - kodowanie zmiennych kategorycznych (label/onehot)
- Metoda normalize_features() - normalizacja cech numerycznych (StandardScaler)
- Metoda preprocess_pipeline() - pełny pipeline preprocessingu
- Zapisywanie encoders i scalera do późniejszego użycia
```

---

### Commit 4: Funkcja pomocnicza do obsługi niezbalansowania klas
**Pliki:**
- `ml_classes.py` (dodanie funkcji check_and_handle_imbalance)

**Wiadomość:**
```
feat: dodanie funkcji check_and_handle_imbalance

- Automatyczne wykrywanie niezbalansowania klas
- Zwracanie odpowiednich parametrów (class_weight='balanced')
- Wsparcie dla modeli wrażliwych na niezbalansowanie klas
```

---

### Commit 5: Klasa DataAnalyzer - analiza i wizualizacja
**Pliki:**
- `ml_classes.py` (dodanie klasy DataAnalyzer)

**Wiadomość:**
```
feat: dodanie klasy DataAnalyzer do analizy danych

- Metoda descriptive_statistics() - statystyki opisowe
- Metoda correlation_analysis() - analiza korelacji z targetem
- Metoda visualize_correlations() - wizualizacja macierzy korelacji
- Metoda class_balance_analysis() - analiza balansu klas z wizualizacją
- Metoda visualize_distributions() - wizualizacja rozkładów zmiennych
```

---

### Commit 6: Klasa FeatureEngineer - feature engineering
**Pliki:**
- `ml_classes.py` (dodanie klasy FeatureEngineer)

**Wiadomość:**
```
feat: dodanie klasy FeatureEngineer do tworzenia i selekcji cech

- Metoda create_interaction_features() - tworzenie cech interakcyjnych:
  * TotalPages (suma stron)
  * TotalDuration (suma czasu)
  * AvgPageDuration (średni czas na stronę)
  * BounceExitRatio (stosunek bounce do exit)
  * ProductRelatedRatio (proporcja stron produktowych)
- Metoda select_features() - selekcja cech (correlation/importance)
- Wsparcie dla Random Forest Feature Importance
```

---

### Commit 7: Klasa ModelTrainer - trenowanie modeli
**Pliki:**
- `ml_classes.py` (dodanie klasy ModelTrainer)

**Wiadomość:**
```
feat: dodanie klasy ModelTrainer do trenowania i ewaluacji modeli

- Metoda train_model() - trenowanie modeli (logistic/random_forest/svm)
- Automatyczna obsługa niezbalansowania klas
- Metoda evaluate_model() - ewaluacja modelu (accuracy, precision, recall, f1, roc_auc, confusion_matrix)
- Metoda compare_models() - porównywanie wielu modeli
- Wsparcie dla Pipeline ze StandardScaler
```

---

### Commit 8: Klasa HyperparameterTuner - optymalizacja hiperparametrów
**Pliki:**
- `ml_classes.py` (dodanie klasy HyperparameterTuner)

**Wiadomość:**
```
feat: dodanie klasy HyperparameterTuner do optymalizacji hiperparametrów

- Metoda grid_search() - Grid Search CV z Pipeline
- Metoda random_search() - Random Search CV z Pipeline
- Automatyczne tworzenie Pipeline ze StandardScaler
- Obsługa prefiksów 'model__' dla parametrów w Pipeline
- Automatyczna obsługa niezbalansowania klas
```

---

### Commit 9: Testy jednostkowe - DataLoader
**Pliki:**
- `test_data_loader.py`

**Wiadomość:**
```
test: dodanie testów jednostkowych dla klasy DataLoader

- Test pomyślnego wczytania danych
- Test obsługi nieistniejącego pliku
- Test pobierania informacji o danych
- Test pobierania informacji gdy dane nie zostały wczytane
```

---

### Commit 10: Testy jednostkowe - DataPreprocessor
**Pliki:**
- `test_preprocessor.py`

**Wiadomość:**
```
test: dodanie testów jednostkowych dla klasy DataPreprocessor

- Test obsługi brakujących wartości (drop/mean)
- Test kodowania kategorycznych (label/onehot)
- Test normalizacji cech
- Test pełnego pipeline preprocessingu
```

---

### Commit 11: Testy jednostkowe - FeatureEngineer
**Pliki:**
- `test_feature_engineer.py`

**Wiadomość:**
```
test: dodanie testów jednostkowych dla klasy FeatureEngineer

- Test tworzenia cech interakcyjnych
- Test selekcji cech metodą korelacji
- Test selekcji cech metodą ważności (Random Forest)
```

---

### Commit 12: Testy jednostkowe - ModelTrainer
**Pliki:**
- `test_model_trainer.py`

**Wiadomość:**
```
test: dodanie testów jednostkowych dla klasy ModelTrainer

- Test trenowania modeli (Logistic Regression, Random Forest, SVM)
- Test ewaluacji modelu
- Test porównywania modeli
```

---

### Commit 13: Notebook z analizą danych i modelowaniem
**Pliki:**
- `main.ipynb`

**Wiadomość:**
```
feat: dodanie notebooka z pełną analizą danych i modelowaniem

- Wczytanie i eksploracja danych
- Preprocessing danych
- Analiza eksploracyjna (EDA) z wizualizacjami
- Feature engineering
- Trenowanie i porównanie modeli baseline
- Optymalizacja hiperparametrów (Grid Search)
- Szczegółowa ewaluacja najlepszego modelu
- Wizualizacje wyników (confusion matrix, ROC curve, CV scores)
```

---

### Commit 14: Dokumentacja projektu
**Pliki:**
- `RAPORT.md`

**Wiadomość:**
```
docs: dodanie dokumentacji projektu

- Opis problemu i celu projektu
- Opis zbioru danych
- Dokumentacja preprocessing
- Analiza eksploracyjna (EDA)
- Feature engineering
- Modelowanie i wyniki
- Ewaluacja i wnioski
```

---

## Instrukcja użycia

Aby odtworzyć projekt krok po kroku na GitHub:

1. Utwórz nowe repozytorium na GitHub
2. Wykonaj commity w podanej kolejności
3. Każdy commit powinien zawierać tylko pliki wymienione w planie
4. Użyj podanych wiadomości commitów lub podobnych

## Uwagi

- Każdy commit jest mały i logicznie spójny
- Kolejność odzwierciedla naturalny proces rozwoju projektu
- Commity można wykonać pojedynczo lub w większych grupach
- Testy można dodać razem z klasami lub osobno (zgodnie z preferencjami)
