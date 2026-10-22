DROP TABLE IF EXISTS shipment, order_item, orders, courier, stock, location, lot, product, customer CASCADE;
DROP TYPE IF EXISTS location_enum;

-- Definicja typu wyliczeniowego dla typu lokalizacji
CREATE TYPE location_enum AS ENUM ('PICKING', 'STORAGE');

-- 1. Klienci
CREATE TABLE customer (
                          customer_id SERIAL PRIMARY KEY,
                          full_name VARCHAR(100) NOT NULL,
                          email VARCHAR(100) UNIQUE
);

-- 2. Katalog produktów
CREATE TABLE product (
                         product_id SERIAL PRIMARY KEY,
                         sku VARCHAR(50) UNIQUE,
                         name VARCHAR(100)
);

-- 3. Zarządzanie partiami (LOT)
CREATE TABLE lot (
                     lot_id SERIAL PRIMARY KEY,
                     product_id INT,
                     batch_number VARCHAR(50),
                     expiration_date DATE,
                     FOREIGN KEY (product_id) REFERENCES product(product_id)
);

-- 4. Struktura fizyczna magazynu
CREATE TABLE location (
                          location_id SERIAL PRIMARY KEY,
                          zone CHAR(1),
                          location_type location_enum
);

-- 5. Stany magazynowe (Tabela faktów)
CREATE TABLE stock (
                       product_id INT,
                       location_id INT,
                       lot_id INT,
                       quantity INT,
                       PRIMARY KEY (product_id, location_id, lot_id),
                       FOREIGN KEY (product_id) REFERENCES product(product_id),
                       FOREIGN KEY (location_id) REFERENCES location(location_id),
                       FOREIGN KEY (lot_id) REFERENCES lot(lot_id)
);

-- 6. Logistyka i Kurierzy
CREATE TABLE courier (
                         courier_id SERIAL PRIMARY KEY,
                         name VARCHAR(50),
                         max_days INT
);

-- 7. Nagłówki zamówień
CREATE TABLE orders (
                        order_id SERIAL PRIMARY KEY,
                        customer_id INT,
                        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status VARCHAR(20),
                        FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

-- 8. Pozycje zamówienia
CREATE TABLE order_item (
                            order_item_id SERIAL PRIMARY KEY,
                            order_id INT,
                            product_id INT,
                            quantity INT NOT NULL,
                            price_per_unit DECIMAL(10,2),
                            FOREIGN KEY (order_id) REFERENCES orders(order_id),
                            FOREIGN KEY (product_id) REFERENCES product(product_id)
);

-- 9. Wysyłki
CREATE TABLE shipment (
                          shipment_id SERIAL PRIMARY KEY,
                          order_id INT UNIQUE,
                          courier_id INT,
                          delivery_date TIMESTAMP,
                          FOREIGN KEY (order_id) REFERENCES orders(order_id),
                          FOREIGN KEY (courier_id) REFERENCES courier(courier_id)
);