/**
 * apps.js
 *
 * このファイルは、まっちゃアプリ OS (index.html) に組み込む
 * AI拡張機能（アプリ）のデータとロジックを定義するよ！
 *
 * APPS_DATAオブジェクトにアプリの情報を追加すると、
 * OSのストア画面とマイアプリ画面に自動的に表示されるんだ！
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
                <!-- OSのマイアプリ画面に戻る -->
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
// アプリ定義データ (OSに読み込まれる)
// =========================================================

/**
 * 🍵 まっちゃアプリ OSに登録する全てのAI拡張機能のデータだよ！
 * ID、名前、アイコン、説明、そして起動時に呼ばれる関数を定義するんだ！
 *
 * index.html の initApp() でこのデータが利用され、ストアの状態が初期化されるよ！
 */
const APPS_DATA = {
    'meal_planner': {
        id: 'meal_planner',
        name: '献立プランナー 🍽️',
        icon: '🍱',
        description: '冷蔵庫の食材からAIが最適な献立を提案するよ。今日の晩ご飯は何にする？',
        renderFunction: renderMealPlannerApp
    },
    // 将来、新しいアプリを追加するならここに追加するんだ！
};

// グローバルスコープに公開して、index.htmlからアクセスできるようにするよ！
window.APPS_DATA = APPS_DATA;
window.generateMealPlan = generateMealPlan; // アプリ内のボタンから呼べるようにする
