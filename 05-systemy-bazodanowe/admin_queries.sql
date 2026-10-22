-- ============================================
-- SCENARIUSZ ADMINISTRACYJNY - DATAFLOW WMS
-- ============================================

-- A. NOWA TABELA: System zwrotów
CREATE TABLE IF NOT EXISTS product_returns (
    return_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    reason TEXT,
    return_date DATE DEFAULT CURRENT_DATE
);

-- B. NOWY UŻYTKOWNIK I UPRAWNIENIA
DROP ROLE IF EXISTS analityk_magazynu;
CREATE ROLE analityk_magazynu WITH LOGIN PASSWORD '123';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analityk_magazynu;

-- C. OPERACJE CRUD NA ZESTAWACH DANYCH

-- 1. UTWÓRZ (CREATE): Rejestracja nowego zwrotu
INSERT INTO product_returns (order_id, reason)
VALUES (1, 'Uszkodzone opakowanie podczas transportu');

-- 2. ZAKTUALIZUJ (UPDATE): Przesunięcie międzystrefowe (Stock Transfer)
-- Użycie transakcji zapewnia spójność danych
BEGIN;
UPDATE stock SET quantity = quantity - 10 WHERE location_id = 2 AND product_id = 1 AND lot_id = 2;
UPDATE stock SET quantity = quantity + 10 WHERE location_id = 1 AND product_id = 1 AND lot_id = 2;
COMMIT;

-- 3. USUŃ (DELETE): Wycofanie wadliwej partii
DELETE FROM stock WHERE lot_id = 4;
