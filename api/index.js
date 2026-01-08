const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

app.use(cors());
app.use(express.json());

const APP_KEY = 'a17c5048-ce8a-4f6f-b6e2-90ef06a38439';
const BASE_URL = 'https://rendicolla.sankhyacloud.com.br/mge/service.sbr';

// Endpoint de Login Dinâmico
app.post('/api/login', async (req, res) => {
    try {
        const { user, password } = req.body;

        const response = await fetch(`${BASE_URL}?serviceName=MobileLoginSP.login&outputType=json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'appkey': APP_KEY },
            body: JSON.stringify({
                "serviceName": "MobileLoginSP.login",
                "requestBody": {
                    "NOMUSU": { "$": user },
                    "INTERNO": { "$": password },
                    "KEEPCONNECTED": { "$": "S" }
                }
            })
        });

        const data = await response.json();
        
        if (data.status !== "1") {
            return res.status(401).json({ 
                success: false, 
                error: data.statusMessage || "Usuário ou senha inválidos" 
            });
        }

        const cookies = response.headers.raw()['set-cookie'];
        res.json({ success: true, data: data, cookies: cookies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de Consulta
app.post('/api/query', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        const sql = `SELECT NUNOTA, DTNEG, VLRNOTA, CODPARC FROM TGFCAB WHERE NUNOTA = ${parseInt(nuNota)}`;

        const response = await fetch(`${BASE_URL}?serviceName=DbExplorerSP.executeQuery&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                "serviceName": "DbExplorerSP.executeQuery",
                "requestBody": { "sql": sql }
            })
        });

        const data = await response.json();
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;