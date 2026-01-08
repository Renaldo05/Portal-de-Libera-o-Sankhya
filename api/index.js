const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const APP_KEY = 'a17c5048-ce8a-4f6f-b6e2-90ef06a38439';
const BASE_URL = 'https://rendicolla.sankhyacloud.com.br/mge/service.sbr';

// LOGIN
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
        if (data.status !== "1") return res.status(401).json({ success: false, error: data.statusMessage || "Erro no login" });
        const cookies = response.headers.raw()['set-cookie'];
        res.json({ success: true, data, cookies });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// CONSULTA (SELECT)
app.post('/api/query', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        const sql = `SELECT NUNOTA, CODPARC, AD_OBSINT, AD_OBSINTERNA, AD_OBSPCP, AD_OBSFINANCEIRO, AD_OBSFATURAMENTO FROM TGFCAB WHERE NUNOTA = ${parseInt(nuNota)}`;

        const response = await fetch(`${BASE_URL}?serviceName=DbExplorerSP.executeQuery&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ "serviceName": "DbExplorerSP.executeQuery", "requestBody": { "sql": sql } })
        });
        const data = await response.json();
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// UPDATE (CRUD - IGUAL AO SEU JSP)
app.post('/api/update', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota, campos } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        const requestBody = {
            serviceName: "CRUDServiceProvider.saveRecord",
            requestBody: {
                dataSet: {
                    rootEntity: "CabecalhoNota",
                    dataRow: {
                        localFields: {
                            "AD_OBSINT": { "$": campos.AD_OBSINT },
                            "AD_OBSINTERNA": { "$": campos.AD_OBSINTERNA },
                            "AD_OBSPCP": { "$": campos.AD_OBSPCP },
                            "AD_OBSFINANCEIRO": { "$": campos.AD_OBSFINANCEIRO },
                            "AD_OBSFATURAMENTO": { "$": campos.AD_OBSFATURAMENTO }
                        },
                        key: { "NUNOTA": { "$": nuNota } }
                    },
                    entity: { fieldset: { list: "NUNOTA,AD_OBSINT,AD_OBSINTERNA,AD_OBSPCP,AD_OBSFINANCEIRO,AD_OBSFATURAMENTO" } }
                }
            }
        };

        const response = await fetch(`${BASE_URL}?serviceName=CRUDServiceProvider.saveRecord&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.status === "1") res.json({ success: true, data });
        else res.status(400).json({ success: false, error: data.statusMessage });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = app;