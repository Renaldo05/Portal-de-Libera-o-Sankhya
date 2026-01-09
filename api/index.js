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
        if (data.status !== "1") return res.status(401).json({ success: false, error: data.statusMessage });

        const cookies = response.headers.raw()['set-cookie'];
        
        // Tenta capturar o CODUSU numérico em diferentes campos retornados
        const codUsu = data.responseBody?.idUsu?.$ || data.responseBody?.userId?.$ || data.responseBody?.idusu?.$ || null;

        res.json({ success: true, data, cookies, codUsuLogado: codUsu });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// FILA DE LIBERAÇÃO
app.post('/api/liberacoes', async (req, res) => {
    try {
        const { jsessionid, cookies, codUsuLogado } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        // SQL em linha única para evitar ORA-00933
        const sql = `SELECT LIB.NUCHAVE, TOP.DESCROPER, PAR.RAZAOSOCIAL, CAB.VLRNOTA, LIB.TABELA, LIB.VLRATUAL, LIB.DHSOLICIT, LIB.OBSERVACAO, LIB.EVENTO, USUSOL.NOMEUSU FROM TSILIB LIB JOIN TSIUSU USUSOL ON USUSOL.CODUSU = LIB.CODUSUSOLICIT JOIN TGFCAB CAB ON CAB.NUNOTA = LIB.NUCHAVE JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC JOIN TGFTOP TOP ON TOP.CODTIPOPER = CAB.CODTIPOPER AND TOP.DHALTER = CAB.DHTIPOPER WHERE LIB.CODUSULIB = ${codUsuLogado} AND LIB.VLRLIBERADO <> LIB.VLRATUAL ORDER BY LIB.DHSOLICIT DESC`;

        const response = await fetch(`${BASE_URL}?serviceName=DbExplorerSP.executeQuery&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ "serviceName": "DbExplorerSP.executeQuery", "requestBody": { "sql": sql } })
        });
        const data = await response.json();
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// SIMULAR LIBERAÇÃO (CRUD)
app.post('/api/teste-liberar', async (req, res) => {
    try {
        const { jsessionid, cookies, nuNota, obsTeste } = req.body;
        const headers = { 'Content-Type': 'application/json', 'appkey': APP_KEY };
        if (cookies) headers['Cookie'] = cookies.join('; ');

        const requestBody = {
            serviceName: "CRUDServiceProvider.saveRecord",
            requestBody: {
                dataSet: {
                    rootEntity: "CabecalhoNota",
                    dataRow: {
                        localFields: { "AD_TESTEAPLICATIVOLIBERACAO": { "$": obsTeste } },
                        key: { "NUNOTA": { "$": nuNota } }
                    },
                    entity: { fieldset: { list: "NUNOTA,AD_TESTEAPLICATIVOLIBERACAO" } }
                }
            }
        };

        const response = await fetch(`${BASE_URL}?serviceName=CRUDServiceProvider.saveRecord&outputType=json&mgeSession=${jsessionid}`, {
            method: 'POST', headers: headers, body: JSON.stringify(requestBody)
        });
        const data = await response.json();
        res.json({ success: data.status === "1", data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = app;