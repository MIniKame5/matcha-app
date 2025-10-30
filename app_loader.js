// Firebaseのインポート (ESモジュール形式でインポート)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query, getDocs, deleteDoc, runTransaction, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ログレベルをデバッグに設定する
setLogLevel('Debug');

// グローバル変数（Firebaseインスタンスは外部で管理する）
let app;
let db;
let auth;
let userId = 'loading';
// __app_idはランタイムから提供される
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let isAuthReady = false;

// 外部から利用できるようにエクスポート
export { initFirebase, loadInstalledApps, launchApp, installApp, uninstallApp, clearInstalledApps, renderStoreApps, userId };


// ********** アプリのデータ定義 **********
// ストアにある全てのアプリの定義だぞ！
const STORE_APPS = [
    {
        id: 'meal_planner',
        name: '献立プランナー 🍽️',
        app_name: '献立プランナー', // アイコンの下の短い名前
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

let installedApps = []; // 実際にユーザーがインストールしているアプリのリスト
// ***************************************************************


// ********** Firebase初期化と認証 **********

/**
 * Firebaseの初期化と認証を行うぜ！
 * @param {object} firebaseConfig - Firebase設定オブジェクト
 * @param {string} initialAuthToken - カスタム認証トークン
 */
async function initFirebase(firebaseConfig, initialAuthToken) {
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: 認証中...`;

    try {
        if (Object.keys(firebaseConfig).length > 0) {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            console.log("✅ Firebaseサービスを初期化したぜ！");
        } else {
            console.error("🚨 Firebase設定が見つからない！ローカルデータモードで実行するぞ。");
            isAuthReady = true;
            userId = crypto.randomUUID();
            if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: ${userId} (ローカル)`;
            loadInstalledApps(); 
            return; 
        }

        // 認証ロジック
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // トークンがない場合は匿名認証を試みる
            await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, (user) => {
            isAuthReady = true;
            if (user) {
                userId = user.uid;
                if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: ${userId}`;
                console.log(`👤 認証完了！UserID: ${userId}`);
            } else {
                // 認証失敗時、または匿名ユーザーの場合のフォールバック
                userId = crypto.randomUUID(); 
                if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: ${userId} (匿名/一時)`;
                console.log(`⚠️ 匿名ユーザーとして実行中。一時UserID: ${userId}`);
            }
            loadInstalledApps(); // 認証完了後にアプリリストをロード
        });

    } catch (e) {
        console.error("🚨 Firebase初期化または認証中にエラーが発生したぞ！", e);
        // エラー発生時も最低限の起動状態にする
        isAuthReady = true;
        userId = crypto.randomUUID();
        if (userIdDisplay) userIdDisplay.textContent = `ユーザーID: ERROR`;
        loadInstalledApps();
    }
}


// ********** アプリのインストール/アンインストール/ロードロジック **********

/**
 * アプリをインストールするぞ！
 */
async function installApp(id) {
    console.log(`[DEBUG] 📥 installApp関数が呼ばれたぞ: ID=${id}`); // 呼び出し確認用ログ
    
    // 認証状態とDB接続のチェックを強化
    if (!db || !isAuthReady || userId === 'loading') {
        alertMessage("🚨 システムがまだ準備できてないか、Firebaseが利用できないぞ！認証状態を確認してくれ。", 'error');
        return;
    }
    
    // アプリIDを確実に取り出す
    const appIdToInstall = id;
    const storeApp = STORE_APPS.find(a => a.id === appIdToInstall);
    
    if (!storeApp) {
         console.error(`🚨 インストールしようとしたアプリID (${appIdToInstall}) がSTORE_APPSに見つからないぞ！`);
         alertMessage(`❌ インストールエラー: アプリデータが見つからない... (${appIdToInstall})`, 'error');
         return;
    }

    try {
        // パス: /artifacts/{canvasAppId}/users/{userId}/installed_apps/{appIdToInstall}
        const appDocRef = doc(db, 'artifacts', appId, 'users', userId, 'installed_apps', appIdToInstall);

        await setDoc(appDocRef, { 
            installedAt: new Date(),
            app_name: storeApp.app_name, 
            icon: storeApp.icon,
            color: storeApp.color,
            appId: appIdToInstall
        });
        
        alertMessage(`✅ ${storeApp.name} をインストールしたぜ！`, 'success');
        showMyApp(); // マイアプリ画面に戻る (onSnapshotがUIを更新するはずだが、念のため)
    } catch (e) {
        console.error(`🚨 アプリのインストールに失敗したぞ！(Firestoreエラー): ${e.code || '不明'}`, e);
        alertMessage(`❌ インストールに失敗した... (Firestore/パーミッションエラーかも): ${e.message}`, 'error');
    }
}

/**
 * アプリをアンインストールするぜ！
 */
async function uninstallApp(id) {
    console.log(`[DEBUG] 📤 uninstallApp関数が呼ばれたぞ: ID=${id}`); // 呼び出し確認用ログ
    
    if (!db || !isAuthReady || userId === 'loading') {
        alertMessage("🚨 まだシステムが準備できてないか、Firebaseが利用できないぞ！", 'error');
        return;
    }
    
    const appIdToUninstall = id;
    const storeApp = STORE_APPS.find(a => a.id === appIdToUninstall);

    try {
        const appDocRef = doc(db, 'artifacts', appId, 'users', userId, 'installed_apps', appIdToUninstall);
        await deleteDoc(appDocRef);
        alertMessage(`🗑️ ${storeApp ? storeApp.name : appIdToUninstall} をアンインストールしたぜ！`, 'success');
        // onSnapshotが自動的にUIを更新
    } catch (e) {
         console.error("🚨 アプリのアンインストールに失敗したぞ！", e);
        alertMessage(`❌ アプリのアンインストールに失敗した...: ${e.message}`, 'error');
    }
}


