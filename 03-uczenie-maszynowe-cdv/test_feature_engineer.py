"""
Testy jednostkowe dla klasy FeatureEngineer
"""
import unittest
import pandas as pd
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_classes import FeatureEngineer


class TestFeatureEngineer(unittest.TestCase):
    """Testy dla klasy FeatureEngineer"""
    
    def setUp(self):
        """Przygotowanie testów"""
        self.feature_engineer = FeatureEngineer()
        
        # Tworzenie przykładowych danych testowych
        self.test_df = pd.DataFrame({
            'Administrative': [1, 2, 3, 4, 5],
            'Informational': [2, 3, 1, 2, 3],
            'ProductRelated': [10, 15, 20, 25, 30],
            'Administrative_Duration': [10, 20, 30, 40, 50],
            'Informational_Duration': [5, 10, 15, 20, 25],
            'ProductRelated_Duration': [100, 150, 200, 250, 300],
            'BounceRates': [0.1, 0.2, 0.3, 0.4, 0.5],
            'ExitRates': [0.2, 0.3, 0.4, 0.5, 0.6],
            'PageValues': [10, 20, 30, 40, 50]
        })
        
        self.test_y = pd.Series([0, 1, 0, 1, 1])
    
    def test_create_interaction_features(self):
        """Test tworzenia cech interakcyjnych"""
        result = self.feature_engineer.create_interaction_features(self.test_df)
        
        # Sprawdź czy nowe cechy zostały utworzone
        self.assertIn('TotalPages', result.columns)
        self.assertIn('TotalDuration', result.columns)
        self.assertIn('AvgPageDuration', result.columns)
        self.assertIn('BounceExitRatio', result.columns)
        
        # Sprawdź poprawność obliczeń
        self.assertEqual(result['TotalPages'].iloc[0], 13)  # 1 + 2 + 10
        self.assertGreater(result['TotalDuration'].iloc[0], 0)
    
    def test_select_features_correlation(self):
        """Test selekcji cech - metoda korelacji"""
        X_selected, selected_features = self.feature_engineer.select_features(
            self.test_df,
            self.test_y,
            method='correlation',
            threshold=0.01
        )
        
        self.assertIsNotNone(X_selected)
        self.assertIsInstance(selected_features, list)
        self.assertLessEqual(X_selected.shape[1], self.test_df.shape[1])
    
    def test_select_features_importance(self):
        """Test selekcji cech - metoda ważności"""
        X_selected, selected_features = self.feature_engineer.select_features(
            self.test_df,
            self.test_y,
            method='importance',
            threshold=0.01
        )
        
        self.assertIsNotNone(X_selected)
        self.assertIsInstance(selected_features, list)
        self.assertIsNotNone(self.feature_engineer.feature_importance)


if __name__ == '__main__':
    unittest.main()
