/**
 * apps.js
 *
 * このファイルは、まっちゃアプリの AI拡張機能（アプリ）のデータとロジックを定義するよ！
 * APPS_DATAオブジェクトにアプリの情報を追加すると、ストア画面とマイアプリ画面に自動的に表示されるんだ！
 */

// =========================================================
// 献立プランナーアプリのロジック
// =========================================================

/**
 * 献立プランナーアプリのメインUIをレンダリングする関数だよ！
 */
function renderMealPlannerApp() {
    return `
        <div class="p-6 pt-10 min-h-full bg-yellow-50">
            <!-- ヘッダーと戻るボタン -->
            <div class="flex items-center justify-between mb-6">
                <!-- まっちゃアプリのマイアプリ画面に戻る -->
                <button onclick="showView(VIEWS.MY_APPS)" class="text-green-600 hover:text-green-800 transition duration-150">
                    <i data-lucide="chevron-left" class="w-8 h-8"></i>
                </button>
                <h1 class="text-3xl font-extrabold text-gray-800 flex-grow text-center pr-8">
                    🍱 献立プランナー
                </h1>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-xl border border-yellow-200">
                <h2 class="text-xl font-bold text-gray-700 mb-4">冷蔵庫の食材とリクエストを入力してね！</h2>
                
                <!-- 入力フォーム -->
                <textarea id="meal-request-input"
                    class="w-full h-32 p-4 border-2 border-yellow-300 rounded-lg focus:border-green-500 focus:ring focus:ring-green-100 transition duration-150 text-base"
                    placeholder="例: 豚肉、キャベツ、卵があります。時短で、子供も喜ぶメニューをお願いします！"
                >豚肉、キャベツ、卵があります。時短で、子供も喜ぶメニューをお願いします！</textarea>

                <!-- 提案ボタン -->
                <button onclick="generateMealPlan()" id="meal-plan-button"
                    class="w-full mt-4 py-3 bg-green-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-green-600 active:bg-green-700 transition duration-150 transform hover:scale-[1.01] flex items-center justify-center">
                    <i data-lucide="chef-hat" class="w-5 h-5 mr-2"></i>
                    献立をAIに提案してもらう！
                </button>
            </div>

            <!-- ローディングインジケーター -->
            <div id="meal-plan-loading" class="mt-8 hidden text-center">
                <div class="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                <p class="mt-3 text-green-700 font-semibold">AIが献立を考え中... しばしお待ちを！ 🍜</p>
            </div>

            <!-- 結果表示エリア -->
            <div id="meal-plan-result" class="mt-8">
                <div class="p-6 bg-gray-100 rounded-2xl border-dashed border-2 border-gray-300 text-center text-gray-500">
                    <i data-lucide="lightbulb" class="w-6 h-6 mx-auto mb-2"></i>
                    <p>ここにAIが考えた献立の提案が表示されるよ！</p>
                </div>
            </div>
            
        </div>
    `;
}

/**
 * 献立の提案をGemini APIにリクエストする関数だよ！
 */
async function generateMealPlan() {
    const inputElement = document.getElementById('meal-request-input');
    const resultElement = document.getElementById('meal-plan-result');
    const loadingElement = document.getElementById('meal-plan-loading');
    const buttonElement = document.getElementById('meal-plan-button');
    
    const userPrompt = inputElement.value.trim();
    if (!userPrompt) {
        showMessageBox('リクエスト内容を入力してください！', 'bg-red-500');
        return;
    }

    // UIをローディング状態に切り替える
    buttonElement.disabled = true;
    buttonElement.classList.add('opacity-50');
    resultElement.innerHTML = '';
    loadingElement.classList.remove('hidden');

    // 1. システムインストラクションを定義
    const systemInstruction = "あなたはユーザーの健康と好みを考慮したプロの献立プランナーAIです。ユーザーが指定した食材と希望に基づき、栄養バランスと調理の手軽さを両立した献立を3つ提案してください。提案はMarkdown形式で、各提案に「概要」と「追加食材」を必ず含めてください。";

    // 2. ユーザープロンプトを定義
    // Google検索を有効にしているので、食材から献立を検索させるよ！
    const query = `【現在の食材】${userPrompt} \n\n【提案へのリクエスト】上記の食材を使って、以下の制約を考慮した献立を3つ提案してください。`;

    // 3. APIペイロードの作成
    const payload = {
        contents: [{ parts: [{ text: query }] }],
        tools: [{ "google_search": {} }], // 献立のアイデアのためにGoogle検索を有効にするよ！
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
    };

    // 4. API呼び出し（_callFetchはindex.htmlで定義されたダミーのラッパーだよ）
    try {
        // ここで指数バックオフを実装すべきだけど、今回はダミーfetchなので省略
        const response = await window._callFetch(window.GEMINI_API_URL, payload);
        const result = await response.json();

        const candidate = result.candidates?.[0];
        let generatedText = "ごめん、献立を考えるのに失敗しちゃったみたい... 😥";

        if (candidate && candidate.content?.parts?.[0]?.text) {
            generatedText = candidate.content.parts[0].text;
        }

        // 5. 結果を表示（Markdownを簡易的にHTMLに変換）
        resultElement.innerHTML = `
            <div class="bg-green-100 p-6 rounded-2xl shadow-xl">
                <h2 class="text-xl font-bold text-green-800 mb-4 flex items-center">
                    <i data-lucide="clipboard-list" class="w-5 h-5 mr-2"></i>
                    AIからの献立提案
                </h2>
                <div class="markdown-body text-gray-700" id="markdown-output">
                    ${markdownToHtml(generatedText)}
                </div>
            </div>
        `;
        // Lucideアイコンを再作成
        lucide.createIcons();
        showMessageBox('✨ 献立の提案が届いたよ！', 'bg-purple-500');


    } catch (error) {
        console.error("API呼び出しエラー:", error);
        resultElement.innerHTML = `
            <div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
                <strong>エラーが発生したよ！</strong>
                <p>通信に失敗したか、APIがうまく動かなかったみたい...。</p>
            </div>
        `;
        showMessageBox('通信エラーが発生したよ！', 'bg-red-500');
    } finally {
        // UIを元に戻す
        loadingElement.classList.add('hidden');
        buttonElement.disabled = false;
        buttonElement.classList.remove('opacity-50');
    }
}

