-- Tạo database (nếu chưa có)
CREATE DATABASE iot_system;
USE iot_system;

-- Bảng lưu dữ liệu cảm biến
CREATE TABLE sensor_data (
    id INT IDENTITY(1,1) PRIMARY KEY,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    light INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM sensor_data;
DELETE FROM sensor_data;
SELECT TOP 100 * FROM sensor_data ORDER BY ID desc
-- Bảng lưu lịch sử bật/tắt thiết bị
CREATE TABLE device_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    led1 BIT,  -- 1 = ON, 0 = OFF
    led2 BIT,
    led3 BIT,
    source VARCHAR(50) DEFAULT 'ESP',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM device_log;
SELECT * FROM device_log;
SELECT TOP 100 * FROM device_log ORDER BY id DESC
