"""
Testy jednostkowe dla klasy DataPreprocessor
"""
import unittest
import pandas as pd
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_classes import DataPreprocessor


class TestDataPreprocessor(unittest.TestCase):
    """Testy dla klasy DataPreprocessor"""
    
    def setUp(self):
        """Przygotowanie testów"""
        self.preprocessor = DataPreprocessor()
        
        # Tworzenie przykładowych danych testowych
        self.test_df = pd.DataFrame({
            'numeric1': [1, 2, 3, np.nan, 5],
            'numeric2': [10, 20, 30, 40, 50],
            'categorical': ['A', 'B', 'A', 'C', 'B'],
            'boolean': [True, False, True, True, False],
            'target': [0, 1, 0, 1, 0]
        })
    
    def test_handle_missing_values_drop(self):
        """Test obsługi brakujących wartości - drop"""
        result = self.preprocessor.handle_missing_values(self.test_df, strategy='drop')
        self.assertFalse(result.isnull().any().any())
        self.assertLess(result.shape[0], self.test_df.shape[0])
    
    def test_handle_missing_values_mean(self):
        """Test obsługi brakujących wartości - mean"""
        result = self.preprocessor.handle_missing_values(self.test_df, strategy='mean')
        self.assertFalse(result.select_dtypes(include=[np.number]).isnull().any().any())
    
    def test_encode_categorical_label(self):
        """Test kodowania kategorycznych - label encoding"""
        result = self.preprocessor.encode_categorical(self.test_df, method='label')
        categorical_cols = ['categorical', 'boolean']
        for col in categorical_cols:
            if col in result.columns:
                self.assertTrue(result[col].dtype in [np.int64, np.int32, int])
    
    def test_encode_categorical_onehot(self):
        """Test kodowania kategorycznych - one-hot encoding"""
        result = self.preprocessor.encode_categorical(self.test_df, method='onehot')
        # Sprawdź czy kolumny kategoryczne zostały zakodowane
        self.assertGreater(result.shape[1], self.test_df.shape[1])
    
    def test_normalize_features(self):
        """Test normalizacji cech"""
        numeric_df = self.test_df[['numeric1', 'numeric2']].fillna(0)
        result = self.preprocessor.normalize_features(numeric_df, fit=True)
        
        # Sprawdź czy dane są znormalizowane (średnia ~0, std ~1)
        # Używamy ddof=0 dla zgodności z StandardScaler (populacja zamiast próbki)
        for col in result.columns:
            self.assertAlmostEqual(result[col].mean(), 0, places=1)
            self.assertAlmostEqual(result[col].std(ddof=0), 1, places=1)
    
    def test_preprocess_pipeline(self):
        """Test pełnego pipeline preprocessingu"""
        X, y = self.preprocessor.preprocess_pipeline(
            self.test_df,
            target_col='target',
            normalize=True,
            fit=True
        )
        
        self.assertIsNotNone(X)
        self.assertIsNotNone(y)
        self.assertEqual(X.shape[0], y.shape[0])
        self.assertNotIn('target', X.columns)


if __name__ == '__main__':
    unittest.main()
