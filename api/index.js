const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const APP_KEY = 'a17c5048-ce8a-4f6f-b6e2-90ef06a38439';
const BASE_URL = 'https://rendicolla.sankhyacloud.com.br/mge/service.sbr';

// ROTA 1: LOGIN DINÂMICO
app.post('/api/login', async (req, res) => {
    try {
        const { user, password } = req.body;
        const response = await fetch(`${BASE_URL}?serviceName=MobileLoginSP.login&outputType=json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'appkey': APP_KEY },
            body: JSON.stringify({
                "serviceName": "MobileLoginSP.login",
                "requestBody": { "NOMUSU": { "$": user }, "INTERNO": { "$": password }, "KEEPCONNECTED": { "$": "S" } }
            })
        });
        const data = await response.json();
        if (data.status !== "1") return res.status(401).json({ success: false, error: data.statusMessage || "Usuário ou senha inválidos" });
        const cookies = response.headers.raw()['set-cookie'];
        res.json({ success: true, data: data, cookies: cookies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ROTA 2: CONSULTA DE CAMPOS
app.post('/api/query', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        const sql = `SELECT NUNOTA, DTNEG, VLRNOTA, CODPARC, AD_OBSINT, AD_OBSINTERNA, AD_OBSPCP, AD_OBSFINANCEIRO, AD_OBSFATURAMENTO FROM TGFCAB WHERE NUNOTA = ${parseInt(nuNota)}`;

        const response = await fetch(`${BASE_URL}?serviceName=DbExplorerSP.executeQuery&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ "serviceName": "DbExplorerSP.executeQuery", "requestBody": { "sql": sql } })
        });
        const data = await response.json();
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ROTA 3: UPDATE DE CAMPOS
app.post('/api/update', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota, campos } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        // Criar o SET do SQL garantindo que as aspas simples sejam tratadas
        const sets = Object.keys(campos).map(key => `${key} = '${campos[key].replace(/'/g, "''")}'`).join(', ');
        const sql = `UPDATE TGFCAB SET ${sets} WHERE NUNOTA = ${parseInt(nuNota)}`;

        const response = await fetch(`${BASE_URL}?serviceName=DbExplorerSP.executeQuery&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ "serviceName": "DbExplorerSP.executeQuery", "requestBody": { "sql": sql } })
        });
        const data = await response.json();
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;