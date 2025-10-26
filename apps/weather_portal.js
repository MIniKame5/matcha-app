/**
 * 全国天気ポータルアプリ (weather_portal.js)
 *
 * このファイルは、全国天気ポータルの UI とロジックを定義する ESモジュールだよ。
 * default export としてアプリ定義オブジェクトを返すよ。
 */

// index.htmlで定義されたグローバル関数 (メッセージボックス、ビュー切り替えなど) を使用するよ
const { showMessageBox, VIEWS, showView } = window;


/**
 * 検索ボタンがクリックされたときに、地域名とtenki.jpを組み合わせてGoogle検索を実行する関数だよ！
 */
function searchWeather() {
    const inputElement = document.getElementById('weather-city-input');
    const city = inputElement.value.trim();
    if (city) {
        // ユーザーは嘉手納町にいると知っているから、適切な検索キーワードを生成するよ！
        const searchCity = city === '嘉手納町' ? '嘉手納町 tenki.jp' : `${city} tenki.jp`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchCity)}`;
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
    const okinawaTenkiUrl = 'https://tenki.jp/forecast/10/'; 

    return `
        <div class="p-6 pt-10 min-h-full bg-blue-50">
            <!-- ヘッダーと戻るボタン -->
            <div class="flex items-center justify-between mb-8">
                <!-- まっちゃアプリのマイアプリ画面に戻る -->
                <button onclick="showView(VIEWS.MY_APPS)" class="text-blue-600 hover:text-blue-800 transition duration-150 transform active:scale-90">
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
                
                <!-- 1. 地域の名前を入力して検索する機能 -->
                <div class="flex flex-col space-y-4">
                    <input type="text" id="weather-city-input"
                        class="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring focus:ring-red-100 transition duration-150 text-lg placeholder-gray-500"
                        placeholder="例: 那覇、東京、札幌"
                        value="嘉手納町" 
                    >
                    <button onclick="window.weatherPortal.searchWeather()" 
                        class="w-full py-4 bg-red-500 text-white text-xl font-extrabold rounded-xl shadow-xl 
                           hover:bg-red-600 active:bg-red-700 transition duration-150 transform active:scale-98 flex items-center justify-center">
                        <i data-lucide="map-search" class="w-6 h-6 mr-3"></i>
                        地域の詳細天気をチェック！
                    </button>
                    <p class="mt-2 text-sm text-gray-500 text-center">※入力した地域名とtenki.jpを組み合わせて検索結果を表示するよ。</p>
                </div>


                <div class="w-full border-t-2 border-gray-200 my-6"></div>

                <h3 class="text-xl font-semibold text-gray-700 mb-4">
                    沖縄に直行したいならこちら！
                </h3>
                
                <!-- 2. 沖縄のtenki.jpへ直行ボタン -->
                <a href="${okinawaTenkiUrl}" target="_blank"
                    class="w-full inline-flex items-center justify-center py-3 px-6 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-lg 
                           hover:bg-blue-600 active:bg-blue-700 transition duration-150 transform active:scale-98">
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

// ページが完全にロードされ、アプリビューに切り替わった後に実行するフックだよ！
function onWeatherAppLaunched() {
    window.lucide.createIcons(); 
}

// 全国天気ポータルアプリの公開オブジェクト
const weatherPortalApp = {
    id: 'weather_portal',
    name: '全国天気ポータル ✅',
    icon: '🗾',
    description: '信頼性の高い天気サイトへ一発アクセス！特に沖縄を優遇したよ！',
    renderFunction: renderWeatherApp,
    onLaunch: onWeatherAppLaunched,
    // 重要なロジックをグローバルに公開する
    searchWeather: searchWeather
};

// 呼び出しやすくするために、ロジック関数をグローバルオブジェクトにまとめて追加する
window.weatherPortal = {
    searchWeather: searchWeather
};

export default weatherPortalApp;
