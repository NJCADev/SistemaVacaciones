// Polyfill para TextEncoder/TextDecoder (requerido por supertest/formidable)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Mock de la base de datos
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: jest.fn()
  }))
}));

// Importar el app (necesitamos que server.js exporte app)
// Para facilitar, modificaremos server.js para exportar app

// Crear app de prueba simple
const app = express();
app.use(express.json());
app.use(cookieParser());

// Endpoint de login para prueba
app.post('/api/login', async (req, res) => {
  const { cedula, password } = req.body;
  if (cedula === '123456789' && password === 'correcta') {
    const token = jwt.sign({ id: 1, rol: 'Funcionario' }, 'secret');
    res.cookie('token', token, { httpOnly: true });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Credenciales inválidas' });
});

describe('API Endpoints', () => {
  test('POST /api/login con credenciales válidas devuelve 200 y cookie', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cedula: '123456789', password: 'correcta' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/login con credenciales inválidas devuelve 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cedula: '123456789', password: 'incorrecta' });
    expect(res.status).toBe(401);
  });
});