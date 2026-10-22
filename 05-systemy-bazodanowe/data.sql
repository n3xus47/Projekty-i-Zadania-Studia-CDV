-- Klienci
INSERT INTO customer (full_name, email) VALUES
('Jan Kowalski', 'jan@pro.pl'),
('Anna Nowak', 'anna.n@test.pl'),
('Marek Zieliński', 'marek.z@firma.com'),
('Ewa Wysocka', 'ewa.w@poczta.pl'),
('Piotr Wiśniewski', 'piotr.w@domena.pl');

-- Produkty
INSERT INTO product (sku, name) VALUES
('TSHIRT-W', 'T-Shirt Biały'),
('TSHIRT-B', 'T-Shirt Czarny'),
('HOODIE-G', 'Bluza Szara'),
('SOCKS-W', 'Skarpetki Białe');

-- Partie
INSERT INTO lot (product_id, batch_number, expiration_date) VALUES
(1, 'B-2026-001', '2027-12-31'),
(1, 'B-2026-002', '2028-01-01'),
(2, 'B-2026-005', '2028-06-01'),
(3, 'B-2026-009', '2029-01-01');

-- Magazyn
INSERT INTO location (zone, location_type) VALUES
('A', 'PICKING'), ('B', 'STORAGE'), ('C', 'PICKING'), ('D', 'STORAGE');

-- Stany
INSERT INTO stock (product_id, location_id, lot_id, quantity) VALUES
(1, 1, 1, 50),
(1, 2, 2, 150),
(2, 3, 3, 80),
(3, 4, 4, 40);

-- Kurierzy
INSERT INTO courier (name, max_days) VALUES ('DHL', 2), ('InPost', 1), ('UPS', 3);

-- Zamówienia i pozycje
INSERT INTO orders (customer_id, status, order_date) VALUES
(1, 'DELIVERED', '2026-01-20 10:00:00'),
(2, 'SHIPPED', '2026-01-25 12:00:00'),
(3, 'DELIVERED', '2026-01-26 14:30:00'),
(4, 'PENDING', CURRENT_TIMESTAMP);

INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) VALUES
(1, 1, 2, 45.00),
(2, 1, 2, 49.99),
(2, 3, 1, 120.00),
(3, 2, 5, 35.00),
(4, 4, 10, 15.00);

-- Wysyłki
INSERT INTO shipment (order_id, courier_id, delivery_date) VALUES
(1, 1, '2026-01-23 09:00:00'),
(2, 2, '2026-01-26 16:00:00'),
(3, 1, '2026-01-27 10:00:00');