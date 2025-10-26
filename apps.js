/**
 * apps.js
 *
 * このファイルは、まっちゃアプリの AI拡張機能（アプリ）のデータとロジックを定義するよ！
 * APPS_DATAオブジェクトにアプリの情報を追加すると、ストア画面とマイアプリ画面に自動的に表示されるんだ！
 */

// =========================================================
// 献立プランナーアプリのロジック (変更なし)
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
// 全国天気ポータルアプリのロジック (最終修正!)
// =========================================================

/**
 * 検索ボタンがクリックされたときに、地域名とtenki.jpを組み合わせてGoogle検索を実行する関数だよ！
 */
function searchWeather() {
    const inputElement = document.getElementById('weather-city-input');
    const city = inputElement.value.trim();
    if (city) {
        // 【重要】ユーザーの要望に従って、「地域名 + tenki.jp」でGoogle検索するURLに飛ばすよ！
        // これで、Googleが一番詳しい該当ページ（例：tenki.jpの嘉手納町のページ）を検索結果トップに出してくれる！
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(city + ' tenki.jp')}`;
        window.open(searchUrl, '_blank');
        showMessageBox(`${city}のtenki.jp情報を検索したよ！`, 'bg-blue-500');
    } else {
        showMessageBox('地域名を入力してね！', 'bg-red-500');
    }
}

/**
 * 全国天気ポータルアプリのUIをレンダリングする関数だよ！
 */
function renderWeatherApp() {
    // tenki.jpの沖縄地方のトップページURL (「沖縄が特に信ぴょう性高い」を担保する直行リンク)
    const okinawaTenkiUrl = 'https://tenki.jp/forecast/10/'; 

    return `
        <div class="p-6 pt-10 min-h-full bg-blue-50">
            <!-- ヘッダーと戻るボタン -->
            <div class="flex items-center justify-between mb-8">
                <!-- まっちゃアプリのマイアプリ画面に戻る -->
                <button onclick="showView(VIEWS.MY_APPS)" class="text-blue-600 hover:text-blue-800 transition duration-150">
                    <i data-lucide="chevron-left" class="w-8 h-8"></i>
                </button>
                <h1 class="text-3xl font-extrabold text-gray-800 flex-grow text-center pr-8">
                    ✅ 全国天気ポータル
                </h1>
            </div>

            <div class="bg-white p-8 rounded-3xl shadow-2xl border-4 border-blue-300 mb-8 text-center">
                <h2 class="text-2xl font-bold text-blue-800 mb-6 flex items-center justify-center">
                    <i data-lucide="zap" class="w-6 h-6 mr-3 text-yellow-500"></i>
                    信頼できる天気情報へ瞬速アクセス！
                </h2>
                
                <!-- 1. 地域の名前を入力して検索する機能 (君の最新要望に対応!) -->
                <div class="flex flex-col space-y-4">
                    <input type="text" id="weather-city-input"
                        class="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring focus:ring-red-100 transition duration-150 text-lg placeholder-gray-500"
                        placeholder="例: 那覇、東京、札幌"
                        value="嘉手納町" <!-- 初期値は嘉手納！ -->
                    >
                    <button onclick="searchWeather()" 
                        class="w-full py-4 bg-red-500 text-white text-xl font-extrabold rounded-xl shadow-xl 
                           hover:bg-red-600 active:bg-red-700 transition duration-150 transform hover:scale-[1.01] flex items-center justify-center">
                        <i data-lucide="map-search" class="w-6 h-6 mr-3"></i>
                        地域の詳細天気をチェック！
                    </button>
                    <p class="mt-2 text-sm text-gray-500 text-center">※入力した地域名とtenki.jpを組み合わせて検索結果を表示するよ。</p>
                </div>


                <div class="w-full border-t-2 border-gray-200 my-6"></div>

                <h3 class="text-xl font-semibold text-gray-700 mb-4">
                    沖縄に直行したいならこちら！
                </h3>
                
                <!-- 2. 沖縄のtenki.jpへ直行ボタン (最優先の要望を担保) -->
                <a href="${okinawaTenkiUrl}" target="_blank"
                    class="w-full inline-flex items-center justify-center py-3 px-6 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-lg 
                           hover:bg-blue-600 active:bg-blue-700 transition duration-150 transform hover:scale-[1.01]">
                    <i data-lucide="cloud-sun" class="w-5 h-5 mr-2"></i>
                    沖縄地方の天気（tenki.jp）トップへ
                </a>
            </div>

            <div class="mt-6 p-4 bg-blue-100 rounded-xl text-blue-700 text-sm">
                <p class="font-bold mb-1">💡 まっちゃからのこだわり</p>
                <p>AIの予測ではなく、tenki.jpなど信頼性の高い気象サイトのページに誘導する形式にしたよ！地域名入力で、一番詳しいページにジャンプできるはず！</p>
            </div>
        </div>
    `;
}

/**
 * ページが完全にロードされ、アプリビューに切り替わった後に実行するフックだよ！
 * index.htmlのshowView()から呼ばれる想定
 */
function onWeatherAppLaunched() {
    // Lucideアイコンの再描画
    lucide.createIcons(); 
    // このアプリは起動時に特別なデータ取得はしないよ
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
    // 【再修正!】天気ポータルアプリにしたよ！
    'weather_portal': { 
        id: 'weather_portal',
        name: '全国天気ポータル ✅', 
        icon: '🗾', // 日本地図アイコン！
        description: '信頼性の高い天気サイトへ一発アクセス！特に沖縄を優遇したよ！', 
        renderFunction: renderWeatherApp, // 汎用的なレンダリング関数を使用
        onLaunch: onWeatherAppLaunched // アプリ起動後に実行する処理
    },
};

// グローバルスコープに公開して、他のファイルからアクセスできるようにするよ！
window.APPS_DATA = APPS_DATA;
window.generateMealPlan = generateMealPlan; 
window.renderWeatherApp = renderWeatherApp; 
window.searchWeather = searchWeather; // 新しい検索関数をグローバルに公開
window.onWeatherAppLaunched = onWeatherAppLaunched;
