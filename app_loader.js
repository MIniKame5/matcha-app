// Firebaseのインポート (ESモジュール形式でインポート)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query, getDocs, deleteDoc, runTransaction, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ログレベルをデバッグに設定する
setLogLevel('Debug');

// グローバル変数（Firebaseインスタンスは外部で管理する）
let app = null;
let db = null; 
let auth = null;
let userId = 'loading'; // ユーザーIDは初期化完了まで'loading'
// __app_idはランタイムから提供される
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let isAuthReady = false; // 認証プロセスが完了したかどうかを示すフラグ

// 外部から利用できるようにエクスポート
export { initFirebase, loadInstalledApps, launchApp, installApp, uninstallApp, clearInstalledApps, renderStoreApps, userId };


// ********** アプリのデータ定義 (省略) **********
const STORE_APPS = [
    {
        id: 'meal_planner',
        name: '献立プランナー 🍽️',
        app_name: '献立プランナー',
        description: '冷蔵庫の食材からAIが最適な献立を提案するよ。今日の晩ご飯は何にする？',
        icon: '🍱',
        color: 'bg-yellow-500',
        isInstalled: false, 
    },
    {
        id: 'weather_portal',
        name: '全国天気ポータル ☀️',
        app_name: '天気ポータル',
        description: '信頼性の高い天気サイトへ一発アクセス！特に沖縄を優遇したよ！',
        icon: '🗺️',
        color: 'bg-blue-400',
        isInstalled: false,
    }
    ,{
        id: 'note_pad',
        name: 'メモ帳 📝',
        app_name: 'メモ帳',
        description: '簡単なメモを取るためのシンプルなアプリだ！',
        icon: '📋',
        color: 'bg-blue-500',
        isInstalled: false,
    }
];

let installedApps = []; 
// ***************************************************************


// ********** Firebase初期化と認証 (接続エラー時のフィードバックを改善) **********

/**
 * Firebaseの初期化と認証を行うぜ！
 */