/**
 * インストール済みアプリのリストをFirestoreからロードしてUIに表示するぜ！
 * onSnapshotでリアルタイム監視する！
 */
function loadInstalledApps() {
    if (!db || !isAuthReady) {
         installedApps = [];
         renderInstalledApps();
         renderStoreApps();
        return;
    }
    
    try {
        // パス: /artifacts/{canvasAppId}/users/{userId}/installed_apps
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
                        // 起動アクションをセット (HTML側で呼び出し可能にする)
                        action: () => launchApp(storeApp.id, storeApp.name)
                    });
                }
            });

            // 描画処理
            renderInstalledApps();
            renderStoreApps();
            const appCount = document.getElementById('app-count');
            if(appCount) appCount.textContent = `${installedApps.length}個インストール済み`;
            console.log(`🖼️ アプリ描画完了。インストール数: ${installedApps.length}`);
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
 * インストール済みアプリをランチャー画面に描画するぞ！
 */
function renderInstalledApps() {
    const container = document.getElementById('installed-apps-list');
    if (!container) return;

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
        // HTML側で定義されたlaunchAppを呼び出すように変更
        appIcon.setAttribute('onclick', `window.launchApp('${app.id}', '${app.name}')`);
        
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
 * ストア画面にアプリカードを描画するぞ！
 */
function renderStoreApps() {
    const container = document.getElementById('store-apps-list');
    if (!container) return;

    container.innerHTML = ''; // 一旦クリア

    STORE_APPS.forEach(storeApp => {
        const isInstalled = installedApps.some(app => app.id === storeApp.id);
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg p-5 flex flex-col transition-shadow duration-300 hover:shadow-xl border border-gray-200';
        
        // 修正ポイント: onclick属性は動的に生成されるため、関数が確実にwindowスコープに存在するよう明示的に呼び出す。
        const buttonAction = isInstalled 
            ? `window.uninstallApp('${storeApp.id}')` 
            : `window.installApp('${storeApp.id}')`;

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
                    class="w-full px-4 py-2 text-white font-bold rounded-lg transition-colors duration-200 ${isInstalled ? 'bg-red-400 hover:bg-red-500' : 'bg-blue-500 hover:bg-blue-600'}"
                    onclick="${buttonAction}"
                >
                    ${isInstalled ? 'アンインストール' : 'インストール'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}


/**
 * アプリを起動するぜ！
 */
async function launchApp(appId, appName) {
    console.log(`🐢 アプリ起動リクエスト: ID=${appId}, 名前=${appName} - 起動ロジックスタート！`);
    
    // HTML側で定義されているUI操作関数を呼び出す
    window.openAppOverlay(appName); 
    const appContainer = document.getElementById('app-container');

    try {
        const appPath = `./apps/${appId}.html`;
        const response = await fetch(appPath);

        if (!response.ok) {
            throw new Error(`アプリファイルが見つからないか、読み込み失敗だ！ステータス: ${response.status}`);
        }

        const appHtmlContent = await response.text();
        
        if (appContainer) {
            appContainer.className = 'w-full h-full overflow-y-auto bg-gray-100 p-0';
        
            const parser = new DOMParser();
            const doc = parser.parseFromString(appHtmlContent, 'text/html');
            
            // アプリのコンテンツをセット
            const appContent = doc.body.innerHTML;
            appContainer.innerHTML = appContent;

            // スクリプトの再実行
            // body内の全てのスクリプトタグを探し、新しい要素として追加し直すことで実行させる
            doc.querySelectorAll('script').forEach(oldScript => {
                const newScript = document.createElement('script');
                // type属性がある場合はコピー (例: type="module")
                if (oldScript.type) newScript.type = oldScript.type; 
                // srcがある場合はコピー
                if (oldScript.src) newScript.src = oldScript.src; 
                // インラインコードがある場合はコピー
                if (oldScript.textContent) newScript.textContent = oldScript.textContent;
                
                // appContainerに新しいスクリプト要素を追加し、実行させる
                appContainer.appendChild(newScript); 
            });
        }

        console.log(`✅ アプリ ${appName} が正常に起動したぜ！`);

    } catch (error) {
        console.error(`🚨 アプリ起動エラー (${appId})`, error);
        
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="p-10 text-center bg-red-100 border-l-4 border-red-500 text-red-700 h-full flex flex-col justify-center items-center">
                    <h3 class="text-2xl font-extrabold mb-3">❌ アプリの起動に失敗したぜ！</h3>
                    <p class="mb-2">エラー内容: ファイルの読み込みまたは実行で問題が発生したぞ。</p>
                    <p class="text-sm font-mono break-all mt-3 px-4 py-2 bg-red-200 rounded-lg max-w-full overflow-x-auto">
                        詳細エラー: ${error.message}
                    </p>
                </div>
            `;
        }
    }
}


/**
 * カスタムアラートメッセージを表示する関数
 */
function alertMessage(message, type = 'info') {
    // alert()は使えないから、メッセージをコンソールに出力するぜ！
    console.log(`[メッセージ: ${type.toUpperCase()}] ${message}`);
    
    // UIとしてメッセージを表示する場合（簡易版）
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
    if (!db || !isAuthReady) {
        alertMessage("🚨 Firebaseが利用できないので削除できないぞ！", 'error');
        return;
    }

    // ユーザーに確認を促すUI（ここでは簡易的に）
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
