CREATE DATABASE Finanzas;

USE Finanzas;

CREATE TABLE Usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('comun', 'admin') NOT NULL DEFAULT 'comun',
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

CREATE TABLE IF NOT EXISTS Categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  color VARCHAR(10) NOT NULL,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_categoria_usuario (usuario_id, nombre),
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

INSERT INTO Categorias (nombre, color, usuario_id)
SELECT 'Comida', '#ef4444', u.id
FROM Usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM Categorias c WHERE c.usuario_id = u.id AND c.nombre = 'Comida'
);

INSERT INTO Categorias (nombre, color, usuario_id)
SELECT 'Transporte', '#f97316', u.id
FROM Usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM Categorias c WHERE c.usuario_id = u.id AND c.nombre = 'Transporte'
);

INSERT INTO Categorias (nombre, color, usuario_id)
SELECT 'Hogar', '#8b5cf6', u.id
FROM Usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM Categorias c WHERE c.usuario_id = u.id AND c.nombre = 'Hogar'
);

INSERT INTO Categorias (nombre, color, usuario_id)
SELECT 'Salud', '#22c55e', u.id
FROM Usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM Categorias c WHERE c.usuario_id = u.id AND c.nombre = 'Salud'
);

INSERT INTO Categorias (nombre, color, usuario_id)
SELECT 'Educacion', '#06b6d4', u.id
FROM Usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM Categorias c WHERE c.usuario_id = u.id AND c.nombre = 'Educacion'
);

INSERT INTO Categorias (nombre, color, usuario_id)
SELECT 'Ocio', '#ec4899', u.id
FROM Usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM Categorias c WHERE c.usuario_id = u.id AND c.nombre = 'Ocio'
);

UPDATE Usuarios SET rol = 'admin' WHERE id = 1;