async function initFirebase(firebaseConfig, initialAuthToken) {
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: 認証中...`;
    
    // Firebase設定が空かどうかチェック
    const isConfigEmpty = !firebaseConfig || Object.keys(firebaseConfig).length === 0;

    if (isConfigEmpty) {
        // Firebase設定がない場合のローカルデータモードに強制移行
        console.error("🚨 Firebase設定が見つからないか空だぞ！ローカルデータモードで実行するぞ。");
        db = null; // Firestoreは使用しない
        isAuthReady = true;
        userId = crypto.randomUUID();
        if (userIdDisplay) userIdDisplay.innerHTML = `ユーザーID: <span class="font-bold text-red-500">ローカル (${userId.substring(0, 6)}...)</span>`;
        alertMessage("⚠️ Firebase設定がないため、アプリはローカルモードで実行中。データは保存されないぞ！", 'error');
        loadInstalledApps(); // 認証完了フラグが立った後、空のデータでアプリをロード
        return; // これ以上処理を進めない
    }

    // 設定がある場合はFirebase接続を試みる
    try {
        // 1. Firebaseサービスの初期化
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("✅ Firebaseサービスを初期化したぜ！DB接続OK。");

        // 2. 認証処理
        if (initialAuthToken) {
            // カスタムトークンでサインイン
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // トークンがない場合は匿名認証を試みる
            await signInAnonymously(auth);
        }
        
        // 3. 認証状態の監視 (これが完了を待つメインの処理)
        onAuthStateChanged(auth, (user) => {
            isAuthReady = true; // 認証フロー完了
            if (user) {
                userId = user.uid;
                if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: ${userId}`;
                console.log(`👤 認証完了！UserID: ${userId}`);
            } else {
                // 認証失敗時、または匿名ユーザーの場合
                userId = crypto.randomUUID(); 
                if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: ${userId} (一時)`;
                console.log(`⚠️ 匿名/一時ユーザーとして実行中。UserID: ${userId}`);
            }
            loadInstalledApps(); // 認証完了後にアプリリストをロード
        });

    } catch (e) {
        // 4. 初期化または認証中にエラーが発生した場合
        console.error("🚨 Firebase初期化または認証中に致命的なエラーが発生したぞ！", e);
        // エラー発生時もアプリがハングしないように完了状態にする
        db = null; // Firestoreは使用しない
        isAuthReady = true;
        userId = 'ERROR-' + crypto.randomUUID();
        if (userIdDisplay) userIdDisplay.innerHTML = `ユーザーID: <span class="font-bold text-red-700">接続エラー!</span>`;
        alertMessage(`🚨 Firebase接続エラー: ${e.message}。ローカルモードで続行するぞ。`, 'error');
        loadInstalledApps(); // ローカルモードとして処理を継続
    }
}


// ********** アプリのインストール/アンインストール/ロードロジック **********

/**
 * アプリをインストールするぞ！
 */
async function installApp(id) {
    // 【堅牢性チェック】dbが初期化されているか、認証が完了しているか確認
    if (!db) {
        alertMessage("🚨 現在ローカルモードで実行中。インストールはできないぞ！", 'error');
        return;
    }
    if (!isAuthReady || userId === 'loading') {
        alertMessage("🚨 システムがまだ認証プロセス中だ。少し待ってね！", 'error');
        return;
    }
    
    const appIdToInstall = id;
    const storeApp = STORE_APPS.find(a => a.id === appIdToInstall);
    
    if (!storeApp) {
         console.error(`🚨 インストールしようとしたアプリID (${appIdToInstall}) がストアに見つからないぞ！`);
         alertMessage(`❌ インストールエラー: アプリデータが見つからない...`, 'error');
         return;
    }

    try {
        const appDocRef = doc(db, 'artifacts', appId, 'users', userId, 'installed_apps', appIdToInstall);

        await setDoc(appDocRef, { 
            installedAt: new Date(),
            app_name: storeApp.app_name, 
            icon: storeApp.icon,
            color: storeApp.color,
            appId: appIdToInstall
        });
        
        alertMessage(`✅ ${storeApp.name} をインストールしたぜ！`, 'success');
        window.showMyApp(); 
    } catch (e) {
        // Firestoreのエラーコードも確認して、より具体的なフィードバックを出す
        const errorMessage = e.code === 'permission-denied' 
            ? '権限がないためインストールできないぞ！(セキュリティルール確認)' 
            : e.message;

        console.error(`🚨 アプリのインストールに失敗したぞ！(Firestoreエラー): ${e.code || '不明'}`, e);
        alertMessage(`❌ インストールに失敗した...: ${errorMessage}`, 'error');
    }
}

/**
 * アプリをアンインストールするぜ！
 */
async function uninstallApp(id) {
    // 【堅牢性チェック】
    if (!db) {
        alertMessage("🚨 現在ローカルモードで実行中。アンインストール操作は不要だぞ！", 'error');
        return;
    }
    if (!isAuthReady || userId === 'loading') {
        alertMessage("🚨 システムがまだ認証プロセス中だ。少し待ってね！", 'error');
        return;
    }
    
    const appIdToUninstall = id;
    const storeApp = STORE_APPS.find(a => a.id === appIdToUninstall);

    try {
        const appDocRef = doc(db, 'artifacts', appId, 'users', userId, 'installed_apps', appIdToUninstall);
        await deleteDoc(appDocRef);
        alertMessage(`🗑️ ${storeApp ? storeApp.name : appIdToUninstall} をアンインストールしたぜ！`, 'success');
    } catch (e) {
         console.error("🚨 アプリのアンインストールに失敗したぞ！", e);
        alertMessage(`❌ アプリのアンインストールに失敗した...: ${e.message}`, 'error');
    }
}


/**
 * インストール済みアプリのリストをFirestoreからロードしてUIに表示するぜ！
 */
function loadInstalledApps() {
    // 【堅牢性チェック】dbが未接続の場合はローカル空リストで続行
    if (!db) {
         installedApps = [];
         renderInstalledApps();
         renderStoreApps();
         console.log("⚠️ DBが未接続のため、インストール済みアプリは空のリストとして扱われるぞ。");
        return;
    }
    
    try {
        const q = collection(db, 'artifacts', appId, 'users', userId, 'installed_apps');
        
        // リアルタイムリスナー
        onSnapshot(q, (snapshot) => {
            console.log('🔄 onSnapshot: アプリリストデータを受信したぞ！');
            installedApps = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const installedAppId = doc.id;
                const storeApp = STORE_APPS.find(a => a.id === installedAppId);
                
                if (storeApp) {
                    installedApps.push({
                        ...storeApp,
                        app_name: data.app_name || storeApp.app_name, 
                        icon: data.icon || storeApp.icon,
                        color: data.color || storeApp.color,
                        isInstalled: true,
                        // 起動アクションをセット 
                        action: () => launchApp(storeApp.id)
                    });
                }
            });

            // 描画処理
            renderInstalledApps();
            renderStoreApps();
            const appCount = document.getElementById('app-count');
            if(appCount) appCount.textContent = `${installedApps.length}個インストール済み`;
        }, (error) => {
            console.error("🚨 onSnapshotリスナーでエラーが発生したぞ！", error);
            alertMessage('❌ アプリリストのリアルタイム監視に失敗した...', 'error');
        });

    } catch (e) {
        console.error("🚨 インストール済みアプリのロードに失敗したぞ！", e);
        alertMessage('❌ アプリリストの読み込みに失敗した...', 'error');
    }
}


/**
 * インストール済みアプリをランチャー画面に描画するぞ！ (UI省略)
 */
function renderInstalledApps() {
    const container = document.getElementById('installed-apps-list');
    if (!container) return;
    // ... (UI描画ロジックの本体は省略)
    container.innerHTML = ''; // 一旦クリア
    
    if (installedApps.length === 0) {
        container.className = 'flex justify-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100';
        container.innerHTML = `
            <div class="text-center p-10 text-gray-500">
                <div class="text-4xl mb-4">📦</div>
                <p class="font-bold">アプリがまだインストールされてないよ！</p>
                <p>「まっちゃストア」で気に入ったアプリを見つけてインストールしよう！</p>
                <button onclick="window.showStore()" class="mt-4 px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
                    ストアへ行く
                </button>
            </div>
        `;
        return;
    }

    container.className = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 p-4 bg-white rounded-3xl shadow-xl border border-gray-100';

    installedApps.forEach(app => {
        const appIcon = document.createElement('div');
        appIcon.className = 'app-icon-container flex flex-col items-center p-2';
        appIcon.setAttribute('onclick', `window.launchApp('${app.id}')`);
        
        appIcon.innerHTML = `
            <div class="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center ${app.color} rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-150 mb-1">
                <span class="text-4xl sm:text-5xl">${app.icon}</span>
            </div>
            <p class="text-xs font-semibold text-gray-700 text-center mt-1 truncate w-full">
                ${app.app_name} 
            </p>
        `;
        container.appendChild(appIcon);
    });
}

/**
 * ストア画面にアプリカードを描画するぞ！ (UI省略)
 */
function renderStoreApps() {
    const container = document.getElementById('store-apps-list');
    if (!container) return;

    container.innerHTML = ''; // 一旦クリア

    STORE_APPS.forEach(storeApp => {
        const isInstalled = installedApps.some(app => app.id === storeApp.id);
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg p-5 flex flex-col transition-shadow duration-300 hover:shadow-xl border border-gray-200';
        
        // ローカルモードの場合は、ボタンを無効化する
        const isDisabled = !db;
        const buttonText = isDisabled ? '⚠️ ローカルモード' : (isInstalled ? 'アンインストール' : 'インストール');
        const buttonClass = isDisabled 
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : (isInstalled ? 'bg-red-400 hover:bg-red-500' : 'bg-blue-500 hover:bg-blue-600');
        const buttonAction = isDisabled 
            ? '' 
            : (isInstalled 
                ? `window.uninstallApp('${storeApp.id}')` 
                : `window.installApp('${storeApp.id}')`);


        card.innerHTML = `
            <div class="flex items-start mb-4">
                <div class="text-4xl mr-4">${storeApp.icon}</div>
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center">
                        ${storeApp.name}
                        ${isInstalled ? '<span class="ml-2 text-green-500">✅</span>' : ''}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">${storeApp.description}</p>
                </div>
            </div>
            <div class="mt-auto">
                <button 
                    class="w-full px-4 py-2 text-white font-bold rounded-lg transition-colors duration-200 ${buttonClass}"
                    onclick="${buttonAction}"
                    ${isDisabled ? 'disabled' : ''}
                >
                    ${buttonText}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}


