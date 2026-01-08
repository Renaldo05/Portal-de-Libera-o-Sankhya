const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const APP_KEY = 'a17c5048-ce8a-4f6f-b6e2-90ef06a38439';
const BASE_URL = 'https://rendicolla.sankhyacloud.com.br/mge/service.sbr';

// Endpoint de Login (Mantido igual)
app.post('/api/login', async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}?serviceName=MobileLoginSP.login&outputType=json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'appkey': APP_KEY },
            body: JSON.stringify({
                "serviceName": "MobileLoginSP.login",
                "requestBody": {
                    "NOMUSU": { "$": "12733672940" },
                    "INTERNO": { "$": "Renan*05102118" },
                    "KEEPCONNECTED": { "$": "S" }
                }
            })
        });
        const data = await response.json();
        const cookies = response.headers.raw()['set-cookie'];
        res.json({ success: true, data: data, cookies: cookies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de Consulta (Atualizado para Filtro Único)
app.post('/api/query', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota } = req.body;

        const headers = {
            'Content-Type': 'application/json',
            'appkey': APP_KEY
        };

        if (cookies && cookies.length > 0) {
            headers['Cookie'] = cookies.join('; ');
        }

        // SQL focado apenas no número único informado
        const sql = `SELECT NUNOTA, DTNEG, VLRNOTA, CODPARC FROM TGFCAB WHERE NUNOTA = ${nuNota}`;

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