const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ADMIN_PASSWORD = 'admin_secret_pass_123';

const PACKAGES_FILE = path.join(__dirname, 'packages.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

const defaultPackages = [
    { name: "الباقة الأولى", profit: "5", min: "200", days: "30" },
    { name: "الباقة الثانية", profit: "7", min: "500", days: "30" },
    { name: "الباقة الثالثة", profit: "10", min: "800", days: "30" },
    { name: "الباقة الرابعة", profit: "15", min: "1500", days: "30" }
];

fs.writeFileSync(PACKAGES_FILE, JSON.stringify(defaultPackages, null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ bgUrl: '' }));

let verificationCodes = {};

const server = http.createServer((req, res) => {
    let url = req.url;

    if (url === '/api/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const { password } = JSON.parse(body);
            if (password === ADMIN_PASSWORD) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
            }
        });
        return;
    }

    if (url === '/api/get-packages' && req.method === 'GET') {
        const data = fs.readFileSync(PACKAGES_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
        return;
    }

    if (url.startsWith('/api/send-code') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const { email } = JSON.parse(body);
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            verificationCodes[email] = code;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, bypassCode: code }));
        });
        return;
    }

    if (url.startsWith('/api/register-user') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const { username, password, email } = JSON.parse(body);
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            users.push({ username, password, email });
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    if (url.startsWith('/api/login-user') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const { username, password } = JSON.parse(body);
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            const userExists = users.find(u => u.username === username && u.password === password);
            if (userExists) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
            }
        });
        return;
    }

    if (url === '/') url = '/login.html';
    if (url === '/secure-admin') url = '/admin.html';

    let filePath = path.join(__dirname, url);

    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>الملف غير موجود</h1>');
            return;
        }

        // تعديل صفحة الدخول والتسجيل فقط لتدعم الحفظ والدخول المباشر
        if (url === '/login.html') {
            const loginFix = `
            <script>
                if (localStorage.getItem('isLoggedIn') === 'true') {
                    window.location.href = '/trading.html';
                }

                document.addEventListener("DOMContentLoaded", function() {
                    const form = document.querySelector('form');
                    if (form) {
                        form.innerHTML = \`
                            <h2 style="color: #f0a500; text-align:center;">تسجيل الدخول للمنصة</h2>
                            <input type="text" id="log-user" placeholder="اسم المستخدم" style="width:100%; padding:12px; margin-bottom:15px; background:#262e36; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;">
                            <input type="password" id="log-pass" placeholder="كلمة المرور" style="width:100%; padding:12px; margin-bottom:15px; background:#262e36; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;">
                            <button type="button" onclick="loginDirect()" style="width:100%; padding:12px; background:#f0a500; border:none; font-weight:bold; border-radius:6px; cursor:pointer;">دخول</button>
                            <hr style="border-color:#333; margin:20px 0;">
                            <h3 style="color:#fff; text-align:center; font-size:14px;">إنشاء حساب جديد</h3>
                            <input type="text" id="reg-user" placeholder="اسم المستخدم الجديد" style="width:100%; padding:10px; margin-bottom:10px; background:#262e36; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;">
                            <input type="email" id="reg-mail" placeholder="البريد الإلكتروني" style="width:100%; padding:10px; margin-bottom:10px; background:#262e36; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;">
                            <input type="password" id="reg-pass" placeholder="كلمة المرور" style="width:100%; padding:10px; margin-bottom:10px; background:#262e36; border:1px solid #444; color:#fff; border-radius:6px; box-sizing:border-box;">
                            <button type="button" onclick="registerNew()" style="width:100%; padding:10px; background:#238636; color:#fff; border:none; border-radius:6px; cursor:pointer;">تسجيل حساب وتفعيل</button>
                        \`;
                    }
                });

                function loginDirect() {
                    const username = document.getElementById('log-user').value;
                    const password = document.getElementById('log-pass').value;
                    fetch('/api/login-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    }).then(res => {
                        if(res.ok) {
                            localStorage.setItem('isLoggedIn', 'true');
                            window.location.href = '/trading.html';
                        } else {
                            alert('اسم المستخدم أو كلمة المرور خاطئة!');
                        }
                    });
                }

                function registerNew() {
                    const username = document.getElementById('reg-user').value;
                    const email = document.getElementById('reg-mail').value;
                    const password = document.getElementById('reg-pass').value;
                    if(!username || !email || !password) return alert('أكمل البيانات أولاً');

                    fetch('/api/send-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    }).then(res => res.json()).then(data => {
                        const code = prompt("أدخل كود التحقق المباشر الصادر لحسابك: " + data.bypassCode);
                        if (code === data.bypassCode) {
                            fetch('/api/register-user', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username, password, email })
                            }).then(() => {
                                localStorage.setItem('isLoggedIn', 'true');
                                window.location.href = '/trading.html';
                            });
                        }
                    });
                }
            </script>
            `;
            content = content.replace('</body>', `${loginFix}</body>`);
        }

        // حقن الباقات الأربعة ونافذة الاستثمار داخل صفحة التداول فقط لمنع التداخل
        if (url === '/trading.html') {
            let modified = content
                .replace(/999\.85/g, '0.00')
                .replace(/1000\.00/g, '0.00')
                .replace(/1000/g, '0.00')
                .replace(/999/g, '0.00');

            const customTrading = `
            <style>
                .dynamic-packages-container { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px; justify-content: center; width: 100%; direction: rtl; }
                .p-card { background: #1f242c; border: 1px solid #30363d; border-radius: 8px; padding: 15px; width: 100%; max-width: 340px; box-sizing: border-box; text-align: right; margin-bottom: 10px; }
                .p-card h3 { color: #f0a500; margin: 0 0 10px 0; font-size: 18px; }
                .p-card p { margin: 5px 0; color: #c9d1d9; font-size: 14px; }
                .p-card button { width: 100%; background: #f0a500; border: none; padding: 10px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-top: 10px; color: #000; font-size: 15px; }
                
                .invest-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; justify-content: center; align-items: center; direction: rtl; }
                .invest-modal-content { background: #1f242c; padding: 25px; border-radius: 12px; width: 85%; max-width: 400px; text-align: center; border: 1px solid #30363d; color: #fff; }
                .invest-modal input { width: 100%; padding: 12px; margin: 15px 0; background: #262e36; border: 1px solid #444; color: #fff; border-radius: 6px; box-sizing: border-box; text-align: center; font-size: 16px; }
                .invest-btn-confirm { background: #238636; color: white; border: none; padding: 12px 25px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-left: 10px; }
                .invest-btn-cancel { background: #da3637; color: white; border: none; padding: 12px 25px; font-weight: bold; border-radius: 6px; cursor: pointer; }
            </style>

            <div id="investModal" class="invest-modal">
                <div class="invest-modal-content">
                    <h3 id="modalPackageName" style="color: #f0a500; margin-top:0;"></h3>
                    <p id="modalPackageMin" style="color: #c9d1d9;"></p>
                    <label style="display:block; margin-top:10px;">أدخل مبلغ الاستثمار المحدد للباقة:</label>
                    <input type="number" id="investAmountInput">
                    <div>
                        <button class="invest-btn-confirm" onclick="confirmInvestment()">استثمار</button>
                        <button class="invest-btn-cancel" onclick="closeInvestModal()">إلغاء</button>
                    </div>
                </div>
            </div>

            <script>
                let currentSelectedPackage = null;

                function openInvestModal(name, min) {
                    currentSelectedPackage = { name, min };
                    document.getElementById('modalPackageName').innerText = name;
                    document.getElementById('modalPackageMin').innerText = "المبلغ المحدد للباقة: " + min + "$";
                    document.getElementById('investAmountInput').value = min;
                    document.getElementById('investModal').style.display = 'flex';
                }

                function closeInvestModal() {
                    document.getElementById('investModal').style.display = 'none';
                }

                function confirmInvestment() {
                    const amount = parseFloat(document.getElementById('investAmountInput').value);
                    if (!amount || amount !== parseFloat(currentSelectedPackage.min)) {
                        alert("عذراً، يجب إضافة المبلغ المحدد تماماً بحسب شروط هذه الباقة وهو: " + currentSelectedPackage.min + "$");
                        return;
                    }
                    closeInvestModal();
                    alert("تمت إضافة المبلغ المحدد (" + amount + "$) بنجاح وضغط زر استثمار.. تم فتح وتفعيل الباقة!");
                }

                document.addEventListener("DOMContentLoaded", function() {
                    const oldCards = document.querySelectorAll('.trading-box .card, .trading-box > div:not(.dynamic-packages-container)');
                    oldCards.forEach(card => { if(!card.classList.contains('dynamic-packages-container')) card.style.display = 'none'; });

                    fetch('/api/get-packages')
                    .then(res => res.json())
                    .then(packages => {
                        if(packages.length > 0) {
                            const targetSection = document.querySelector('.trading-box') || document.body;
                            const container = document.createElement('div');
                            container.className = 'dynamic-packages-container';
                            
                            packages.forEach(p => {
                                const pDiv = document.createElement('div');
                                pDiv.className = 'p-card';
                                pDiv.innerHTML = '<h3>➕ ' + p.name + '</h3>' +
                                                 '<p>📈 نسبة العائد: ' + p.profit + '%</p>' +
                                                 '<p>💰 المبلغ المحدد: ' + p.min + '$</p>' +
                                                 '<button onclick="openInvestModal(\\'' + p.name + '\\', \\'' + p.min + '\\')">استثمار</button>';
                                container.appendChild(pDiv);
                            });
                            targetSection.appendChild(container);
                        }
                    });
                });
            </script>
            `;
            modified = modified.replace('</body>', `${customTrading}</body>`);
            content = modified;
        }

        let contentType = 'text/html; charset=utf-8';
        if (url.endsWith('.js')) contentType = 'application/javascript';
        if (url.endsWith('.css')) contentType = 'text/css';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`السيرفر جاهز تماماً.`);
});
