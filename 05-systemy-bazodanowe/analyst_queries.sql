-- ============================================
-- ZAPYTANIA ANALITYCZNE - DATAFLOW WMS
-- ============================================

-- 1. ANALIZA SPRAWNOSCI KURIEROW (SLA)
-- Cel: Kontrola, czy deklarowane czasy dostaw są dotrzymywane
-- KPI: Średni czas dostawy vs limit SLA
SELECT 
    c.name AS Kurier,
    COUNT(s.shipment_id) AS Liczba_Przesylek,
    ROUND(AVG(EXTRACT(EPOCH FROM (s.delivery_date - o.order_date)) / 86400), 1) AS Sredni_Czas_Dostawy,
    c.max_days AS Limit_SLA,
    CASE 
        WHEN AVG(EXTRACT(EPOCH FROM (s.delivery_date - o.order_date)) / 86400) > c.max_days THEN 'ALARM: Opóźnienia'
        ELSE 'SLA Zachowane'
    END AS Status_SLA
FROM courier c
JOIN shipment s ON c.courier_id = s.courier_id
JOIN orders o ON s.order_id = o.order_id
GROUP BY c.name, c.max_days;
-- Wniosek: DHL przekracza limit SLA → rozważyć renegocjację umowy

-- 2. ANALIZA STANOW MAGAZYNOWYCH
-- Cel: Kontrola rozmieszczenia produktów w magazynie
-- KPI: Ilość produktu per lokalizacja i strefa
SELECT 
    p.name AS Produkt,
    l.zone AS Strefa,
    loc.location_type AS Typ_Lokalizacji,
    s.quantity AS Ilosc,
    l.batch_number AS Numer_Partii,
    l.expiration_date AS Data_Waznosci
FROM stock s
JOIN product p ON s.product_id = p.product_id
JOIN location loc ON s.location_id = loc.location_id
JOIN lot l ON s.lot_id = l.lot_id
ORDER BY p.name, loc.zone;
-- Wniosek: Monitorować rozmieszczenie między PICKING a STORAGE

-- 3. ANALIZA ROTACJI PRODUKTOW
-- Cel: Identyfikacja najpopularniejszych produktów
-- KPI: Liczba zamówień i łączna ilość per produkt
SELECT 
    p.name AS Produkt,
    p.sku AS SKU,
    COUNT(oi.order_item_id) AS Liczba_Zamowien,
    SUM(oi.quantity) AS Laczna_Ilosc_Zamowiona,
    ROUND(AVG(oi.price_per_unit), 2) AS Srednia_Cena
FROM product p
JOIN order_item oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name, p.sku
ORDER BY Liczba_Zamowien DESC;
-- Wniosek: T-Shirt Biały najczęściej zamawiany → monitorować zapasy