/**
 * 簡易的なMarkdown to HTML変換関数
 * (太字、見出し、リストに対応) - 結果を綺麗に見せるためのものだよ！
 */
function markdownToHtml(markdown) {
    let html = markdown
        .replace(/### (.*)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>') // H3
        .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>') // H2
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\* (.*)/g, '<li class="ml-4 list-disc text-sm">$1</li>'); // List items
        
    // リストの開始タグと終了タグを追加
    if (html.includes('<li')) {
        // リストアイテムの直前/直後に<ul>タグを追加
        html = `<ul>${html}</ul>`;
        // H3/H2とリストの間にPタグが入らないように調整
        html = html.replace(/<\/h3><ul>/g, '</h3><ul class="ml-2">');
        html = html.replace(/<\/h2><ul>/g, '</h2><ul class="ml-2">');
    }

    // 段落をPタグで囲む（Markdownの空行で区切られた部分を想定）
    html = html.split('\n\n').map(p => {
        if (p.trim() === '' || p.startsWith('<h') || p.startsWith('<ul>') || p.startsWith('<li') || p.startsWith('<hr')) {
            return p;
        }
        return `<p class="mb-3">${p}</p>`;
    }).join('');
    
    // 水平線
    html = html.replace(/---/g, '<hr class="my-4 border-gray-300">');

    // 最後に残った改行を<br>に変換
    html = html.replace(/\n/g, '<br>');


    return html;
}

// =========================================================
// 全国天気予報アプリのロジック (更新!)
// =========================================================

/**
 * 全国天気予報アプリのUIをレンダリングする関数だよ！
 */
function renderWeatherApp() {
    return `
        <div class="p-6 pt-10 min-h-full bg-blue-50">
            <!-- ヘッダーと戻るボタン -->
            <div class="flex items-center justify-between mb-8">
                <!-- まっちゃアプリのマイアプリ画面に戻る -->
                <button onclick="showView(VIEWS.MY_APPS)" class="text-blue-600 hover:text-blue-800 transition duration-150">
                    <i data-lucide="chevron-left" class="w-8 h-8"></i>
                </button>
                <h1 class="text-3xl font-extrabold text-gray-800 flex-grow text-center pr-8">
                    🗾 全国天気予報
                </h1>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-xl border border-blue-200 mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-4 flex items-center">
                    <i data-lucide="map-pin" class="w-5 h-5 mr-2 text-red-500"></i>
                    予報してほしい地域を入力！
                </h2>
                <!-- 入力フォームを設置 -->
                <input type="text" id="weather-city-input"
                    class="w-full p-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-100 transition duration-150 text-base mb-4"
                    placeholder="例: 那覇、東京、大阪"
                    value="沖縄（特に嘉手納町）" <!-- 初期値を沖縄にするよ！ -->
                >
                <button onclick="fetchWeather()" id="weather-fetch-button"
                    class="w-full py-3 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-blue-600 active:bg-blue-700 transition duration-150 transform hover:scale-[1.01] flex items-center justify-center">
                    <i data-lucide="cloud-sun" class="w-5 h-5 mr-2"></i>
                    天気を調べる！
                </button>
            </div>

            <div id="weather-display" class="bg-white p-6 rounded-3xl shadow-2xl border-4 border-blue-300 text-center min-h-48 flex items-center justify-center">
                <p class="text-lg font-semibold text-gray-500">上のボタンを押して天気を調べてみてね！</p>
            </div>

            <div class="mt-8 p-4 bg-blue-100 rounded-xl text-blue-700 text-sm">
                <p class="font-bold mb-1">💡 まっちゃからのヒント</p>
                <p>AIが日本の天気予報を提供するよ！特に沖縄地方の予報は力を入れて調べるように設定したから、安心してね！</p>
            </div>
        </div>
    `;
}

