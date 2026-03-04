/**
 * create-admin.js
 * Creates a Firebase Auth user + Firestore admin document.
 * Run with: node create-admin.js
 *
 * Uses only built-in Node.js `https` module — no npm install needed.
 */

const https = require('https');

// ── Config ──────────────────────────────────────────────────
const API_KEY = 'AIzaSyDAwUWh8BHKxHg11kDk4dFmQ9hxykjJtIc';
const PROJECT_ID = 'gradeeval';
const EMAIL = 'kovillanueva@bpsu.edu.ph';
const PASSWORD = '#Admin23';
// ────────────────────────────────────────────────────────────

/** Small fetch wrapper using Node https */
function post(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    console.log('\n🔧  Creating admin account...\n');

    // ── 1. Create the Auth user ──────────────────────────────
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const signUpRes = await post(signUpUrl, {
        email: EMAIL,
        password: PASSWORD,
        returnSecureToken: true,
    });

    if (signUpRes.error) {
        console.error('❌  Auth sign-up failed:', signUpRes.error.message);
        process.exit(1);
    }

    const uid = signUpRes.localId;
    const token = signUpRes.idToken;
    console.log(`✅  Firebase Auth user created`);
    console.log(`    UID   : ${uid}`);
    console.log(`    Email : ${EMAIL}\n`);

    // ── 2. Write user doc to Firestore (REST API) ────────────
    const firestoreUrl =
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;

    const firestoreBody = {
        fields: {
            email: { stringValue: EMAIL },
            role: { stringValue: 'admin' },
            firstName: { stringValue: 'Ko' },
            lastName: { stringValue: 'Villanueva' },
            createdAt: { timestampValue: new Date().toISOString() },
        },
    };

    const firestoreRes = await fetch
        ? await (await fetch(firestoreUrl + '?updateMask.fieldPaths=email&updateMask.fieldPaths=role&updateMask.fieldPaths=firstName&updateMask.fieldPaths=lastName&updateMask.fieldPaths=createdAt', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(firestoreBody),
        })).json()
        : await (async () => {
            // Fallback: use https.request with Bearer token
            const url = new URL(firestoreUrl);
            const payload = JSON.stringify(firestoreBody);
            return new Promise((resolve, reject) => {
                const options = {
                    hostname: url.hostname,
                    path: url.pathname + '?updateMask.fieldPaths=email&updateMask.fieldPaths=role&updateMask.fieldPaths=firstName&updateMask.fieldPaths=lastName&updateMask.fieldPaths=createdAt',
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload),
                        'Authorization': `Bearer ${token}`,
                    },
                };
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => {
                        try { resolve(JSON.parse(data)); }
                        catch { resolve(data); }
                    });
                });
                req.on('error', reject);
                req.write(payload);
                req.end();
            });
        })();

    if (firestoreRes.error) {
        console.warn('⚠️   Firestore doc write issue:', firestoreRes.error.message);
        console.warn('     The Auth account was still created successfully.');
        console.warn('     You may need to manually set the role to "admin" in Firestore.\n');
    } else {
        console.log('✅  Firestore user document created with role: admin\n');
    }

    console.log('─────────────────────────────────────────');
    console.log('🎉  Admin account is ready!');
    console.log(`    Email    : ${EMAIL}`);
    console.log(`    Password : ${PASSWORD}`);
    console.log(`    Role     : admin`);
    console.log(`    UID      : ${uid}`);
    console.log('─────────────────────────────────────────\n');
}

main().catch((err) => {
    console.error('❌  Unexpected error:', err.message || err);
    process.exit(1);
});
