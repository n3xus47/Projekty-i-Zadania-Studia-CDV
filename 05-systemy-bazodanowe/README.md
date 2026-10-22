# DATAFLOW WMS
## System Zarządzania Magazynem Oparty na Danych

**DataFlow WMS** to projekt systemu bazodanowego klasy WMS dla e‑commerce, zaprojektowany jako wiarygodne źródło danych operacyjnych.

## Struktura Projektu

```
DATAFLOW WMS/
├── schema.sql              # Schemat bazy danych
├── data.sql                # Dane testowe
├── analyst_queries.sql     # Zapytania analityczne
├── admin_queries.sql       # Scenariusz administracyjny
├── DOKUMENTACJA.md         # Dokumentacja projektu
├── diagram_ER.md           # Diagram ER
└── README.md               # Ten plik
```

## Szybki Start

```sql
-- 1. Utwórz bazę danych
CREATE DATABASE dataflow_wms;
\c dataflow_wms

-- 2. Uruchom schemat i dane
\i schema.sql
\i data.sql

-- 3. (Opcjonalnie) Uruchom zapytania
\i analyst_queries.sql
\i admin_queries.sql
```

## Wymagania

- PostgreSQL 12+
- psql, pgAdmin, DataGrip lub inne narzędzie SQL

## Użytkownicy

- **analityk_magazynu**: SELECT (tylko odczyt)
- **Administrator**: Pełne uprawnienia