/**
 * 天気情報を取得して表示する関数だよ！
 */
async function fetchWeather() {
    const displayElement = document.getElementById('weather-display');
    const inputElement = document.getElementById('weather-city-input');
    const buttonElement = document.getElementById('weather-fetch-button');
    
    const city = inputElement.value.trim();
    if (!city) {
        showMessageBox('地域名を入力してください！', 'bg-red-500');
        return;
    }

    // UIをローディング状態に切り替える
    buttonElement.disabled = true;
    buttonElement.classList.add('opacity-50');
    displayElement.innerHTML = `
        <div id="loading-initial" class="flex flex-col items-center justify-center p-8">
            <div class="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
            <p class="text-lg font-semibold text-blue-700">最新天気を取得中... 🌊</p>
        </div>
    `;

    // 1. システムインストラクションを定義 (変更点: 日本全国対応、沖縄重視を明記)
    const systemInstruction = "あなたは日本全国に対応した、親しみやすいプロの気象予報士AIです。ユーザーが指定した地域の天気と、週末（土日）の予報を簡潔かつ親しみやすいトーンで提供してください。特に沖縄地方（例: 那覇、嘉手納、石垣など）の予報については、Google検索の結果を重視して、より詳細で信頼性の高い情報を提供するように努めてください。予報には天気アイコン（絵文字）を使い、気温や降水確率も含めて、見やすいMarkdown形式で出力してください。";

    // 2. ユーザープロンプトを定義
    const userQuery = `【地域】${city} \n\n【リクエスト】現在の天気と、土曜日・日曜日の天気予報を教えてください。`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }], // Google検索を有効にするよ！
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
    };

    try {
        // API呼び出し
        const response = await window._callFetch(window.GEMINI_API_URL, payload);
        const result = await response.json();

        const candidate = result.candidates?.[0];
        let weatherText = "現在、天気情報を取得できませんでした...ごめんね。";

        if (candidate && candidate.content?.parts?.[0]?.text) {
            weatherText = candidate.content.parts[0].text;
        }

        // 結果をHTMLに変換して表示
        displayElement.innerHTML = `
            <div class="text-4xl font-black text-blue-900 mb-4">${city}の予報 🥳</div>
            <div class="markdown-body text-gray-700 text-left">
                ${markdownToHtml(weatherText)}
            </div>
            <p class="mt-4 text-xs text-gray-500">情報更新: ${new Date().toLocaleTimeString('ja-JP')}</p>
        `;
        showMessageBox('☀️ 天気予報が届いたよ！', 'bg-blue-500');

    } catch (error) {
        console.error("天気API呼び出しエラー:", error);
        displayElement.innerHTML = `
            <div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
                <strong>ごめんね、エラーだよ！</strong>
                <p>天気情報の取得に失敗しちゃった...！</p>
            </div>
        `;
        showMessageBox('通信エラー！天気情報が取れないよ！', 'bg-red-500');
    } finally {
        // UIを元に戻す
        buttonElement.disabled = false;
        buttonElement.classList.remove('opacity-50');
    }
}

/**
 * ページが完全にロードされ、アプリビューに切り替わった後に実行するフックだよ！
 * index.htmlのshowView()から呼ばれる想定
 */
function onWeatherAppLaunched() {
    // Lucideアイコンの再描画
    lucide.createIcons(); 
    // アプリ起動時に即座に天気を取得する代わりに、ユーザーの入力を待つ
}

// =========================================================
// アプリ定義データ (まっちゃアプリに読み込まれるカタログ)
// =========================================================

/**
 * 🍵 まっちゃアプリに登録する全てのAI拡張機能のデータだよ！
 */
const APPS_DATA = {
    'meal_planner': {
        id: 'meal_planner',
        name: '献立プランナー 🍽️',
        icon: '🍱',
        description: '冷蔵庫の食材からAIが最適な献立を提案するよ。今日の晩ご飯は何にする？',
        renderFunction: renderMealPlannerApp
    },
    // 【更新!】全国天気予報アプリに変更したよ！
    'weather_forecast': { // IDも汎用的な名前に変更
        id: 'weather_forecast',
        name: '全国天気予報 ☀️', // 名前も変更
        icon: '🗾', // 日本地図アイコン！
        description: '日本全国の天気予報をAIが調べてくれるよ！沖縄の予報は特に信頼性が高いよ！', // 説明文も変更
        renderFunction: renderWeatherApp, // 汎用的なレンダリング関数を使用
        onLaunch: onWeatherAppLaunched // アプリ起動後に実行する処理
    },
};

// グローバルスコープに公開して、他のファイルからアクセスできるようにするよ！
window.APPS_DATA = APPS_DATA;
window.generateMealPlan = generateMealPlan; 
window.renderWeatherApp = renderWeatherApp; 
window.fetchWeather = fetchWeather; // ボタンから呼べるようにする
window.onWeatherAppLaunched = onWeatherAppLaunched;
