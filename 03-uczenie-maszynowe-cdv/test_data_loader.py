"""
Testy jednostkowe dla klasy DataLoader
"""
import unittest
import pandas as pd
import os
import sys

# Dodaj ścieżkę do projektu
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_classes import DataLoader


class TestDataLoader(unittest.TestCase):
    """Testy dla klasy DataLoader"""
    
    def setUp(self):
        """Przygotowanie testów"""
        self.loader = DataLoader()
        self.test_file = 'online_shoppers_intention.csv'
    
    def test_load_data_success(self):
        """Test pomyślnego wczytania danych"""
        data = self.loader.load_data(self.test_file)
        self.assertIsNotNone(data)
        self.assertIsInstance(data, pd.DataFrame)
        self.assertGreater(data.shape[0], 0)
        self.assertGreater(data.shape[1], 0)
    
    def test_load_data_file_not_found(self):
        """Test wczytania nieistniejącego pliku"""
        data = self.loader.load_data('nonexistent_file.csv')
        self.assertIsNone(data)
    
    def test_get_info(self):
        """Test pobierania informacji o danych"""
        self.loader.load_data(self.test_file)
        info = self.loader.get_info()
        
        self.assertIsInstance(info, dict)
        self.assertIn('shape', info)
        self.assertIn('columns', info)
        self.assertIn('dtypes', info)
        self.assertIn('missing_values', info)
        self.assertIsInstance(info['shape'], tuple)
        self.assertIsInstance(info['columns'], list)
    
    def test_get_info_no_data(self):
        """Test pobierania informacji gdy dane nie zostały wczytane"""
        loader = DataLoader()
        info = loader.get_info()
        self.assertIn('error', info)


if __name__ == '__main__':
    unittest.main()
