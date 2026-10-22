"""
Testy jednostkowe dla klasy ModelTrainer
"""
import unittest
import pandas as pd
import numpy as np
from sklearn.datasets import make_classification
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_classes import ModelTrainer


class TestModelTrainer(unittest.TestCase):
    """Testy dla klasy ModelTrainer"""
    
    def setUp(self):
        """Przygotowanie testów"""
        self.trainer = ModelTrainer()
        
        # Tworzenie syntetycznych danych testowych
        X, y = make_classification(
            n_samples=100,
            n_features=10,
            n_informative=5,
            n_redundant=5,
            n_classes=2,
            random_state=42
        )
        
        self.X_train = X[:80]
        self.X_test = X[80:]
        self.y_train = y[:80]
        self.y_test = y[80:]
    
    def test_train_model_logistic(self):
        """Test trenowania modelu Logistic Regression"""
        model = self.trainer.train_model(
            self.X_train,
            self.y_train,
            model_type='logistic'
        )
        
        self.assertIsNotNone(model)
        self.assertIn('logistic', self.trainer.models)
    
    def test_train_model_random_forest(self):
        """Test trenowania modelu Random Forest"""
        model = self.trainer.train_model(
            self.X_train,
            self.y_train,
            model_type='random_forest',
            n_estimators=10
        )
        
        self.assertIsNotNone(model)
        self.assertIn('random_forest', self.trainer.models)
    
    def test_train_model_svm(self):
        """Test trenowania modelu SVM"""
        model = self.trainer.train_model(
            self.X_train,
            self.y_train,
            model_type='svm'
        )
        
        self.assertIsNotNone(model)
        self.assertIn('svm', self.trainer.models)
    
    def test_evaluate_model(self):
        """Test ewaluacji modelu"""
        model = self.trainer.train_model(
            self.X_train,
            self.y_train,
            model_type='logistic'
        )
        
        metrics = self.trainer.evaluate_model(model, self.X_test, self.y_test)
        
        self.assertIsInstance(metrics, dict)
        self.assertIn('accuracy', metrics)
        self.assertIn('precision', metrics)
        self.assertIn('recall', metrics)
        self.assertIn('f1_score', metrics)
        self.assertIn('confusion_matrix', metrics)
        
        # Sprawdź czy metryki są w odpowiednim zakresie
        self.assertGreaterEqual(metrics['accuracy'], 0)
        self.assertLessEqual(metrics['accuracy'], 1)
    
    def test_compare_models(self):
        """Test porównywania modeli"""
        models = {
            'Logistic': self.trainer.train_model(
                self.X_train, self.y_train, model_type='logistic'
            ),
            'Random Forest': self.trainer.train_model(
                self.X_train, self.y_train, model_type='random_forest', n_estimators=10
            )
        }
        
        comparison = self.trainer.compare_models(models, self.X_test, self.y_test)
        
        self.assertIsInstance(comparison, pd.DataFrame)
        self.assertEqual(len(comparison), 2)
        self.assertIn('accuracy', comparison.columns)


if __name__ == '__main__':
    unittest.main()
