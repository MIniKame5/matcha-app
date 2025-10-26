/**
 * app_loader.js
 *
 * このファイルは、アプリフォルダ (apps/) 内の各アプリファイルを動的に読み込み、
 * そのデータを index.html で使用できるように window.APPS_DATA に集約する役割を担うよ！
 */

// アプリケーションデータはここで集約される
window.APPS_DATA = {};

/**
 * アプリのファイルを読み込み、グローバルな APPS_DATA に登録するよ！
 * @param {string} modulePath - アプリファイルの相対パス (例: 'apps/meal_planner.js')
 */
async function loadAppModule(modulePath) {
    try {
        // ESモジュールとして読み込む (重要!)
        const module = await import(`./${modulePath}`);
        
        // 各モジュールは default export としてアプリの定義 (OBJECT) を提供すると想定する
        const appDefinition = module.default;

        if (appDefinition && appDefinition.id) {
            window.APPS_DATA[appDefinition.id] = appDefinition;
            console.log(`✅ アプリロード成功: ${appDefinition.name} (${appDefinition.id})`);
        } else {
            console.error(`❌ アプリロード失敗: ${modulePath} - appDefinitionまたはidが見つかりません。`);
        }
    } catch (error) {
        console.error(`❌ モジュール読み込みエラー: ${modulePath}`, error);
    }
}

/**
 * 起動時に全てのアプリを読み込むよ！
 */
async function loadAllApps() {
    // 【重要】ここで読み込むアプリのリストを静的に定義するよ！
    // GitHub Pagesで動的なファイル一覧取得は難しいから、手動で登録するのが確実だね！
    const appFiles = [
        'apps/meal_planner.js',
        'apps/weather_portal.js' // これから作る新しい天気アプリファイル
        // 今後アプリが増えたら、ここにどんどん追加していけばOK！
    ];

    const loadPromises = appFiles.map(loadAppModule);
    await Promise.all(loadPromises);

    // index.htmlの初期化処理を先に進めるために解決を通知
    if (window.resolveAppLoader) {
        window.resolveAppLoader();
    }
}

// アプリのロードを開始する
loadAllApps();
