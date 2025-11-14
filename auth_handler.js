// ===================================
// ★★★ まっちゃアカウント連携機能（警備員の仕事） ★★★
// ===================================
const authContainer = document.getElementById('auth-container');

// ページが読み込まれたら、すぐに監視を開始する！
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (authContainer) {
            if (user) {
                // --- ログインしている時 ---
                const username = user.email.split('@')[0];
                authContainer.innerHTML = `
                    <div class="text-right">
                        <p class="font-semibold text-gray-700">ようこそ、${username}さん</p>
                        <button id="logout-button" class="text-blue-600 hover:underline">ログアウト</button>
                    </div>
                `;
                document.getElementById('logout-button').addEventListener('click', () => {
                    auth.signOut();
                });
            } else {
                // --- ログアウトしていない時 ---
                authContainer.innerHTML = `
                    <button id="login-button" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                        まっちゃアカウントでログイン
                    </button>
                `;
                document.getElementById('login-button').addEventListener('click', handleLogin);
            }
        }
    });
});


// ログインボタンが押された時の処理
function handleLogin() {
    const username = prompt("まっちゃIDを入力してください");
    if (!username) return;
    const password = prompt("パスワードを入力してください");
    if (!password) return;

    const email = username.trim() + '@account.matcha-kame.com';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log("ログイン成功！", userCredential.user.email);
        })
        .catch(error => {
            alert("ログインに失敗しました。\nエラー: " + error.message);
        });
}
