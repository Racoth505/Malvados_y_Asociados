CREATE DATABASE Finanzas;

USE Finanzas;

CREATE TABLE Usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Gastos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cantidad DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  concepto VARCHAR(25) NOT NULL,
  categoria VARCHAR(30) NOT NULL,
  color_categoria VARCHAR(10) NOT NULL,
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

CREATE TABLE Ingresos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cantidad DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  concepto VARCHAR(25) NOT NULL,
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);