/**
 * アプリを起動するぜ！ (画面遷移)
 */
function launchApp(appId) {
    console.log(`🐢 アプリ起動リクエスト: ID=${appId} - 画面を直接切り替えるぞ！`);
    const appPath = `./apps/${appId}.html`;
    window.location.href = appPath;
    alertMessage(`🚀 ${appId} を起動したぜ！画面が切り替わるぞ！`, 'info');
}


/**
 * カスタムアラートメッセージを表示する関数 (UI省略)
 */
function alertMessage(message, type = 'info') {
    console.log(`[メッセージ: ${type.toUpperCase()}] ${message}`);
    
    const msgDiv = document.createElement('div');
    msgDiv.textContent = message;
    msgDiv.className = `fixed bottom-4 right-4 p-3 rounded-lg shadow-xl text-white z-[100] transition-opacity duration-300 ${type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600')}`;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.style.opacity = '0';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

/**
 * インストール済みアプリを全削除するぜ！
 */
async function clearInstalledApps() {
    // 【堅牢性チェック】
    if (!db) {
        alertMessage("🚨 現在ローカルモードで実行中。削除操作は無視されるぞ！", 'error');
        return;
    }
    if (!isAuthReady) {
        alertMessage("🚨 Firebaseがまだ準備できていないぞ！少し待ってね。", 'error');
        return;
    }

    console.log("⚠️ 確認: 全てのインストール済みアプリを削除するよ！続行...");
    
    try {
        await runTransaction(db, async (transaction) => {
            const q = collection(db, 'artifacts', appId, 'users', userId, 'installed_apps');
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return;
            }

            snapshot.docs.forEach((doc) => {
                const docRef = doc.ref;
                transaction.delete(docRef);
            });
        });

        alertMessage('🗑️ 全てのインストール済みアプリを削除したぜ！', 'success');
    } catch (e) {
        console.error("🚨 アプリの全削除に失敗したぞ！", e);
        alertMessage(`❌ 全アプリの削除に失敗した...: ${e.message}`, 'error');
    }
}
